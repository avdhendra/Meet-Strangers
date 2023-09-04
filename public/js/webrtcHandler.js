import * as wss from './wss.js';
import * as constants from './constants.js';
import * as ui from './ui.js';
import * as store from './store.js';
let connectedUserDetails;
let peerConnection
let dataChannel


const defaultConstraints = {
    audio: true,
    video:true
}
//stun getting the ice candidate
const configuration = {
    "iceServers": [{ "url": "stun:stun.1.google.com:19302" }] 
}

export const getLocalPreview = () => {
    navigator.mediaDevices.getUserMedia(defaultConstraints).then((stream) => {
        ui.updateLocalVideo(stream) 
        ui.showVideoCallButtons()
       store.setCallState(constants.callState.CALL_AVAILABLE)
        store.setLocalStream(stream)
    }).catch((error) => {
        console.log("Error occurred when trying to get an access to camera")
        console.log(error)
    })
}

const createPeerConnection = () => {
    peerConnection=new RTCPeerConnection(configuration)
  
    dataChannel = peerConnection.createDataChannel('chat')
    peerConnection.ondatachannel = (event) => {
        const dataChannel = event.channel;
        dataChannel.onopen = () => {
            console.log('peer connection is ready to receive data channel message')

        }

        dataChannel.onmessage = (event) => {
            console.log('message came from data channel')
            const message = JSON.parse(event.data);
            console.log(message);
            ui.appendMessage(message)
        }
    }
  
  
  
  
    peerConnection.onicecandidate = (event) => {
        console.log('getting ice candidates from stun server')
        
        if (event.candidate) {
        //send our ice candidate to the other peer
            
            wss.sendDataUsingWebRTCSignaling({
               connectedUserSocketId:connectedUserDetails.socketId,
                type: constants.webRTCSignaling.ICE_CANDIDATE,
                candidate:event.candidate
            })
            
            
        }
        
    }
    peerConnection.onconnectionstatechange = (event) => {
        if (peerConnection.connectionState === 'connected') {
            console.log('successfully connected with other peer')
        }
    }

    //recieving tracks
    const remoteStream = new MediaStream()
    store.setRemoteStream(remoteStream)
    ui.updateRemoteVideo(remoteStream)

    peerConnection.ontrack = (event) => {
        remoteStream.addTrack(event.track)

    }


//add our stream to peer connection
    if (connectedUserDetails.callType === constants.callType.VIDEO_PERSONAL_CODE||connectedUserDetails.callType===constants.callType.VIDEO_STRAGER) {
        //get audio and video tracks from localstream
        const localStream = store.getState().localStream;
        for (const track of localStream.getTracks()) {
            peerConnection.addTrack(track, localStream)
            
        }
    }

}







export const sendMessageUsingDataChannel = (message) => {
    const stringifiedMessage = JSON.stringify(message)
    dataChannel.send(stringifiedMessage)

}









export const sendPreOffer = (callType, calleepersonalCode) => {
	// console.log('pre offer')
	// console.log(callType)
	// console.log(calleepersonalCode)
	connectedUserDetails = {
		callType,
		socketId: calleepersonalCode
	};

	if (callType === constants.callType.CHAT_PERSONAL_CODE || callType === constants.callType.VIDEO_PERSONAL_CODE) {
		const data = {
			callType,
			calleepersonalCode
		};
		ui.showCallingDialog(callingDialogRejectCallHandler);
		store.setCallState(constants.callState.CALL_UNAVAILABLE)
        wss.sendPreOffer(data);
    }
    if (callType === constants.callType.CHAT_STRAGER || callType === constants.callType.VIDEO_STRAGER) {
        
        const data = {
            callType,
            calleepersonalCode
        }
        store.setCallState(constants.callState.CALL_UNAVAILABLE);
        wss.sendPreOffer(data)

    }
};

export const handlePreOffer = (data) => {
	const { callType, callerSocketId } = data;
   
      if (!checkCallPossibility()) {
        return sendPreOfferAnswer(constants.preOfferAnswer.CALL_UNAVAILABLE,callerSocketId)
    }
    //console.log('dog', data);
	connectedUserDetails = {
		socketId: callerSocketId,
		callType
    };
   
store.setCallState(constants.callState.CALL_UNAVAILABLE)
	if (callType === constants.callType.CHAT_PERSONAL_CODE || callType === constants.callType.VIDEO_PERSONAL_CODE) {
		console.log('showing call dialog');

		ui.showIcomingCallDialog(callType, acceptCallHandler, rejectCallHandler);
    }
    
    if (callType === constants.callType.CHAT_STRAGER || callType === constants.callType.VIDEO_STRAGER) {
        createPeerConnection()
        sendPreOfferAnswer(constants.preOfferAnswer.CALL_ACCEPTED)
        ui.showCallElements(connectedUserDetails.callType)
    }
    



};
const acceptCallHandler = () => {
    console.log('call accepted');
    createPeerConnection()
    sendPreOfferAnswer(constants.preOfferAnswer.CALL_ACCEPTED);
    ui.showCallElements(connectedUserDetails.callType)
};
const rejectCallHandler = () => {
    console.log('call rejected');
    setIncomingCallsAvailable()
  sendPreOfferAnswer(constants.preOfferAnswer.CALL_REJECTED);
};


const callingDialogRejectCallHandler = () => {
    console.log('reject calling ')
    const data = {
        connectedUserSocketId: connectedUserDetails.socketId,
        
    }
    closePeerConnectionAndResetState()
    wss.sendUserHangedUp(data)
}


