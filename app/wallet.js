// @flow
/*jshint esversion: 6 */
/*jslint node: true */
"use strict";

const zencashjs = require("zencashjs");

function setButtonActive(className) {
    document.getElementById(className).style.backgroundColor = "transparent";
    document.getElementById(className).style.border = "1px #f88900 solid";
    document.getElementById(className).style.color = "#f88900";
}

function setButtonInactive(className) {
    document.getElementById(className).style.backgroundColor = "#f88900";
    document.getElementById(className).style.border = "1px #f88900 solid";
    document.getElementById(className).style.color = "#fefefe";
}

function showSend() {
    document.getElementById("receive").style.display = "none";
    document.getElementById("mywallet").style.display = "none";
    document.getElementById("send").style.display = "block";
    setButtonActive("sendButtonMenu");
    setButtonInactive("receiveButtonMenu");
    setButtonInactive("myWalletButtonMenu");
}

function showReceive() {
    document.getElementById("send").style.display = "none";
    document.getElementById("mywallet").style.display = "none";
    document.getElementById("receive").style.display = "block";
    setButtonActive("receiveButtonMenu");
    setButtonInactive("sendButtonMenu");
    setButtonInactive("myWalletButtonMenu");
}

function showWallet() {
    document.getElementById("send").style.display = "none";
    document.getElementById("mywallet").style.display = "block";
    document.getElementById("receive").style.display = "none";
    setButtonActive("myWalletButtonMenu");
    setButtonInactive("sendButtonMenu");
    setButtonInactive("receiveButtonMenu");
}

function changeAmount() {
    let number = document.getElementById("coinAmount").value;
    /* Input value is Not A Number*/
    if (Number.isNaN(Number(number))) {
        document.getElementById("coinAmount").value = Number(0).toFixed(8);
        return;
    }
    /* Number has to be greater or equal to zero */
    if (number < 0) {
        document.getElementById("coinAmount").value = Number(0).toFixed(8);
        return;
    }
    console.log(number);
    document.getElementById("coinAmount").value = Number(number).toFixed(8);
}

function clearValue() {
    if (document.getElementById("sendToAddress").value === "address") {
        document.getElementById("sendToAddress").value = "";
    }
}

function setValueIfEmpty() {
    if (document.getElementById("sendToAddress").value === "") {
        document.getElementById("sendToAddress").value = "address";
    }
}

function hideBalances() {
    if (document.getElementById("hideZeroBalancesButton").textContent === "Hide Zero Balances") {
        for (let i = 0, j = 1; i < document.getElementById("walletList").childElementCount; i += 1) {
            if (document.getElementById("walletList").childNodes[i].childNodes[1].innerText === "0.00000000") {
                document.getElementById("walletList").childNodes[i].classList.add("walletListItemZero");
            } else {
                document.getElementById("walletList").childNodes[i].classList.remove("walletListItemOdd");
                if (j === 2) {
                    j = 0;
                    document.getElementById("walletList").childNodes[i].classList.add("walletListItemOdd");
                }
                j++;
            }
        }
        document.getElementById("hideZeroBalancesButton").textContent = "Show Zero Balances";
        document.getElementById("hideZeroBalancesButton").classList.remove("balancesButtonHide");
        document.getElementById("hideZeroBalancesButton").classList.add("balancesButtonShow");
    } else {
        for (let i = 0; i < document.getElementById("walletList").childElementCount; i += 1) {
            document.getElementById("walletList").childNodes[i].classList.remove("walletListItemZero");
            document.getElementById("walletList").childNodes[i].classList.remove("walletListItemOdd");
            if (i % 2 === 0) document.getElementById("walletList").childNodes[i].classList.add("walletListItemOdd");
        }
        document.getElementById("hideZeroBalancesButton").textContent = "Hide Zero Balances";
        document.getElementById("hideZeroBalancesButton").classList.remove("balancesButtonShow");
        document.getElementById("hideZeroBalancesButton").classList.add("balancesButtonHide");
    }
}

