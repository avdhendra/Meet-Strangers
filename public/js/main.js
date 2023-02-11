import * as store from './store.js';
import * as wss from './wss.js';
import * as webrtcHandler from './webrtcHandler.js';
import * as constants from './constants.js';
import * as ui from './ui.js';
import * as recordingUtils from './recordingUtils.js';
import * as strangerUtils from './strangerUtils.js'

//import { showIcomingCallDialog } from './ui.js';
//const socket = io('localhost:3000') what port server use if we use  / it get the port from the same directory
//initialization of socketIO connection
const socket = io('/')
wss.registerSocketEvents(socket)


webrtcHandler.getLocalPreview()






//register event for personal code copy button

const personalCodeCopyButton = document.getElementById('personal_code_copy_button');
personalCodeCopyButton.addEventListener('click', () => {
    const personalCode = store.getState().socketId;
    navigator.clipboard && navigator.clipboard.writeText(personalCode);
})

//register event listener for connection button
const personalCodeChatButton = document.getElementById('personal_code_chat_button');
const personalCodeVideoButton = document.getElementById('personal_code_video_button');

personalCodeChatButton.addEventListener('click', () => {
    console.log('chat button clicked');
    const callePersonalCode = document.getElementById('personal_code_input').value;

    const callType = constants.callType.CHAT_PERSONAL_CODE
    webrtcHandler.sendPreOffer(callType, callePersonalCode);
})

personalCodeVideoButton.addEventListener("click", () => {
    console.log('video button clicked');
    const calleePersonalCode = document.getElementById('personal_code_input').value
    const callType=constants.callType.VIDEO_PERSONAL_CODE
    webrtcHandler.sendPreOffer(callType,calleePersonalCode);
})


const strangerChatButton = document.getElementById('stranger_chat_button')
strangerChatButton.addEventListener('click', () => {
    
strangerUtils.getStrangerSocketIdAndConnect(constants.callType.CHAT_STRAGER)


})
const strangerVideoButton = document.getElementById('stranger_video_button')
strangerVideoButton.addEventListener('click', () => {
    strangerUtils.getStrangerSocketIdAndConnect(constants.callType.VIDEO_STRAGER)
    
})

//register event for allow connection 

const checkbox = document.getElementById('allow_strangers_checkbox')
checkbox.addEventListener('click', () => {
    const checkboxState = store.getState().allowConnectionFromStrangers
    ui.updateStrangerCheckbox(!checkboxState)
    store.setAllowConnectionFromStrangers(!checkboxState)
    strangerUtils.changeStrangerConnectionStatus(!checkboxState)

})



//event listeners for video call buttons

const micButton = document.getElementById("mic_button")
micButton.addEventListener('click', () => {
    const localStream = store.getState().localStream
    const micEnabled = localStream.getAudioTracks()[0].enabled;
    localStream.getAudioTracks()[0].enabled = !micEnabled;
    ui.updateMicButton(micEnabled);

})

const cameraButton = document.getElementById("camera_button")
cameraButton.addEventListener('click', () => {
    const localStream = store.getState().localStream;
    const cameraEnabled = localStream.getVideoTracks()[0].enabled;
    localStream.getVideoTracks()[0].enabled = !cameraEnabled
    ui.updateCameraButton(cameraEnabled);
 })



 //screen sharing

const switchForScreenSharingButton = document.getElementById("screen_sharing_button")
switchForScreenSharingButton.addEventListener('click', () => {
    const screenSharingActive = store.getState().screenSharingActive;
    webrtcHandler.switchBetweenCameraAndScreenSharing(screenSharingActive);
    
})
 
//messenger

const newMessageInput = document.getElementById("new_message_input")
newMessageInput.addEventListener("keydown", (event) => {
    console.log("change occurred");
    const key = event.key
    if (key === "Enter") {
        webrtcHandler.sendMessageUsingDataChannel(event.target.value)
        console.log("jusa",event.target.value)
        ui.appendMessage(event.target.value,true)
        newMessageInput.value = ''
    }
})


const sendMessageButton = document.getElementById("send_message_button")
sendMessageButton.addEventListener("click", () => {
    const message = newMessageInput.value
    webrtcHandler.sendMessageUsingDataChannel(message)
    ui.appendMessage(message,true)
    newMessageInput.value = ''
})


//recording

const startRecordingButton = document.getElementById("start_recording_button")
startRecordingButton.addEventListener("click", () => {
    
    recordingUtils.startRecording()
    ui.showRecordingPanel()
})


const stopRecordingButton = document.getElementById("stop_recording_button")
stopRecordingButton.addEventListener("click", () => {
    console.log('loki')
    recordingUtils.stopRecording()
    ui.resetRecordingButtons()
})
 





//hang up
const hangUpButton = document.getElementById("hang_up_button");
hangUpButton.addEventListener("click", () => { 
webrtcHandler.handleHangUp()

})

const hangUpChatButton = document.getElementById("finish_chat_call_button")
hangUpChatButton.addEventListener("click", () => { 
    webrtcHandler.handleHangUp()
})

