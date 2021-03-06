// @flow
/*jshint esversion: 6 */
/*jslint node: true */
"use strict";

const {ipcRenderer} = require("electron");
// FIXME: unused List
const {List} = require("immutable");
const Qrcode = require("qrcode");

function logIpc(msgType) {
    ipcRenderer.on(msgType, (...args) => {
        console.log(`IPC Message: ${msgType}, Args:`);
        for (let i = 0; i < args.length; i++)
            console.log(args[i]);
    });
}

// sed -r -n "/\.send/{s/.*send\("([^"]+)".*/logIpc("\1");/p}" main.js|sort -u
logIpc("call-get-wallets");
logIpc("check-login-response");
logIpc("generate-wallet-response");
logIpc("get-settings-response");
logIpc("get-transaction-update");
logIpc("get-wallet-by-name-response");
//logIpc("get-wallets-response");
logIpc("refresh-wallet-response");
//logIpc("rename-wallet-response");
logIpc("render-qr-code");
logIpc("save-settings-response");
logIpc("send-finish");
logIpc("show-notification-response");
logIpc("update-wallet-balance");
logIpc("verify-login-response");
logIpc("write-login-response");
logIpc("zz-get-wallets");

let addrListNode = document.getElementById("addrList");
const txListNode = document.getElementById("txList");
const totalBalanceNode = document.getElementById("totalBalance");
const depositTabButton = document.getElementById("depositTabButton");
const depositToButton = document.getElementById("depositToButton");
const depositToAddrInput = document.getElementById("depositToAddr");
const depositAmountInput = document.getElementById("depositAmount");
const depositMsg = document.getElementById("depositMsg");
const depositQrcodeImage = document.getElementById("depositQrcodeImg");
const withdrawTabButton = document.getElementById("withdrawTabButton");
// FIXME: withdrawAvailBalanceNode unused
const withdrawAvailBalanceNode = document.getElementById("withdrawAvailBalance");
const withdrawFromButton = document.getElementById("withdrawFromButton");
const withdrawFromAddrInput = document.getElementById("withdrawFromAddr");
const withdrawToButton = document.getElementById("withdrawToButton");
const withdrawToAddrInput = document.getElementById("withdrawToAddr");
const withdrawAmountInput = document.getElementById("withdrawAmount");
const withdrawFeeInput = document.getElementById("withdrawFee");
const withdrawMsg = document.getElementById("withdrawMsg");
const withdrawButton = document.getElementById("withdrawButton");
const withdrawStatusTitleNode = document.getElementById("withdrawStatusTitle");
const withdrawStatusBodyNode = document.getElementById("withdrawStatusBody");

const refreshTimeout = 300;
let refreshTimer;
let showZeroBalances = false;
let depositQrcodeTimer;
const myAddrs = new Set();

// ---------------------------------------------------------------------------------------------------------------------
// IPC
ipcRenderer.on("get-wallets-response", (event, msgStr) => {
    const msg = JSON.parse(msgStr);
    checkResponse(msg);
    clearChildNodes(addrListNode);
    clearChildNodes(txListNode);
    // TODO: sort like txs
    addAddresses(msg.wallets);
    addTransactions(msg.transactions);
    setTotalBalance(msg.total);
    scheduleRefresh();
});

ipcRenderer.on("update-wallet-balance", (event, msgStr) => {
    const msg = JSON.parse(msgStr);
    checkResponse(msg);
    setAddressBalance(msg.wallet, msg.balance);
    setTotalBalance(msg.total);
});

ipcRenderer.on("get-transaction-update", (event, msgStr) => {
    const txObj = JSON.parse(msgStr);
    txObj.amount = parseFloat(txObj.amount);
    addTransactions([txObj], true);
});

ipcRenderer.on("refresh-wallet-response", (event, msgStr) => {
    const msg = JSON.parse(msgStr);
    checkResponse(msg);
    scheduleRefresh();
});

ipcRenderer.on("send-finish", (event, result, msg) =>
    updateWithdrawalStatus(result, msg));

