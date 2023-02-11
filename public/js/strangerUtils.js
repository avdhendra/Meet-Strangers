//import { callType } from './constants';
import * as wss from './wss.js';
import * as webrtcHandler from './webrtcHandler.js';
import * as ui from './ui.js';

let strangerCallType;

export const changeStrangerConnectionStatus = (status) => {
    const data = { status };
    wss.changeStrangerConnectionStatus(data);
}

export const getStrangerSocketIdAndConnect = (callType) => {
    strangerCallType = callType
    wss.getStrangerSocketId()
}

export const connectWithStranger = (data) => {
    console.log("jias", data.randomStrangerSocketId)
    if (data.randomStrangerSocketId) {
        webrtcHandler.sendPreOffer(strangerCallType,data.randomStrangerSocketId)
    } else {
        //no user is available for connection
ui.showNoStrangerAvailable()
    }
    
}