function send() {
    let fromAddress = document.getElementById("sendFromAddressText").textContent;
    let toAddress = document.getElementById("sendToAddress").value;
    let fee = document.getElementById("coinFee").value;
    let amount = document.getElementById("coinAmount").value;

    console.log(fromAddress);
    console.log(toAddress);
    console.log(fee);
    console.log(amount);

    // Convert to satoshis
    let amountInSatoshi = Math.round(amount * 100000000);
    if (fee === "default"){
        fee = 0.0001;
    }
    let feeInSatoshi = Math.round(fee * 100000000);


    // Reset zen send progress
    // Alert messages too
    let errString = "";

    if (fromAddress.length !== 35) {
        // TODO: handle error
        errString += "\n\n"
    }

    if (toAddress.length !== 35) {
        // TODO: handle error
        errString += "\n\n"
    }

    if (typeof parseInt(amount) !== "number" || amount === "") {
        // TODO: handle error
        errString += "\n\n"
    }

    if (amountInSatoshi <= 0){
        // TODO: handle error
        errString += "\n\n"
    }

    if (typeof parseInt(feeInSatoshi) !== "number" || amount === ""){
        // TODO: handle error
        errString += "\n\n"
    }

    // Alert errors
    if (errString !== ""){
        alert(errString);
    }

    // TODO: implement this, where to get privateKey?
    //
    // const myPrivateKey = zencashjs.address.WIFToPrivKey();
    //
    // // Get previous transactions
    // const prevTxURL = urlAppend(this.props.settings.insightAPI, 'addr/') + senderAddress + '/utxo'
    // const infoURL = urlAppend(this.props.settings.insightAPI, 'status?q=getInfo')
    // const sendRawTxURL = urlAppend(this.props.settings.insightAPI, 'tx/send')
    //
    // // Building our transaction TXOBJ How many satoshis do we have so far
    // var satoshisSoFar = 0
    // var history = []
    // var recipients = [{address: recipientAddress, satoshis: satoshisToSend}]
    //
    // // Get previous unspent transactions
    // cordovaHTTP.get(prevTxURL, {}, {}, function(tx_resp){
    //     this.setProgressValue(25)
    //
    //     const tx_data = JSON.parse(tx_resp.data)
    //
    //     // Get blockheight and hash
    //     cordovaHTTP.get(infoURL, {}, {}, function(info_resp){
    //         this.setProgressValue(50)
    //         const info_data = JSON.parse(info_resp.data)
    //
    //         const blockHeight = info_data.info.blocks - 300
    //         const blockHashURL = urlAppend(this.props.settings.insightAPI, 'block-index/') + blockHeight
    //
    //         // Get block hash
    //         cordovaHTTP.get(blockHashURL, {}, {}, function(response_bhash){
    //             this.setProgressValue(75)
    //
    //             const blockHash = JSON.parse(response_bhash.data).blockHash
    //
    //             // Iterate through each utxo
    //             // append it to history
    //             for (var i = 0; i < tx_data.length; i++){
    //                 if (tx_data[i].confirmations === 0) {
    //                     continue;
    //                 }
    //
    //                 history = history.concat({
    //                     txid: tx_data[i].txid,
    //                     vout: tx_data[i].vout,
    //                     scriptPubKey: tx_data[i].scriptPubKey,
    //                 });
    //
    //                 // How many satoshis do we have so far
    //                 satoshisSoFar = satoshisSoFar + tx_data[i].satoshis;
    //                 if (satoshisSoFar >= satoshisToSend + satoshisfeesToSend){
    //                     break;
    //                 }
    //             }
    //
    //             // If we don't have enough address
    //             // fail and tell user
    //             if (satoshisSoFar < satoshisToSend + satoshisfeesToSend){
    //                 alert(TRANSLATIONS[CUR_LANG].SendPage.notEnoughZEN)
    //                 this.setProgressValue(0)
    //                 return
    //             }
    //
    //             // If we don't have exact amount
    //             // Refund remaining to current address
    //             if (satoshisSoFar !== satoshisToSend + satoshisfeesToSend){
    //                 var refundSatoshis = satoshisSoFar - satoshisToSend - satoshisfeesToSend
    //                 recipients = recipients.concat({address: senderAddress, satoshis: refundSatoshis})
    //             }
    //
    //             // Create transaction
    //             var txObj = zencashjs.transaction.createRawTx(history, recipients, blockHeight, blockHash)
    //
    //             // Sign each history transcation
    //             for (var i = 0; i < history.length; i ++){
    //                 txObj = zencashjs.transaction.signTx(txObj, i, senderPrivateKey, true)
    //             }
    //
    //             // Convert it to hex string
    //             const txHexString = zencashjs.transaction.serializeTx(txObj)
    //
    //             // Post it to the api
    //             cordovaHTTP.post(sendRawTxURL, {rawtx: txHexString}, {}, function(sendtx_resp){
    //                 const tx_resp_data = JSON.parse(sendtx_resp.data)
    //
    //                 this.setState({
    //                     progressValue: 100,
    //                     sendTxid: tx_resp_data.txid
    //                 })
    //             }.bind(this), (err) => { alert('ERROR: ' + JSON.stringify(err)); this.setProgressValue(0) })
    //         }.bind(this), (err) => { alert('ERROR: ' + JSON.stringify(err)); this.setProgressValue(0) })
    //     }.bind(this), (err) => { alert('ERROR: ' + JSON.stringify(err)); this.setProgressValue(0) })
    // }.bind(this), (err) => { alert('ERROR: ' + JSON.stringify(err)); this.setProgressValue(0) })
}