ipcRenderer.on("rename-wallet-response", (event, msgStr) => {
    const msg = JSON.parse(msgStr);
    checkResponse(msg);
    setAddressName(msg.addr, msg.newname);
});

ipcRenderer.on("generate-wallet-response", (event, msgStr) => {
    const msg = JSON.parse(msgStr);
    checkResponse(msg);
    addNewAddress(msg.addr);
});

window.addEventListener("load", initWallet);

// FUNCTIONS
function checkResponse(resp) {
    if (resp.response !== "OK") {
        console.error(resp);
        throw new Error("Failed response");
    }
}

// Expects a balance node with one balanceAmount child node
function setBalanceText(balanceNode, balance) {
    const balanceAmountNode = balanceNode.firstElementChild;
    balanceAmountNode.textContent = formatBalance(balance);
    if (balance > 0)
        balanceNode.classList.add("positive");
    else
        balanceNode.classList.remove("positive");
}

function createAddrItem(addrObj) {
    const addrItem = cloneTemplate("addrItemTemplate");

    addrItem.dataset.addr = addrObj.addr;
    addrItem.dataset.name = addrObj.name || '';

    if (addrObj.name) {
        addrItem.getElementsByClassName("addrName")[0].textContent = addrObj.name;
    }
    addrItem.getElementsByClassName("addrText")[0].textContent = addrObj.addr;
    addrItem.getElementsByClassName("addrNameLine")[0]
        .addEventListener("click", () => showAddrDetail(addrItem));
    addrItem.getElementsByClassName("addrDepositButton")[0]
        .addEventListener("click", () => {
            depositToAddrInput.value = addrObj.addr;
            updateDepositQrcode();
            depositTabButton.click();
        });
    addrItem.getElementsByClassName("addrWithdrawButton")[0]
        .addEventListener("click", () => {
            withdrawFromAddrInput.value = addrObj.addr;
            validateWithdrawForm();
            withdrawTabButton.click();
        });

    setAddrItemBalance(addrItem, addrObj.lastbalance);
    return addrItem;
}

function setAddrItemBalance(addrItem, balance) {
    addrItem.dataset.balance = balance;
    hideElement(addrItem, balance === 0 && !showZeroBalances);
    const balanceNode = addrItem.getElementsByClassName("addrBalance")[0];
    setBalanceText(balanceNode, balance);
    const withdrawButton = addrItem.getElementsByClassName("addrWithdrawButton")[0];
    withdrawButton.disabled = balance === 0;
}

function showAddrDetail(addrItem) {
    showDialogFromTemplate("addrDialogTemplate", dialog => {
        const addrData = addrItem.dataset;
        dialog.querySelector(".addrDetailAddr").textContent = addrData.addr;
        setBalanceText(dialog.querySelector(".addrDetailBalance"), parseFloat(addrData.balance));
        const nameNode = dialog.querySelector(".addrDetailName");
        nameNode.value = addrData.name;
        dialog.querySelector(".addrInfoLink").addEventListener("click", () => openZenExplorer("address/" + addrData.addr));
        const saveButton = dialog.querySelector(".addrDetailSave");
        saveButton.addEventListener("click", ev => {
            ipcRenderer.send("rename-wallet", addrData.addr, nameNode.value);
        });
        dialog.addEventListener("keypress", ev => {
            if (event.keyCode == 13)
                saveButton.click();
        });
    });
}

// Expects a node with one amount child node
function setTxBalanceText(node, balance) {
    let balanceStr, balanceClass;
    if (balance >= 0) {
        balanceStr = "+" + formatBalance(balance);
        balanceClass = "positive";
    } else {
        balanceStr = "-" + formatBalance(-balance);
        balanceClass = "negative";
    }
    node.classList.add(balanceClass);
    const amountNode = node.firstElementChild;
    amountNode.textContent = balanceStr;
}

