
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

  if(ttJson.enabled === "true") {
    document.getElementsByTagName("body")[0].appendChild(cssAdd);
    cssAdd.innerHTML += `#related{display:none;}
    .html5-main-video {left:0!important; top:0!important;}
    .ytd-shelf-renderer {transition-duration: 1s; opacity: 0; pointer-events: none;}
    a[href="/feed/trending"]{display:none!important}
    #contents.ytd-section-list-renderer > *.ytd-section-list-renderer:not(:last-child):not(ytd-page-introduction-renderer) {border-bottom: none!important;}
    `;

    if(window.location.href > 24){
      cssAdd.innerHTML += `
      ytd-comments#comments{display:none;}
      .ytd-watch-next-secondary-results-renderer {display: none;}`;
    } else{
      cssAdd.innerHTML += `
      .ytd-watch-flexy#primary {position: absolute;width: 90%; transition-duration: 1s;}
      video.html5-main-video {width: -webkit-fill-available!important;height: -webkit-fill-available!important;}
      .ytp-chrome-bottom {width: 97%!important;}`;
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
chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {
    if(msg.action === 'getlocal'){
        chrome.runtime.sendMessage(["ttenabled" + ttJson.enabled]);
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

    if(ttJson.enabled === "true"){

        let url = window.location.href;
        let patt = new RegExp("list");

        if(url.length > 24) {
            // Switch off unrelated videos after current play has ended. Checks for keywords matching the title.
            // SUPER HACKY! -- Cannot find closest title class for some reason. childNodes must be used probably because you suck at this.
            try{
              let titleEl = document.getElementById("info-contents") === null ? undefined : document.getElementById("info-contents").childNodes[0].childNodes[0].childNodes[2];
              if(titleEl !== undefined) {
                let titleKeywords = titleEl.innerText.replace(/\(\)/g, " ").toLowerCase().split(/\s+/);

                // Ignore keywords such as common connectives or hyphen.
                let ignoredKeywords = ["-", "to", "a", "for", "and", "the", "i", "in", "from", "about"];
                let endVids = document.getElementsByClassName("ytp-videowall-still-info-title");

                for (let i = 0; i < endVids.length; i++) {
                    let endVidKeywords = endVids[i].innerText.replace(/\(\)/g, " ").toLowerCase().split(/\s+/);
                    let hasKeyword = false;

                    // Remove ignored keywords
                    for (let j = 0; j < endVidKeywords.length; j++) {
                        for (let k = 0; k < ignoredKeywords.length; k++) {
                            if (endVidKeywords[j] === ignoredKeywords[k]) {
                                endVidKeywords[j] = "";
                            }
                        }
                    }

                    loop1:
                        for (let k = 0; k < endVidKeywords.length; k++) {
                            for (let j = 0; j < titleKeywords.length; j++) {
                                if (titleKeywords[j] === endVidKeywords[k]) {
                                    // title contains keyword and loop is no longer needed -- break to loop1 label
                                    hasKeyword = true;
                                    break loop1;
                                }
                            }
                        }

                    // Hides video based on related-ness <-- not a word.
                    endVids[i].closest(".ytp-suggestion-set").style.display = hasKeyword ? "block" : "none";
                }
              }
            } catch (TypeError) {
              // Missing element to parse.
            }
        }
    }

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
            let patt = new RegExp("recommended");

            let sectionSubtitles = document.getElementsByTagName("yt-formatted-string");
            let listTitles = document.getElementsByTagName("span");


            // Check and possibly delete elements containing ignored TITLE string.
            for(let i = 0; i < listTitles.length; i++){
              if(listTitles[i].getAttribute("id") === "title"){
                let ignoredTitles = ["recommended","trending","live gaming for you","live recommendations", "gaming for you"];

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

                    let strArr = ["music", "sports", "gaming", "movies"];
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

          try {

            let cssAdd2 = document.createElement("style");

            if( (document.getElementsByTagName("yt-view-count-renderer")[0].innerText.includes("watching now")
                && window.location.href.includes("watch")) || window.location.href.includes("list")){

                  cssAdd2.innerHTML = ".ytd-watch-flexy#primary {position: static;}";
                  document.getElementsByTagName("body")[0].appendChild(cssAdd2);
            } else {

              cssAdd2.innerHTML = ".ytd-watch-flexy#primary {position: absolute;width: 90%;}";
              document.getElementsByTagName("body")[0].appendChild(cssAdd2);
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
