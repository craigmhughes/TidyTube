
// Initialize localStorage variables.

if(localStorage.getItem("TidyTubeEnabled") === null){
    localStorage.setItem("TidyTubeEnabled", "true");
}

// Do not allow trending page.
if(window.location.href === "https://www.youtube.com/feed/trending"){
    window.location.replace("https://www.youtube.com");
}

function ready() {
    if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading"){
        runTidyTube();
    } else {
        document.addEventListener('DOMContentLoaded', runTidyTube);
    }
}

function runTidyTube() {
    // Allow one second wait for loading DOM. this seems to fix async.
    setTimeout(function(){
        ttSetup();
        setInterval(function () {
            mainPageEdit();
            testURL();
        }, 100);
    }, 1000);
}

// Logo URLs
let logoUrl = chrome.extension.getURL('icons/logo-green-02.png');
let logoUrl2 = chrome.extension.getURL('icons/logo-gray-02.png');

let titleAlert, winUrl;

// Sets pre-requisites for functions.
function ttSetup(){

    // Add toggle button
    let ttToggle = document.createElement('img');
    ttToggle.className = "tt-toggle";
    ttToggle.title = "Toggle TidyTube";
    ttToggle.src = logoUrl;

    winUrl = window.location.href;

    document.getElementById('end').prepend(ttToggle);

    if(localStorage.getItem("TidyTubeEnabled") === "true") {
        // Add alert
        let alertBox = document.createElement('div');
        alertBox.className = "tt-alert-box tt-title-alert";
        alertBox.id = "tt-alert"
        alertBox.innerHTML = `<p>Nothing loading?</p>`;

        document.getElementById('masthead').appendChild(alertBox);
        document.getElementById('primary').style.marginTop = window.location.href.length <= 24 ? "50px" : "0px";

        titleAlert = document.getElementById('tt-alert');

        titleAlert.addEventListener("mouseover", function(){
            this.className += " hovered-title";
            this.childNodes[0].innerText = "Click to Reload";
        });

        titleAlert.addEventListener("mouseleave", function(){
            this.className = "tt-alert-box tt-title-alert";
            this.childNodes[0].innerText = "Nothing loading?";
        });

        titleAlert.addEventListener("click", function(){
            location.reload();
        });

    } else {
        ttToggle.src = logoUrl2;
    }

    ttToggle.addEventListener("click", function(){
        storageChange();
        location.reload();
    });
}

function testURL() {

    if(localStorage.getItem("TidyTubeEnabled") === "true"){

        // Checks if url is that of the home page.
        if(window.location.href.length > 24){
            titleAlert.style.visibility = "hidden";
        } else {
            titleAlert.style.visibility = "visible";
        }

        try{
            // Turn off Trending page link.
            let endpoints = document.getElementsByClassName('yt-simple-endpoint');
            for (let i = 0; i < endpoints.length; i++) {
                if (endpoints[i].title.toLowerCase() === "trending") {
                    endpoints[i].parentNode.style.display = "none";
                }
            }

            // Turn off "More from YouTube"
            let guideRenders = document.getElementsByClassName("ytd-guide-renderer");
            for (let i = 0; i < guideRenders.length; i++) {
                if (guideRenders[i].childNodes[3].childNodes[1] !== undefined &&
                    guideRenders[i].childNodes[3].childNodes[1].innerText.toLowerCase() === "more from youtube") {
                    guideRenders[i].style.display = "none";
                }
            }
        } catch {
            // Empty try catch to silence error of trying to affect elements that do not need affecting.
        }

        let url = window.location.href;
        let patt = new RegExp("list");

        if(url.length > 24) {
            if (patt.test(url)) {
                document.getElementById("related").closest("#secondary").style.display = "block";

                document.getElementById("related").innerHTML = `
                <div class="tt-alert-box"><p>Distracting Content Disabled</p></div>`;
            } else {
                patt = new RegExp("watching now");

                if (patt.test(document.getElementById("info-text").innerText.toLowerCase())) {
                    document.getElementById("related").closest("#secondary").style.display = "block";

                    document.getElementById("related").innerHTML = `
                    <div class="tt-alert-box"><p>Distracting Content Disabled</p></div>`;
                } else {
                    document.getElementById("related").closest("#secondary").style.display = "none";
                }
            }


            // Switch off unrelated videos after current play has ended. Checks for keywords matching the title.
            // SUPER HACKY! -- Cannot find closest title class for some reason. childNodes must be used probably because you suck at this.
            let titleKeywords = document.getElementById("info-contents").childNodes[0].childNodes[0].childNodes[2].innerText.replace(/\(\)/g, " ").toLowerCase().split(/\s+/);

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
    }

    // Run through function again. on one iteration, sometimes videos still appear.
    // acts as a double check.
    if(localStorage.getItem("refCount") < 1){
        localStorage.setItem("refCount", toString(parseInt(localStorage.getItem("refCount")) + 1));
        testURL();
    }

    mainPageEdit();
}

// Used for if user presses go back in history or forward.
window.onpopstate = function(){
    testURL();
    mainPageEdit();
};

document.getElementsByTagName("body")[0].addEventListener("click", function(){
    testURL();
    mainPageEdit();
});


// Switch Toggle States
function storageChange() {
    switch (localStorage.getItem("TidyTubeEnabled")) {
        case("true") :
            localStorage.setItem("TidyTubeEnabled", "false");
            break;
        case("false") :
            localStorage.setItem("TidyTubeEnabled", "true");
            break;
        default :
            localStorage.setItem("TidyTubeEnabled", null);
            break;
    }

    location.reload();
}

function mainPageEdit(){
    if(localStorage.getItem("TidyTubeEnabled") === "true") {
        if(window.location.href.length <= 24) {
            let patt = new RegExp("recommended");

            let sectionSubtitles = document.getElementsByTagName("yt-formatted-string");

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
                            currentTitle === "by youtube " + strArr[j]) {

                            sectionSubtitles[i].closest("#dismissable").style.display = "none";
                        }
                    }
                }
            }

            // Check and possibly delete elements containing ignored title string.

            let sectionTitles = document.getElementsByTagName("ytd-shelf-renderer");

            for(let i = 0; i < sectionTitles.length; i++){
                let currentTitle = sectionTitles[i].childNodes[1].childNodes[1].childNodes[1].childNodes[1].innerText.toLowerCase();
                let ignoredTitles = ["recommended","trending","live gaming for you","live recommendations"];

                for(let j = 0; j < ignoredTitles.length; j++) {
                    if (currentTitle.substr(0, ignoredTitles[j].length) === ignoredTitles[j]) {

                        sectionTitles[i].style.display = "none";
                        break;
                    }
                }
            }
        }
    }
}

// Run TidyTube
ready();