function showDarkContainer() {
    document.getElementById("darkContainer").style.transition = "0.5s";
    document.getElementById("darkContainer").style.zIndex = "1";
    document.getElementById("darkContainer").style.opacity = "0.7";
}

function addWalletDialog() {
    showDarkContainer();
    document.getElementById("addWalletDialog").style.zIndex = "2";
    document.getElementById("addWalletDialog").style.opacity = "1";
}

function pickWalletDialog() {
    showDarkContainer();
    document.getElementById("pickWalletDialog").style.zIndex = "2";
    document.getElementById("pickWalletDialog").style.opacity = "1";
}

function walletDetailsDialog(address, balance, name) {
    showDarkContainer();
    document.getElementById("walletDetailsDialog").style.zIndex = "2";
    document.getElementById("walletDetailsDialog").style.opacity = "1";
    document.getElementById("walletDetailsDialogContent").innerHTML = "";
    if (name !== "") {
        document.getElementById("walletDetailsDialogContent").innerHTML += "<label class=\"walletDetailsItemLabel\" for=\"walletName\">Name: </label> <div class=\"right\"><input id=\"walletName\" class=\"wallet_inputs\" align=\"right\" value=\""+ name +"\"></div>";
    } else {
        document.getElementById("walletDetailsDialogContent").innerHTML += "<label class=\"walletDetailsItemLabel\" for=\"walletName\">Name: </label> <div class=\"right\"><input id=\"walletName\" class=\"wallet_inputs\" align=\"right\" value=\"Not defined\"></div>";
    }
    document.getElementById("walletDetailsDialogContent").innerHTML += "<div class=\"walletDetailsItemLabel\">Address:</div> <div class=\"right\"> <div class=\"walletDetailsItem\">"+address+"</div></div>";
    document.getElementById("walletDetailsDialogContent").innerHTML += "<div class=\"walletDetailsItemLabel\">Balance:</div> <div class=\"right\"> <div class=\"walletDetailsItem walletDetailsItemBalance\">"+Number(balance).toFixed(8)+"</div></div>";
    document.getElementById("walletDetailsDialogContent").innerHTML += "<button class=\"buttons walletDetailsRenameButton\">Rename wallet</button>";
}

function closeAllWalletsDialogs() {
    closeDialog("walletDetailsDialog");
    closeDialog("addWalletDialog");
    closeDialog("pickWalletDialog");
    closeNav();
}

function closeDialog(clasname) {
    closeDarkContainer();
    document.getElementById(clasname).style.zIndex = "-1";
    document.getElementById(clasname).style.opacity = "0";
}