function createTxItem(txObj, newTx = false) {
    const node = txObj.block >= 0 ? cloneTemplate("txItemTemplate") : cloneTemplate("txMempoolItemTemplate");
    node.dataset.txid = txObj.txid;
    node.dataset.blockheight = txObj.block;
    if (txObj.block >= 0)
        node.querySelector(".txDate").textContent = formatEpochTime(txObj.time * 1000);
    setTxBalanceText(node.querySelector(".txBalance"), txObj.amount);
    if (newTx)
        node.classList.add("txItemNew");
    node.addEventListener("click", () => showTxDetail(txObj));
    return node;
}

function showTxDetail(txObj) {
    const templateId = txObj.block >= 0 ? "txDialogTemplate" : "mempoolTxDialogTemplate";
    showDialogFromTemplate(templateId, dialog => {
        dialog.querySelector(".txDetailTxId").textContent = txObj.txid;
        dialog.querySelector(".txInfoLink").addEventListener("click", () => openZenExplorer("tx/" + txObj.txid));
        setTxBalanceText(dialog.querySelector(".txDetailAmount"), txObj.amount);
        const vinListNode = dialog.querySelector(".txDetailFrom");
        txObj.vins.split(",").sort().forEach(addr => {
            const node = document.createElement("div");
            node.textContent = addr;
            if (myAddrs.has(addr))
                node.classList.add("negative");
            vinListNode.append(node);
        });
        const voutListNode = dialog.querySelector(".txDetailTo");
        txObj.vouts.split(",").sort().forEach(addr => {
            const node = document.createElement("div");
            node.textContent = addr;
            if (myAddrs.has(addr))
                node.classList.add("positive");
            voutListNode.append(node);
        });
        if (txObj.block >= 0) {
            dialog.querySelector(".txDetailDate").textContent = formatEpochTime(txObj.time * 1000);
            dialog.querySelector(".txDetailBlock").textContent = txObj.block;
        }
    });
}

function addNewAddress(addrObj) {
    myAddrs.add(addrObj.addr);
    const addrItem = createAddrItem(addrObj);
    addrListNode.appendChild(addrItem);
    sortAddrItems();
    if (addrObj.lastbalance === 0 && !showZeroBalances)
        hideElement(addrItem, true);
    else
        scrollIntoViewIfNeeded(addrListNode, addrItem);
}

function addAddresses(addrs) {
    addrs.forEach(addrObj => {
        myAddrs.add(addrObj.addr);
        const addrItem = createAddrItem(addrObj);
        hideElement(addrItem, addrObj.lastbalance === 0 && !showZeroBalances);
        addrListNode.appendChild(addrItem);
    });
    sortAddrItems();
}

function sortAddrItems() {
    const oldScrollTop = addrListNode.scrollTop;
    const sortedAddrItems = [...addrListNode.childNodes].sort((a, b) => {
        const balA = parseFloat(a.dataset.balance);
        const balB = parseFloat(b.dataset.balance);
        if (balA === balB) {
            const nameA = a.dataset.name || '';
            const nameB = b.dataset.name || '';
            if (nameA === nameB) {
                const addrA = a.dataset.addr;
                const addrB = b.dataset.addr;
                return addrA.localeCompare(addrB);
            } else {
                if (nameA === '')
                    return 1;
                else if (nameB === '')
                    return -1;
                else
                    return nameA.localeCompare(nameB);
            }
        } else
            return balB - balA;
    });
    const newAddrListNode = addrListNode.cloneNode(false);
    newAddrListNode.append(...sortedAddrItems);
    addrListNode.parentNode.replaceChild(newAddrListNode, addrListNode);
    addrListNode = newAddrListNode;
    newAddrListNode.scrollTop = oldScrollTop;
}

function setAddressBalance(addr, balance) {
    const addrItem = addrListNode.querySelector(`[data-addr='${addr}']`);
    setAddrItemBalance(addrItem, balance);
    sortAddrItems();
}

function setAddressName(addr, name) {
    const addrItem = addrListNode.querySelector(`[data-addr='${addr}']`);
    addrItem.dataset.name = name;
    const displayName = name ? name : "Unnamed address";
    addrItem.querySelector(".addrName").textContent = displayName;
    sortAddrItems();
    scrollIntoViewIfNeeded(addrListNode, addrItem);
}

