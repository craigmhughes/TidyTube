
var content = document.getElementsByClassName("ytd-page-manager");

// Default JSON data.
let ttJson = {
    "enabled" : "true",
    "refcount" : "false",
};


// Initialize localStorage variables.
if(localStorage.getItem("TidyTube") === null){
    localStorage.setItem("TidyTube", JSON.stringify(ttJson));
}

// Do not allow trending page.
if(window.location.href === "https://www.youtube.com/feed/trending"){
    window.location.replace("https://www.youtube.com");
}

// Create CSS file addition.
var cssAdd = document.createElement("style");

/**
  * Check if page is ready. Then run TidyTube.
  */
function ready() {
  ttJson = JSON.parse(localStorage.getItem("TidyTube"));
  console.log("Hey there");

  if(ttJson.enabled === "true") {
    document.getElementsByTagName("body")[0].appendChild(cssAdd);
      cssAdd.innerHTML += `#related{display:none;}
      .html5-video-player .video-stream {position:inherit;max-height: 1000px;}
      #player-theater-container.ytd-watch-flexy{max-height:630px!important;}
      .html5-main-video {height:100%!important;width:100%!important;max-width:1125px;left:0!important;top:0!important;margin: auto;}
      .ytp-endscreen-content,.ytp-endscreen-previous,.ytp-endscreen-next {display: none;}
      .ytd-player#container {background:#000;}
      .ytd-shelf-renderer {transition-duration: 1s; opacity: 0; pointer-events: none;}
      a[href="/feed/trending"]{display:none!important}
      #contents.ytd-section-list-renderer > *.ytd-section-list-renderer:not(:last-child):not(ytd-page-introduction-renderer) {border-bottom: none!important;}
      #tt-alert{margin:30px 0 15px 0;color:rgba(125,125,125,1);font-size:0.8em;border-bottom: 1px solid rgba(125,125,125,0.5);}
      #tt-alert > h1 > span {color:rgba(125,125,125,0.75);font-weight: 200;margin-left:10px;}
    `;

    if(window.location.href > 24){
      cssAdd.innerHTML += `
      ytd-comments#comments{display:none;}
      .ytd-watch-next-secondary-results-renderer {display: none;}`;
    } else{
      cssAdd.innerHTML += `
      .ytd-watch-flexy#primary {position: absolute;width: 90%; transition-duration: 1s;}
      video.html5-main-video {width: -webkit-fill-available!important;height: -webkit-fill-available!important;}
      .ytp-browser-bottom {width: 97%!important;}`;
    }

  }

  if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading"){
      runTidyTube();
  } else {
      document.addEventListener('DOMContentLoaded', runTidyTube());
  }
}

/**
  * Initial function to start and repeat interval inside.
  */
function runTidyTube() {
  // Allow one second wait for loading DOM. this seems to fix async.
  setTimeout(function(){
      pageEdit();
      testURL();

      setInterval(function () {
          pageEdit();
          testURL();
      }, 3000);
  }, 500);
}

/**
  * Gets info from toggle controller. (background.js)
  */
browser.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if(msg.action === 'getlocal'){
        browser.runtime.sendMessage(["ttenabled" + ttJson.enabled]);
    } else {
        ttJson.enabled = msg.action[0];
        storageChange();
    }
});

/**
  * Function deletes unneeded related videos from end of current clip.
  * Also checks if user has changed toggle and reloads page if so.
  */
function testURL() {
    // Run through function again. on one iteration, sometimes videos still appear.
    // acts as a double check.
    if(ttJson.refcount === "false"){
        ttJson.refcount = "true";
        storageChange();
        testURL();
    }

    pageEdit();
}

/**
  * Used for if user presses go back in history or forward.
  */
window.onpopstate = function(){
    testURL();
    pageEdit();
};

/**
  * Needed as YouTube doesn't reload any scripts on page change.
  * Page change != always onpopstate.
  */
document.getElementsByTagName("body")[0].addEventListener("click", function(){
    testURL();
    pageEdit();
});


/**
  * Switch Toggle States. Store JSON then restore.
  */
function storageChange() {
    localStorage.setItem("TidyTube", JSON.stringify(ttJson));
    location.reload();
}

/**
  * Function changes/deletes elements on page based on recommendations.
  */
