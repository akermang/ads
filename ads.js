// Define a variable to track whether there are ads loaded and initially set it to false
var adContainer;
var playIcom;
var adsManager;
var adsLoader;
var adDisplayContainer;
var intervalTimer;
var playButton;
var videoContent;
var adDisplayContainerInitialized;
const AD_REQUEST_INTERVAL = 10;

function init() {
  videoContent = document.getElementById('remoteVideo');
  console.log("videoContent clientWidth:",videoContent.clientWidth)
  playButton = document.getElementById("play-button");
  playIcom = document.getElementById("play_button");
  adContainer = document.getElementById("ad-container");
  playButton.addEventListener("click", function (event) {
    console.log("play-button click")
    playAds();
    playButton.style.display = "none";
    playIcom.style.display = "none";
  });
  // playButton.addEventListener('click', playAds);
  setUpAdsLoader();
  // We want a pre-roll, so the first time we request ads set
  // liveStreamPrefetchSeconds to 0.
  requestAds(0);
}

function setUpAdsLoader() {
  // Create the ad display container.
  createAdDisplayContainer();
  // Create ads loader.
  adsLoader = new google.ima.AdsLoader(adDisplayContainer);
  // Listen and respond to ads loaded and error events.
  adsLoader.addEventListener(
      google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
      onAdsManagerLoaded,
      false);
  adsLoader.addEventListener(
      google.ima.AdErrorEvent.Type.AD_ERROR,
      onAdError,
      false);

  // An event listener to tell the SDK that our content video
  // is completed so the SDK can play any post-roll ads.
  var contentEndedListener = function() {adsLoader.contentComplete();};
  videoContent.onended = contentEndedListener;
}

function requestAds(liveStreamPrefetchSeconds) {
  if (adsLoader) {
    adsLoader.contentComplete();
  }
  // Request video ads.
  var adsRequest = new google.ima.AdsRequest();
  adsRequest.adTagUrl = 'https://pubads.g.doubleclick.net/gampad/ads?' +
      'sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&' +
      'impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&' +
      'cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator=';

  // Specify the linear and nonlinear slot sizes. This helps the SDK to
  // select the correct creative if multiple are returned.\
  console.log("videoContent clientWidth:",videoContent.clientWidth);

  adsRequest.linearAdSlotWidth = videoContent.clientWidth * 1.1;
  adsRequest.linearAdSlotHeight = videoContent.clientHeight;
  adsRequest.nonLinearAdSlotWidth = videoContent.clientWidth;
  adsRequest.nonLinearAdSlotHeight = videoContent.clientHeight;;
  adsRequest.liveStreamPrefetchSeconds = liveStreamPrefetchSeconds;
  adsLoader.requestAds(adsRequest);
}


function createAdDisplayContainer() {
  // We assume the adContainer is the DOM id of the element that will house
  // the ads.
  adDisplayContainer = new google.ima.AdDisplayContainer(
    adContainer , videoContent);
}

function playAds() {
  if (!adDisplayContainerInitialized) {
    // Initialize the container. Must be done via a user action on mobile
    // devices.
    videoContent.load();
    adDisplayContainer.initialize();
    adDisplayContainerInitialized = true;
  }

  try {
    // Initialize the ads manager. Ad rules playlist will start at this time.
    adsManager.init(videoContent.clientWidth, videoContent.clientHeight, google.ima.ViewMode.NORMAL);
    // Call play to start showing the ad. Single video and overlay ads will
    // start at this time; the call will be ignored for ad rules.
    adsManager.start();
  } catch (adError) {
    // An error may be thrown if there was a problem with the VAST response.
    videoContent.play();
  }
}