function printWallet(wId, wName, wBalance, wAddress, verbose = true) {
    let walletClass = "";
    let walletTitle = "";

    let walletBalance;
    let walletAddress = "";
    let walletEnd = "</div>";
    if (wName === "Messenger Wallet") {
        walletClass = "<div class=\"walletListItem walletListItemChat\">";
        walletTitle = "<span class=\"walletListItemTitleChat\">Messenger Wallet</span>";
    } else {
        if ((wId % 2) === 0) {
            walletClass = "<div class=\"walletListItem walletListItemOdd\">";
        } else {
            walletClass = "<div class=\"walletListItem\">";
        }
        if (verbose) {
            walletTitle = "<span class=\"walletListItemAddress walletListItemTitle\">" + wName + "</span>";
        } else {
            if (wName !== "") {
                walletTitle = "<span class=\"walletListItemAddress walletListItemTitle\">" + wName + "</span>";
            } else {
                walletTitle = "<span class=\"walletListItemAddress walletListItemTitle\"> " + wAddress + "</span>";
            }
        }
    }
    walletBalance = "<span id=\"balance_" + wAddress + "\" class=\"walletListItemAddress walletListItemBalance\"><b>" + Number(wBalance).toFixed(8) + "</b></span> ZEN";
    if (verbose) {
        walletAddress = "<span class=\"walletListItemAddress\"><b>Address </b> " + wAddress + "</span><a href=\"javascript:void(0)\" class=\"walletListItemDetails\" onclick=\"walletDetailsDialog(" + wId + ")\">Details</a>";
    }
    return walletClass + walletTitle + walletBalance + walletAddress + walletEnd;
}

function parseTransactionAddresses(rawTransaction) {
    let addresses = Array();
    // TODO: parse addresses from rawTransaction (in/out)
    // output: LIST [in/out, address]
}

/**
 * Find user address in transaction with information about income/outcome
 * @param rawTransaction - transaction object
 * @param wallets - wallet list
 * @return address - pair [in/out, address]
 */
function findUserAddress(rawTransaction, wallets) {
    let trAddresses = parseTransactionAddresses(rawTransaction);
    // FIXME: what to return if trAddresses is undefined ?
    if(trAddresses !== undefined) {
        trAddresses.forEach(function(address, index){
            wallets.forEach(function(wallet, wIndex){
                if (address[1] === wallet[2]) {
                    return address;
                }
            });
        });
    }
}

function isUnique(walletId, ids) {
    for (let i = 0; i < ids.length; i++) {
        if (ids[i] === walletId) {
            return false;
        }
    }
    return true;
}

function printList(list, elem, ids, verbose) {
    let walletElem = document.getElementById(elem);
    for (let i = 0; i < list.length; i++) {

        if (isUnique(list[i][2], ids)) {
            walletElem.innerHTML += printWallet(i, list[i][4], list[i][3], list[i][2], verbose);
            ids.push(list[i][2]);
        }
    }
    return ids;
}

function renderWallet() {
    ipcRenderer.send("get-wallets");
}

function refreshWallet() {
    ipcRenderer.send("refresh-wallet");
}

// TODO: implement or not ?
function getWalletWithName(name) {
    ipcRenderer.send("get-wallet-by-name", name);
}

// TODO: implement or not ?
/* FIXME: @nonghost name usage */
function addressNameTest() {
    ipcRenderer.send("rename-wallet", "znc4M7DLcwShfoQuF18YB55QwphLhCVKeoi", "nove jmeno");
}

function pickWallet(address) {
    document.getElementById("sendFromAddressText").innerHTML = address;
    closeDialog("pickWalletDialog");
}

function generateNewWallet() {
    ipcRenderer.send("generate-wallet", document.getElementById("newWalletName").value);
}

function doNotify(title, message, duration = 2) {
    let notif = new Notification(title, {
        body: message,
        icon: "resources/zen_icon.png",
        duration: duration
    });

    notif.onclick = () => {
        notif.close();
    }
}

