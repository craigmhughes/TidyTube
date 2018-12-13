try {

  let enabler = document.getElementById("enabler");

  // Redirect to GitHub page
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

  //  Send update to content.js on input click.
  for(let i = 0; i < inputs.length; i++){
      inputs[i].parentNode.addEventListener("click", function(){
          updateStates();
      });
  }

  function updateStates(){
      chrome.tabs.query({}, function(tabs){
          for (let i=0; i<tabs.length; ++i) {
              chrome.tabs.sendMessage(tabs[i].id, {action: [enabler.checked.toString()]});
          }
      });
  }

  chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
      enabler.checked = msg[0] === "ttenabledtrue";
  });

  queryStates();
} catch (TypeError){}
