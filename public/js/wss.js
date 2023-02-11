import * as store from './store.js';
import * as ui from './ui.js';
import * as webrtcHandler from './webrtcHandler.js';
import * as constants from './constants.js';
import * as strangerUtils from './strangerUtils.js'
let socketIO=null
export const registerSocketEvents = (socket) => {
     socketIO = socket;
    socket.on('connect', () => {
      
        console.log('Successfully connected to websocket server')
    console.log(socket.id)
    store.setSocketId(socket.id);
    ui.updatePersonalCode(socket.id);
    })
    
    socket.on('preoffer', (data) => {
        webrtcHandler.handlePreOffer(data)
    })


    socket.on('preofferanswer', (data) => {
        console.log('h1',data)
        webrtcHandler.handlePreOfferAnswer(data) //
    })
//getting response of handed off
    
    
    socket.on("user-hanged-up", () => {
        webrtcHandler.handleConnectedUserHangedUp()
    })
    
    
    
    

    socket.on("webRTC-signaling", (data) => {
        console.log('kide',data)
        switch (data.type) { 
            case constants.webRTCSignaling.OFFER:
                webrtcHandler.handleWebRTCOffer(data);
                break;
            case constants.webRTCSignaling.ANSWER:
                webrtcHandler.handleWebRTCAnswer(data)
                break;
            case constants.webRTCSignaling.ICE_CANDIDATE:
                webrtcHandler.handleWebRTCCandidate(data)
                break;
            default:
                return
        }
    })

    socket.on('stranger-socket-id', (data) => {
        strangerUtils.connectWithStranger(data)
    })

}
export const sendPreOffer = (data) => {
    socketIO.emit("preoffer",data)
}

export const sendPreofferAnswer = (data) => {
    console.log('pop')
    socketIO.emit("preofferanswer",data)
}

export const sendDataUsingWebRTCSignaling = (data) => {
    socketIO.emit("webRTC-Signaling",data)
}

export const sendUserHangedUp = (data) => {
    socketIO.emit("userHangedUp",data)
}

export const changeStrangerConnectionStatus = (data) => {
    socketIO.emit('stranger-connection-status',data)
}

export const getStrangerSocketId = () => {
    socketIO.emit('get-stranger-socket-id')

}