ipcRenderer.on("get-wallets-response", function (event, resp) {
    let data = JSON.parse(resp);
    let wId;
    let wAddress;
    let wBalance;
    let wName;
    let walletClass = "";
    let walletName = "";
    let walletTitle = "";
    let walletBalance;
    let walletAddress = "";
    let walletEnd = "</div>";
    showWallet();
    document.getElementById("walletList").innerHTML = "";
    for (let i = 0, j = 1; i < data.wallets.length; i += 1) {
        wAddress = data.wallets[i][2];
        wBalance = data.wallets[i][3];
        wName = data.wallets[i][4];
        let walletPick = "";

        walletClass = "<div name=\"block_" + wAddress + "\" class=\"walletListItem";
        if (wBalance === 0) {
            walletClass += " walletListItemZero";
        } else {
            if (j === 2) {
                j = 0;
                walletClass += " walletListItemOdd";
            }
            j++;
        }
        walletClass += "\">";
        walletName = "<span class=\"walletListItemAddress walletListItemTitle\">" + wName + "</span>";
        if (wName !== "") {
            walletTitle = "<span class=\"walletListItemAddress walletListItemTitle\">" + wName + "</span>";
            walletPick = "<div onclick=\"pickWallet('"+wName+"')\">";
        } else {
            walletTitle = "<span class=\"walletListItemAddress walletListItemTitle\"> " + wAddress + "</span>";
            walletPick = "<div onclick=\"pickWallet('"+wAddress+"')\">";
        }
        walletBalance = "<span name=\"balance_" + wAddress + "\" class=\"walletListItemAddress walletListItemBalance\">" + Number(wBalance).toFixed(8) + "</span> ZEN";
        walletAddress = "<span class=\"walletListItemAddress\"><b>Address </b> " + wAddress + "</span><a href=\"javascript:void(0)\" class=\"walletListItemDetails\" onclick=\"walletDetailsDialog('" + wAddress + "', '"+ wBalance +"' , '"+ wName+"')\">Details</a>";
        document.getElementById("walletList").innerHTML += walletClass + walletName + walletBalance + walletAddress + walletEnd;

        document.getElementById("pickWalletDialogContent").innerHTML += walletPick + walletClass + walletTitle + walletBalance + walletEnd + "</div>";
    }
    document.getElementById("walletFooterBalance").innerHTML = Number(data.total).toFixed(8);
});

ipcRenderer.on("update-wallet-balance", function (event, resp) {
    let data = JSON.parse(resp);

    document.getElementsByName("block_" + data.wallet).forEach(function(element) {
        element.classList.remove("walletListItemZero");
    }, this);
    document.getElementsByName("balance_" + data.wallet).forEach(function(element) {
        element.innerText = Number(data.balance).toFixed(8);
    }, this);
    doNotify("Balance has been updated", "New balance: " + data.balance + " " + data.wallet);
    /* FIXME: update total */
});

ipcRenderer.on("rename-wallet-response", function (event, resp) {
    let data = JSON.parse(resp);
    // FIXME: @lukas What to do in the case when notifications are OFF.
    if (data.response === "OK") {
        doNotify("Wallet name has been updated", data.msg);
    } else {
        doNotify("Rename wallet error", data.msg);
    }
    console.log(data.msg);
});

ipcRenderer.on("get-wallet-by-name-response", function (event, resp) {
    let data = JSON.parse(resp);

    /* FIXME: @nonghost if response=OK data.wallets else data.msg */
    console.log(data.msg);
});

ipcRenderer.on("get-transaction-response", function (event, resp) {
    let data = JSON.parse(resp);
    // FIXME: @lukas What to do in the case when notifications are OFF.
    if (data.response === "OK") {
        doNotify("Transaction", data.msg);
    } else {
        doNotify("Transaction ERROR", data.msg);
    }
    console.log(data.msg);
});

ipcRenderer.on("get-transaction-update", function (event, address, resp) {
    let data = JSON.parse(resp);

    /* FIXME: @nonghost response from api */
    let amount = (data.vout[0].scriptPubKey.addresses[0] === address) ? data.vout[0].value : data.vout[1].value;
    console.log("transaction from: " + data.vin[0].addr + " amount: " + amount + " fee: " + data.fees);
});

