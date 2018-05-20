
// Initialize localStorage variables.

if(localStorage.getItem("TidyTubeEnabled") === null){
    localStorage.setItem("TidyTubeEnabled", "true");
}

// Do not allow trending page.
if(window.location.href === "https://www.youtube.com/feed/trending"){
    window.location.replace("https://www.youtube.com");
}

// Call setup on ready
$(document).ready(function () {
    ttSetup();
    setInterval(function () {
        mainPageEdit();
        testURL();
    }, 1000);
});

// Logo URLs
let logoUrl = chrome.extension.getURL('icons/logo-green-02.png');
let logoUrl2 = chrome.extension.getURL('icons/logo-gray-02.png');

// Sets pre-requisites for functions.
function ttSetup(){

    // Add toggle button
    $('div#end').prepend("<img class='tt-toggle' title='Toggle TidyTube'/>");
    $('.tt-toggle').attr("src", logoUrl);

    if(localStorage.getItem("TidyTubeEnabled") === "true") {
        // Add alert
        $('#masthead').append("<div class='tt-alert-box tt-title-alert'><p>Nothing loading?</p></div>");
        $('ytd-section-list-renderer#primary').css('margin-top', '50px');

        $('.tt-title-alert').hover(function () {
            $(this).addClass("hovered-title");
            $(this).find("p").text("Click to reload");
        }, function () {
            $(this).removeClass("hovered-title");
            $(this).find("p").text("Nothing loading?");
        });

        $('.tt-title-alert').click(function () {
            location.reload();
        });
    } else {
        $('.tt-toggle').attr("src", logoUrl2);
    }

    $('.tt-toggle').click(function () {
        storageChange();
        location.reload();
    });
}

function testURL() {

    if(localStorage.getItem("TidyTubeEnabled") === "true"){

        // Checks if url is that of the home page.
        if(window.location.href.length > 24){
            $('.tt-title-alert').css("visibility","hidden");
        } else {
            $('.tt-title-alert').css("visibility","visible");
        }

        // Turn off Trending page link.
        $('#contentContainer a#endpoint').each(function(){
            if($(this).attr("title").toLowerCase() == "trending"){
                $(this).parents(':eq(0)').hide();
            }
        });

        // Turn off "More from YouTube"
        $('#sections h3 #guide-section-title').each(function() {
            if (this.innerHTML == "More from YouTube") {
                $(this).parents(':eq(1)').hide();
            }
        });

        let url = window.location.href;
        let patt = new RegExp("list");

        $('#main.ytd-watch, #top.ytd-watch').css("max-width", "var(--flex854-mode-full-width)");

        // Check if url is that of a mix.
        if(patt.test(url)) {
            $("#columns").css("display","flex");
            $('#related').html('<div class="tt-alert-box"><p>Distracting Content Disabled</p></div>');
            $('#related').show();
        } else {
            patt = new RegExp("watching now");

            if(patt.test($('#info-text').text().toLowerCase())){
                $("#columns").css("display","flex");
                $('#related').html('<div class="tt-alert-box"><p>Distracting Content Disabled</p></div>');
                $('#related').show();
            } else {
                $("#columns").css("display", "block");
                $('#related').hide();

                // Stretches Video Player container.
                $('#main.ytd-watch, #top.ytd-watch').css("max-width", "max-content");
            }
        }

        // Switch off unrelated videos after current play has ended. Checks for keywords matching the title.
        let titleKeywords = $('#info-contents .title').text().split(/ +/);

        $('span.ytp-videowall-still-info-title').each(function(){
            $(this).parents(':eq(3)').hide();

            for (let i = 0; i < titleKeywords.length; i++) {
                patt = new RegExp(titleKeywords[i].toLowerCase());

                if ( patt.test(this.innerText.toLowerCase()) ) {
                    $(this).parents(':eq(3)').show();
                }
            }
        });

        // Run through function again. on one iteration, sometimes videos still appear.
        // acts as a double check.
        if(localStorage.getItem("refCount") < 1){
            localStorage.setItem("refCount", toString(parseInt(localStorage.getItem("refCount")) + 1));
            testURL();
        }

        mainPageEdit();
    }
}

// Used for if user presses go back in history or forward.
window.onpopstate = function(){
        testURL();
        mainPageEdit();
};

// Force update as YouTube doesn't refresh.
$('body').click(function(){
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

            // Hide the parent of any element that includes the word "Recommended" and Ads by YouTube.
            $("yt-formatted-string#title-annotation").each(function () {
                if (patt.test(this.innerText.toLowerCase())) {
                    $(this).parents(':eq(4)').hide();
                }

                let strArr = ["music", "sports", "gaming", "movies"];
                for (let i = 0; i < strArr.length; i++) {
                    if (this.innerText.toLowerCase() === "by " + strArr[i] || this.innerText.toLowerCase() === "by " + strArr[i] + " - topic" || this.innerText.toLowerCase() === "by youtube " + strArr[i]) {
                        $(this).parents(':eq(4)').hide();
                    }
                }
            });

            // Check for Recommended Section.
            $('span#title').each(function(){
                if(patt.test(this.innerText.toLowerCase())){
                    $(this).parents(':eq(4)').hide();
                }
            });

            titleScrub("trending");
            titleScrub("live gaming for you");
            titleScrub("live recommendations");
        }
    }
}

// Check and possibly delete elements containing passed string.
function titleScrub(pattPass){
    let patt = new RegExp(pattPass);

    $('span#title').each(function(){
        if(patt.test(this.innerText.toLowerCase())){
            $(this).parents(':eq(5)').hide();
        }
    });
}