function onAdsManagerLoaded(adsManagerLoadedEvent) {
  // Get the ads manager.
  var adsRenderingSettings = new google.ima.AdsRenderingSettings();
  adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
  // videoContent should be set to the content video element.
  adsManager = adsManagerLoadedEvent.getAdsManager(
      videoContent, adsRenderingSettings);

  // Add listeners to the required events.
  adsManager.addEventListener(
      google.ima.AdErrorEvent.Type.AD_ERROR,
      onAdError);
  adsManager.addEventListener(
      google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
      onContentPauseRequested);
  adsManager.addEventListener(
      google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
      onContentResumeRequested);
  adsManager.addEventListener(
      google.ima.AdEvent.Type.ALL_ADS_COMPLETED,
      onAdEvent);

  // Listen to any additional events, if necessary.
  adsManager.addEventListener(
      google.ima.AdEvent.Type.LOADED,
      onAdEvent);
  adsManager.addEventListener(
      google.ima.AdEvent.Type.STARTED,
      onAdEvent);
  adsManager.addEventListener(
      google.ima.AdEvent.Type.COMPLETE,
      onAdEvent);
}

function onAdEvent(adEvent) {
  // Retrieve the ad from the event. Some events (e.g. ALL_ADS_COMPLETED)
  // don't have ad object associated.
  var ad = adEvent.getAd();
  switch (adEvent.type) {
    case google.ima.AdEvent.Type.LOADED:
      // This is the first event sent for an ad - it is possible to
      // determine whether the ad is a video ad or an overlay.
      if (!ad.isLinear()) {
        // Position AdDisplayContainer correctly for overlay.
        // Use ad.width and ad.height.
        videoContent.play();
      }
      break;
    case google.ima.AdEvent.Type.STARTED:
      // This event indicates the ad has started - the video player
      // can adjust the UI, for example display a pause button and
      // remaining time.
      if (ad.isLinear()) {
        // For a linear ad, a timer can be started to poll for
        // the remaining time.
        intervalTimer = setInterval(
            function() {
              var remainingTime = adsManager.getRemainingTime();
            },
            300); // every 300ms
      }
      break;
    case google.ima.AdEvent.Type.COMPLETE:
      // This event indicates the ad has finished - the video player
      // can perform appropriate UI actions, such as removing the timer for
      // remaining time detection.
      if (ad.isLinear()) {
        clearInterval(intervalTimer);
      }
      break;
    case google.ima.AdEvent.Type.ALL_ADS_COMPLETED:
      // Request ads no later than 5 seconds before our next ad break.
      requestAds(AD_REQUEST_INTERVAL-5);
      // Play those ads at the next ad break.
      setTimeout(() => {playAds();}, AD_REQUEST_INTERVAL*1000);
      break;

  }
}

function onAdError(adErrorEvent) {
  // Handle the error logging.
  console.log(adErrorEvent.getError());
  adsManager.destroy();
}

function onContentPauseRequested() {
  console.log("canFullscreen:", canFullscreen())
  if( canFullscreen() ) {
    // Handle exiting fullscreen
   
  } else {
    // Handle entering fullscreen
    styleAdFullScreen(adContainer);
  }
  // closeFullscreen();
  videoContent.pause();
  videoContent.style.zIndex = "-1";
  // This function is where you should setup UI for showing ads (e.g.
  // display ad timer countdown, disable seeking etc.)
  // setupUIForAds();
}

function styleAdFullScreen(domElement) {
  domElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
  // domElement.mozRequestFullScreen();
  // domElement.msRequestFullscreen();
  // domElement.requestFullscreen(); // standard
}

// Returns true if we can enter fullscreen 
//(i.e. fullscreen function is available and not already fullscreened)

function canFullscreen(){
  return (
    !document.fullscreenElement &&
    !document.mozFullScreenElement &&
    !document.webkitFullscreenElement &&
    !document.msFullscreenElement );
}

setTimeout(function(){

}, 50);

function onContentResumeRequested() {
  styleAdFullScreen(videoContent);
  videoContent.play();
  videoContent.style.zIndex = "1";
  // This function is where you should ensure that your UI is ready
  // to play content. It is the responsibility of the Publisher to
  // implement this function when necessary.
  // setupUIForContent();

}

/* Close fullscreen */
function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) { /* Firefox */
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) { /* IE/Edge */
    document.msExitFullscreen();
  }
}

// Wire UI element references and UI event listeners.
window.addEventListener("load", init)
// init();