function showNewAddrDialog() {
    showDialogFromTemplate("newAddrDialogTemplate", dialog => {
        const createButton = dialog.querySelector(".newAddrDialogCreate");
        createButton.addEventListener("click", () => {
            ipcRenderer.send("generate-wallet", dialog.querySelector(".newAddrDialogName").value);
            dialog.close();
        });
        dialog.addEventListener("keypress", ev => {
            if (event.keyCode == 13)
                createButton.click();
        });
    });
}

function addTransactions(txs, newTx = false) {
    txs.sort((a, b) => {
        if ((a.block - b.block) === 0) {
            return 0;
        } else if (a.block < 0) {
            return 1;
        } else if (b.block < 0) {
            return -1;
        }
        return a.block - b.block;
    });

    for (const txObj of txs) {
        const oldTxItem = txListNode.querySelector(`[data-txid='${txObj.txid}']`);
        if (oldTxItem) {
            if (oldTxItem.dataset.blockheight !== "-1") {
                console.error("Attempting to replace transaction in block");
            } else if (txObj.block >= 0) {
                txListNode.replaceChild(createTxItem(txObj, newTx), oldTxItem);
            }
        } else {
            txListNode.prepend(createTxItem(txObj, newTx));
        }
    }
}

function setTotalBalance(balance) {
    setBalanceText(totalBalanceNode, balance);
}

function toggleZeroBalanceAddrs() {
    showZeroBalances = !showZeroBalances;
    [...addrListNode.querySelectorAll("[data-balance='0']")]
        .forEach(node => hideElement(node, !showZeroBalances));
}

function scheduleRefresh() {
    if (refreshTimer)
        clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => refresh(), refreshTimeout * 1000);
}

function refresh() {
    ipcRenderer.send("refresh-wallet");
    scheduleRefresh();
}

function showAddrSelectDialog(zeroBalanceAddrs, onSelected) {
    showDialogFromTemplate("addrSelectDialogTemplate", dialog => {
        const listNode = dialog.querySelector(".addrSelectList");
        for (const addrItem of addrListNode.children) {
            const balance = parseFloat(addrItem.dataset.balance);
            if (!zeroBalanceAddrs && !balance)
                continue;
            const row = cloneTemplate("addrSelectRowTemplate");
            row.querySelector(".addrSelectRowName").textContent = addrItem.dataset.name;
            row.querySelector(".addrSelectRowAddr").textContent = addrItem.dataset.addr;
            setBalanceText(row.querySelector(".addrSelectRowBalance"), balance);
            row.addEventListener("click", () => {
                dialog.close();
                onSelected(addrItem.dataset.addr);
            })
            listNode.appendChild(row)
        }
    });
}

function initDepositView() {
    const qrcodeTypeDelay = 500; // ms
    depositToAddrInput.addEventListener("input", () => updateDepositQrcode(qrcodeTypeDelay));
    depositAmountInput.addEventListener("input", () => updateDepositQrcode(qrcodeTypeDelay));
    depositToButton.addEventListener("click", () => showAddrSelectDialog(true, addr => {
    depositToAddrInput.addEventListener("input", () => updateDepositQrcode(qrcodeTypeDelay));
        depositToAddrInput.value = addr;
        updateDepositQrcode();
    }));
}

function updateDepositQrcode(qrcodeDelay = 0) {
    const qrcodeOpts = {
        errorCorrectionLevel: "H",
        scale: 5,
        color: {dark: "#000000ff", light: "#fefefeff"}
    };

    const toAddr = depositToAddrInput.value;
    const amount = parseFloat(depositAmountInput.value || 0);

    if (!toAddr) {
        depositMsg.textContent = "WARNING: To address is empty";
    } else if (!addrListNode.querySelector(`[data-addr='${toAddr}']`)) {
        depositMsg.textContent = "WARNING: To address does not belong to this wallet";
    } else if (!amount) {
        depositMsg.textContent = "WARNING: Amount is not positive";
    } else {
        depositMsg.textContent = "\xA0"; // &nbsp;
    }
    if (depositQrcodeTimer) {
        clearTimeout(depositQrcodeTimer);
    }
    depositQrcodeTimer = setTimeout(() => {
        const json = {symbol: "zen", tAddr: toAddr, amount: amount};
        Qrcode.toDataURL(JSON.stringify(json), qrcodeOpts, (err, url) => {
            if (err)
                console.log(err);
            else
                depositQrcodeImage.src = url;
            depositQrcodeTimer = null;
        });
    }, qrcodeDelay);
}

