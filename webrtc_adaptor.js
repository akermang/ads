var pc_config = null;

var sdpConstraints = {
    OfferToReceiveAudio : true,
    OfferToReceiveVideo : true

};
var mediaConstraints = {
    video : true,
    audio : true
};

var webRTCAdaptor = new WebRTCAdaptor({
    websocket_url : "ws://54.163.27.97:5443/WebRTCAppEE",
    mediaConstraints : mediaConstraints,
    peerconnection_config : pc_config,
    sdp_constraints : sdpConstraints,
    remoteVideoId : "remoteVideo",
    isPlayMode: true,
    callback : function(info) {
        if (info == "initialized") {
            console.log("initialized");
            webRTCAdaptor.play("Dromi");
        
        } else if (info == "play_started") {
            //play_started
            console.log("play started");
        
        } else if (info == "play_finished") {
            // play finishedthe stream
            console.log("play finished");
            
        }
    },
    callbackError : function(error) {
        //some of the possible errors, NotFoundError, SecurityError,PermissionDeniedError

        console.log("error callback: " + error);
        alert(error);
    }
});

const stop =() => webRTCAdaptor.stop()