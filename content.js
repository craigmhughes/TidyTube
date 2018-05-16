
// Initialize localStorage variables.
if(localStorage.getItem("refCount") === null){
    localStorage.setItem("refCount", 0);
}

if(localStorage.getItem("initUrl") === null){
    localStorage.setItem("initUrl", window.location.href);
}

if(localStorage.getItem("TidyTubeEnabled") === null){
    localStorage.setItem("TidyTubeEnabled", "true");
}

$(document).ready(function () {
    let logoUrl = chrome.extension.getURL('logo-green-02.png');
    let logoUrl2 = chrome.extension.getURL('logo-gray-02.png');

    $('div#end').prepend("<img class='tt-toggle' title='Toggle TidyTube'/>");

    $('.tt-toggle').attr("src", localStorage.getItem("TidyTubeEnabled") === "true" ? logoUrl : logoUrl2);
    testURL(window.location.href);

    $('.tt-toggle').click(function () {
        storageChange();
        location.reload();
    });

    mainPageEdit();
});

function testURL(winUrl) {
    //console.log(localStorage);
    if(localStorage.getItem("TidyTubeEnabled") === "true"){
        let url = window.location.href;
        let patt = new RegExp("list");

        // Check if url is that of a mix.
        if(patt.test(url)) {
            $("#columns").css("display","flex");
            $('#related').html('<div class="alert-box"><p>Distracting Content Disabled</p></div>');
            $('#related').show();
        } else {
            $("#columns").css("display","block");
            $('#related').hide();
        }

        // Run through function again. on one iteration, sometimes videos still appear.
        // acts as a double check.
        if(localStorage.getItem("refCount") < 1){
            localStorage.setItem("refCount", localStorage.getItem("refCount") + 1);

            // Prevents reloading if video state has not changed.
            if (localStorage.getItem("initUrl") === "https://www.youtube.com/" && localStorage.getItem("initUrl") === "http://www.youtube.com/") {
                location.reload();
            }

            testURL(window.location.href);
        }

        if(winUrl !== localStorage.getItem("initUrl")){
            localStorage.setItem("refCount", 0);
            localStorage.setItem("initUrl", winUrl);
        }

        mainPageEdit();
    }
}

// YouTube doesn't refresh when links are clicked. Test url every time user clicks on page instead.
$('body').click(function(){
    testURL(window.location.href);
    mainPageEdit();
});

// Used for if user presses go back in history or forward.
window.onpopstate = function(){
    testURL(window.location.href);
    mainPageEdit();
};

$(window).scroll(function() {mainPageEdit()});

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
        let patt = new RegExp("recommended");

        if($('#primary:first-of-type > div#contents > ytd-item-section-renderer').css('display') != 'none') {
            $('#primary:first-of-type > div#contents > ytd-item-section-renderer').hide();
        }

        // Hide the parent of any element that includes the word "Recommended"
        $( "yt-formatted-string#title-annotation" ).each(function() {
            if(patt.test(this.innerText.toLowerCase())){
                $(this).parents(':eq(4)').hide();
            }

            console.log(this.innerText.toLowerCase());

            let strArr = ["music","sports","gaming","movies"];
            for(let i = 0; i < patt.length; i++){
                if(this.innerText.toLowerCase() === strArr[i]){
                    $(this).parents(':eq(4)').hide();
                }
            }
        });

    }
}