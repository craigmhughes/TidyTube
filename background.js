document.getElementById("tt-main").style.margin = "0";

let enabler = document.getElementById("enabler");
let loadToggle = document.getElementById("loadToggle");
let darkToggle = document.getElementById("darkToggle");

document.getElementById("author").addEventListener("click", function(){
    let newURL = "https://github.com/craigmhughes/";
    chrome.tabs.create({ url: newURL });
});


setInterval(function(){
    queryStates();
}, 5000);

function queryStates(){
    chrome.tabs.query({}, function(tabs){
        for (let i=0; i<tabs.length; ++i) {
            chrome.tabs.sendMessage(tabs[i].id, {action: "getlocal"});
        }
    });
}

let inputs = document.getElementsByClassName("switcher");

for(let i = 0; i < inputs.length; i++){
    inputs[i].parentNode.addEventListener("click", function(){
        updateStates();
    });
}

function updateStates(){
    chrome.tabs.query({}, function(tabs){
        for (let i=0; i<tabs.length; ++i) {
            chrome.tabs.sendMessage(tabs[i].id, {action: [enabler.checked.toString(),loadToggle.checked.toString(),darkToggle.checked.toString()]});
        }
    });
}

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    enabler.checked = msg[0] === "ttenabledtrue";
    loadToggle.checked = msg[1] === "loadenabledtrue";
    darkToggle.checked = msg[2] === "darkmodetrue";
});

queryStates();