const sendPreOfferAnswer = (preofferAnswer,callerSocketId=null) => {
    const socketId = callerSocketId ? callerSocketId : connectedUserDetails.socketId;
    const data = {
        callerSocketId: socketId,
        preOfferAnswer: preofferAnswer
    }
    console.log('g1',data)
    ui.removeAllDialog()
    wss.sendPreofferAnswer(data)

}
 

export const handlePreOfferAnswer =  (data) => { 
    const { preOfferAnswer } = data;
    console.log('pre offer answer came')
   ui.removeAllDialog()
    if (preOfferAnswer === constants.preOfferAnswer.CALLEE_NOT_FOUND) {
        //show dialog that callee has not been found
        ui.showInfoDialog(preOfferAnswer)
       // store.setCallState(constants.callState.CALL_AVAILABLE)
        setIncomingCallsAvailable()
    }
    if (preOfferAnswer === constants.preOfferAnswer.CALL_UNAVAILABLE) {
        //show dialog that callee is not availabl to connect
        ui.showInfoDialog(preOfferAnswer)
       //  store.setCallState(constants.callState.CALL_AVAILABLE)
    setIncomingCallsAvailable()
    }

    if (preOfferAnswer === constants.preOfferAnswer.CALL_REJECTED) {
        //show dialog that call is rejected by the callee
        ui.showInfoDialog(preOfferAnswer)
       //  store.setCallState(constants.callState.CALL_AVAILABLE)
    setIncomingCallsAvailable()
    }
    if (preOfferAnswer === constants.preOfferAnswer.CALL_ACCEPTED) {
        //send webrtc offer
        ui.showCallElements(connectedUserDetails.callType)
   
        createPeerConnection()
        //if call is accepted by the callee
         sendWebRTCOffer()
   
    }
}

const sendWebRTCOffer = async () => {
    //exchanging sdp information caller side
    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

//exchange sdp information to callee side
    wss.sendDataUsingWebRTCSignaling({
        connectedUserSocketId: connectedUserDetails.socketId,
        type: constants.webRTCSignaling.OFFER,
        offer:offer
    })
}

export const handleWebRTCOffer =  async(data) => {
await peerConnection.setRemoteDescription(data.offer)
    const answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)
    wss.sendDataUsingWebRTCSignaling({
        connectedUserSocketId: connectedUserDetails.socketId,
        type: constants.webRTCSignaling.ANSWER,
        answer:answer
    })
}

export const handleWebRTCAnswer = async (data) => {
   console.log('handling webRTC Answer')
    await peerConnection.setRemoteDescription(data.answer)

}

export const handleWebRTCCandidate = async (data) => {
  console.log('handling webRTCCandidate')
    try {
        await peerConnection.addIceCandidate(data.candidate)
    } catch (err) {
        console.error("error occured while trying to add received ice candidate",err)
    }
}


let screenSharingStream;

export const switchBetweenCameraAndScreenSharing = async (screenSharingActive) => {
    if (screenSharingActive) {
        const localStream = store.getState().localStream
        const senders = peerConnection.getSenders()
        
        const sender = senders.find((sender) => {
            return (
        sender.track.kind===screenSharingStream.getVideoTracks()[0].kind
            )
        })
        
        if (sender) {
            sender.replaceTrack(localStream.getVideoTracks()[0])
        }
        //stop screen sharing stream
        store.getState().screenSharingStream.getTracks().forEach((track)=>track.stop())

        store.setScreenSharingActive(!screenSharingActive)
        ui.updateLocalVideo(localStream)






    } else {
        console.log('switching for screen sharing')

        try {
            
            screenSharingStream = await navigator.mediaDevices.getDisplayMedia({
              video:true
            })
            store.setScreenSharingStream(screenSharingStream)
            //repalce track which sender is sending
            const senders = peerConnection.getSenders()
            const sender = senders.find((sender) => 
                sender.track.kind===screenSharingStream.getVideoTracks()[0].kind
            )
            if (sender) {
                sender.replaceTrack(screenSharingStream.getVideoTracks()[0])
            }
            store.setScreenSharingActive(!screenSharingActive)
            ui.updateLocalVideo(screenSharingStream)


        } catch (err) {
            console.error("error occured when try to get screen sharing stream",err)
        }
    }
}

//hangup
export const handleHangUp = () => {
    console.log('finising the call')
    const data = {
        connectedUserSocketId:connectedUserDetails.socketId
    }
    wss.sendUserHangedUp(data)
    closePeerConnectionAndResetState()
}

export const handleConnectedUserHangedUp = () => { 
    console.log('connected peer hanged up')
    closePeerConnectionAndResetState()

}


const closePeerConnectionAndResetState = () => {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    //active mic and camera
    if (connectedUserDetails.callType === constants.callType.VIDEO_PERSONAL_CODE || connectedUserDetails.callType === constants.callType.VIDEO_STRAGER) {
        store.getState().localStream.getVideoTracks()[0].enabled = true;
        store.getState().localStream.getAudioTracks()[0].enabled = true;
        
    }
    ui.updateUIAfterHangUp(connectedUserDetails.callType)
    setIncomingCallsAvailable()
    connectedUserDetails = null;
}

const checkCallPossibility = (callType) => {
    const callState = store.getState().callState;
    if (callState === constants.callState.CALL_AVAILABLE) {
        return true;
    }
    if ((callType === constants.callType.VIDEO_PERSONAL_CODE || callType === constants.callType.VIDEO_STRAGER) && (callState===constants.callState.CALL_AVAILABLE_ONLY_CHAT)) {
        return false
    }
    return false
}

const setIncomingCallsAvailable = () => {
    const localStream = store.getState().localStream
    if (localStream) {
        store.setCallState(constants.callState.CALL_AVAILABLE)
    } else {
        store.setCallState(constants.callState.CALL_AVAILABLE_ONLY_CHAT)
    }
}