function pageEdit(){

    if(ttJson.enabled === "true") {
        if(window.location.href.length <= 24) {

            let page = document.getElementsByClassName("ytd-section-list-renderer");
            for(let i = 0; i < page.length; i++){
              if(page[i].id === "contents" && !page[i].parentNode.querySelector("#tt-alert")){
                var ttText = document.createElement('div');
                ttText.id = "tt-alert";
                ttText.innerHTML = "<h1>TidyTube is enabled <span>Click the icon to toggle</span></h1>";
                page[i].style.marginTop = "0";
                ttText.style.marginLeft = page[i].style.marginLeft;
                page[i].parentNode.insertBefore(ttText, page[i]);
              }
            }

            try{
              document.getElementById("tt-alert").style.display = "block";
            } catch (TypeError){}

            let patt = new RegExp("recommended");

            let sectionSubtitles = document.getElementsByTagName("yt-formatted-string");
            let listTitles = document.getElementsByTagName("span");


            // Check and possibly delete elements containing ignored TITLE string.
            for(let i = 0; i < listTitles.length; i++){
              if(listTitles[i].getAttribute("id") === "title"){
                let ignoredTitles = ["recommended","topic","trending","live gaming for you","live recommendations", "gaming for you"];

                for(let j = 0; j < ignoredTitles.length; j++) {
                    if (listTitles[i].innerText.toLowerCase().includes(ignoredTitles[j])) {
                        listTitles[i].closest("#dismissable").style.display = "none";
                        break;
                    }
                }
              }
            }

            // Check and possibly delete elements containing ignored SUBTITLE string.
            for(let i = 0; i < sectionSubtitles.length; i++){
                if( sectionSubtitles[i].id === "title-annotation") {

                    if(patt.test(sectionSubtitles[i].innerText.toLowerCase())) {
                        sectionSubtitles[i].closest("#dismissable").style.display = "none";
                    }

                    let strArr = ["music", "sports", "gaming", "movies", "topic", "films"];
                    let currentTitle = sectionSubtitles[i].innerText.toLowerCase();

                    for (let j = 0; j < strArr.length; j++) {
                        if (currentTitle === "by " + strArr[j] ||
                            currentTitle === "by " + strArr[j] + " - topic" ||
                            currentTitle === "by youtube " + strArr[j] ||
                            currentTitle === "trending") {

                            sectionSubtitles[i].closest("#dismissable").parentNode.style.display = "none";
                        }
                    }
                }
            }

            // Continue page interaction -- provides more content if page is
            // being interacted with.
            scrollBar();

        } else {

          showContent();

          try{
            document.getElementById("tt-alert").style.display = "none";
          } catch (TypeError){}

          try {
            let flexies = document.getElementsByClassName("ytd-watch-flexy");
            if( (document.getElementsByTagName("yt-view-count-renderer")[0].innerText.includes("watching now")
                && window.location.href.includes("watch")) || window.location.href.includes("list")){
                  for(let i = 0; i < flexies.length; i++){
                    if(flexies[i].id == "primary") {
                      flexies[i].style.position = "static";
                    }
                  }
            } else {
              for (let item in document.getElementsByClassName("ytd-watch-flexy")){
                for(let i = 0; i < flexies.length; i++){
                  if(flexies[i].id == "primary") {
                    flexies[i].style.position = "absolute";
                    flexies[i].style.width = "90%";
                  }
                }
              }
            }
          }
          catch (TypeError){}
        }

    } else {
      showContent();
    }


    showVideoLists();

}

/**
  * Disables initial style per video list.
  */
let showVideoLists = () => {
  let videoLists = document.getElementsByClassName("ytd-shelf-renderer");

  // Fade in effect.
  for(let i = 0; i < videoLists.length; i++){
    videoLists[i].style.opacity = "1";
    videoLists[i].style.pointerEvents = "all";
  }
};

/**
  * Displays main content area.
  */
let showContent = () => {
  for (let i = 0; i < document.getElementsByTagName("ytd-browse").length; i++){
    document.getElementsByTagName("ytd-browse")[i].style.opacity = "1";
  }
}

var scrollInteraction = true;

/**
  * Affects side scroll to create effect of user engagement.
  */
function scrollBar(){
  let guides = document.getElementsByClassName("ytd-app");

  for(let i = 0; i < guides.length; i++){
    if(guides[i].getAttribute("id") === "guide-inner-content"){
      guides[i].scrollTop += scrollInteraction ? 1 : -1;
      scrollInteraction = !scrollInteraction;
    }
  }
}


// Run TidyTube
ready();

setTimeout(()=>{
  scrollBar();
  showContent();
}, 5000);