ipcRenderer.on("generate-wallet-response", function (event, resp) {
    let data = JSON.parse(resp);

    if (data.response === "OK")
    {
        let i = 0;
        let list = document.getElementById("walletList").childNodes;
        while (document.getElementById("walletList").childNodes[i].childNodes[1].innerText !== "0.00000000") {
            i++;
        }
        let wAddress = data.msg;
        let wName = document.getElementById("newWalletName").value;
        let walletName;
        let walletBalance;
        let walletAddress;
        let elemName = "block_" + wAddress;

        walletName = "<span class=\"walletListItemAddress walletListItemTitle\">" + wName + "</span>";
        walletBalance = "<span name=\"balance_" + wAddress + "\" class=\"walletListItemAddress walletListItemBalance\">" + Number(0).toFixed(8) + "</span> ZEN";
        walletAddress = "<span class=\"walletListItemAddress\"><b>Address </b> " + wAddress + "</span><a href=\"javascript:void(0)\" class=\"walletListItemDetails\" onclick=\"walletDetailsDialog('" + wAddress + "', '0' , '"+ wName+"')\">Details</a>";
        let newItem = document.createElement("div");
        newItem.innerHTML = walletName + walletBalance + walletAddress;
        newItem.classList.add("walletListItem");
        newItem.name = elemName;
        document.getElementById("walletList").insertBefore(newItem, list[i]);
        document.getElementById("newWalletAddress").value = wAddress;
    }
});





// --------------------------------------------------------------------------------------------------------
// // FIXME: check if unused
// function checkZeroList(walletList, zero=true) {
//     let list = [];
//     for (let i = 0; i < walletList.wallets.length; i++) {
//         if ((zero) && (walletList.wallets[i][3] === 0)) {
//             list.push(walletList.wallets[i]);
//         }
//         if ((!zero) && (walletList.wallets[i][3] > 0)) {
//             list.push(walletList.wallets[i]);
//         }
//     }
//     return list;
// }
//
// function getNonZeroBalance(walletList) {
//     let non_zero = checkZeroList(walletList, false);
//     non_zero.sort(function (a, b) {
//         return b[3] - a[3];
//     });
//     return non_zero;
// }
//
// function getZeroBalance(walletList) {
//     console.log(walletList);
//     return checkZeroList(walletList, true);
// }
//
// function printTransaction(transaction, wallets) {
//     let transactionClass = "";
//     let transactionAmount = "";
//     let transactionAddressFrom = "";
//     let transactionAddressTo = "";
//     let transactionEnd = "</div>";
//     let address = findUserAddress(transaction, wallets);
//     if (address[0] === "in") {
//         transactionClass = "<div class\"transactionListItem transactionIn\">";
//         transactionAddressFrom = address[1];
//         transactionAddressTo = transaction.vout.addresses;
//     } else {
//         transactionClass = "<div class\"transactionListItem transactionOut\">";
//         transactionAddressTo = address[1];
//         transactionAddressFrom = transaction.vout.addresses.toString();
//     }
//
//     return transactionClass + transactionAddressFrom + transactionAddressTo + transactionEnd;
// }
//
// function printWalletList(non_zero, zero, elem, verbose = true) {
//     let walletElem = document.getElementById(elem);
//     walletElem.innerHTML = "";
//     let hide_balances = document.getElementById("hideZeroBalancesButton");
//     let ids = [];
//     ids = printList(non_zero, elem, ids, verbose);
//     if ((elem === "walletList") && (hide_balances.textContent === "Show Zero Balances")) {
//         return;
//     }
//     printList(zero, elem, ids, verbose);
// }
//
// /* FIXME: @nonghost transaction info usage */
// function testTransaction() {
//     ipcRenderer.send("get-transaction", "3098e8b87b1a54a5d3e60b60e2c888547f17cb8e8504b1e70d6b6aca882b7413", "znYBWsMPdeUJfwbKbMdXNPVD9THysCgzFhu");
// }