function initWithdrawView() {
    withdrawFromAddrInput.addEventListener("input", validateWithdrawForm);
    withdrawToAddrInput.addEventListener("input", validateWithdrawForm);
    withdrawAmountInput.addEventListener("input", validateWithdrawForm);
    withdrawFeeInput.addEventListener("input", validateWithdrawForm);
    withdrawButton.addEventListener("click", () => {
        if (confirm("Do you really want to send this transaction?")) {
            ipcRenderer.send("send",
                withdrawFromAddrInput.value,
                withdrawToAddrInput.value,
                withdrawFeeInput.value,
                withdrawAmountInput.value);
        }
    });
    withdrawFromButton.addEventListener("click", () => showAddrSelectDialog(false, addr => {
        withdrawFromAddrInput.value = addr;
        validateWithdrawForm();
    }));
    withdrawToButton.addEventListener("click", () => showAddrSelectDialog(true, addr => {
        withdrawToAddrInput.value = addr;
        validateWithdrawForm();
    }));
    validateWithdrawForm();
}

function validateWithdrawForm() {
    const fromAddr = withdrawFromAddrInput.value;
    const toAddr = withdrawToAddrInput.value;
    const amount = parseFloat(withdrawAmountInput.value || 0);
    const fee = parseFloat(withdrawFeeInput.value || 0);

    withdrawButton.disabled = true;
    setBalanceText(withdrawAvailBalance, 0);

    if (!fromAddr) {
        withdrawMsg.textContent = "ERROR: The From address is empty";
        return;
    }

    const fromAddrItem = addrListNode.querySelector(`[data-addr='${fromAddr}']`);
    if (!fromAddrItem) {
        withdrawMsg.textContent = "ERROR: The From address does not belong to this wallet";
        return;
    }

    const fromBalance = parseFloat(fromAddrItem.dataset.balance);
    setBalanceText(withdrawAvailBalance, fromBalance);

    if (!toAddr) {
        withdrawMsg.textContent = "ERROR: The To address is empty";
        return;
    }
    if (!amount) {
        withdrawMsg.textContent = "ERROR: The amount is not positive";
        return;
    }
    if (amount + fee > fromBalance) {
        withdrawMsg.textContent = "ERROR: Insufficient funds on the From address";
        return;
    }

    withdrawMsg.textContent = "\xA0"; // &nbsp;
    withdrawButton.disabled = false;
}

function updateWithdrawalStatus(result, msg) {
    if (result === "error") {
        withdrawStatusTitleNode.classList.add("withdrawStatusBad");
        withdrawStatusTitleNode.textContent = "Error:"
    } else if (result === "ok") {
        withdrawStatusTitleNode.classList.remove("withdrawStatusBad");
        withdrawStatusTitleNode.textContent = "Transaction has been successfully sent";
    }
    withdrawStatusBodyNode.innerHTML = msg;
}

function initWallet() {
    fixLinks();
    initDepositView();
    initWithdrawView();
    document.getElementById("actionShowZeroBalances").addEventListener("click", toggleZeroBalanceAddrs);
    document.getElementById("refreshButton").addEventListener("click", refresh);
    document.getElementById("createNewAddrButton").addEventListener("click", showNewAddrDialog);
    [...document.getElementsByClassName("amountInput")].forEach(node => {
        node.addEventListener("change", () => {
            node.value = parseFloat(node.value).toFixed(8);
        });
    });
    ipcRenderer.send("get-wallets");
}
