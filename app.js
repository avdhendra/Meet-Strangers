const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/public/index.html');
});

let connectedPeers = []; //id of peers
let connectedPeerStrangers = []

io.on('connection', (socket) => {
	// console.log('user connected to SOCKET.IO server');
	// console.log(socket.id);

	connectedPeers.push(socket.id);
	console.log(connectedPeers);

	//listen the emit
	socket.on('preoffer', (data) => {
		
		const { calleepersonalCode, callType } = data;
		
		const connectedPeer = connectedPeers.find((peerSocketId) => peerSocketId === calleepersonalCode);
		
		if (connectedPeer) {
			const data = {
				callerSocketId: socket.id,
				callType
			};
			io.to(calleepersonalCode).emit('preoffer', data);
        } else {
            const data = {
                preOfferAnswer:'CALLEE_NOT_FOUND'
            }
            io.to(socket.id).emit('pre-offer-answer', data);
        }
	});

	//answer the call
	socket.on('preofferanswer', (data) => {
		console.log('preofferans');
		
		const { callerSocketId } = data;
        const connectedPeer = connectedPeers.find((peerSocketId) => peerSocketId === callerSocketId);
        
		if (connectedPeer) {
		
            io.to(callerSocketId).emit('preofferanswer', data);
		}
    });
    
//
    socket.on("webRTC-Signaling", (data) => {
        console.log('mard',data)
        const { connectedUserSocketId } = data;
        const connectedPeer = connectedPeers.find((peerSocketId) => peerSocketId === connectedUserSocketId)
        if (connectedPeer) {
            io.to(connectedUserSocketId).emit("webRTC-signaling", data);
        }
    })


//hanged up
    socket.on('userHangedUp', (data) => {
        const { connectedUserSocketId } = data;
         const connectedPeer = connectedPeers.find((peerSocketId) => peerSocketId === connectedUserSocketId)
   
        if (connectedPeer) {
       io.to(connectedUserSocketId).emit("user-hanged-up")
   }
   
    })

    socket.on('stranger-connection-status', (data) => {
        const { status } = data;
        if (status) {
            connectedPeerStrangers.push(socket.id)
        } else {
            const newConnectedPeerStrangers=connectedPeerStrangers.filter(peerSocketId=>peerSocketId!==socket.id)
            connectedPeerStrangers = newConnectedPeerStrangers;
        }
})

    socket.on('get-stranger-socket-id', () => {
        let randomStrangerSocketId;
        const filteredConnectedPeerStrangers = connectedPeerStrangers.filter((peerSocketId) => peerSocketId !== socket.id)
        if (filteredConnectedPeerStrangers.length > 0) {
            randomStrangerSocketId = filteredConnectedPeerStrangers[Math.floor(Math.random() * filteredConnectedPeerStrangers.length)]
            

        } else {
            randomStrangerSocketId = null;
        }
        const data = {
            randomStrangerSocketId 
        };
        io.to(socket.id).emit('stranger-socket-id', data);

    })


	socket.on('disconnect', () => {
		console.log('user disconnect from SOCKET.IO');
		const newConnectedPeers = connectedPeers.filter((peerSocketId) => peerSocketId !== socket.id);
		connectedPeers = newConnectedPeers;
		//console.log(connectedPeers);
        const newConnectedPeersStrangers = connectedPeerStrangers.filter((peerSocketId) => peerSocketId !== socket.id)
        connectedPeerStrangers=newConnectedPeersStrangers
	});
});

server.listen(PORT, () => {
	console.log(`listening on PORT: ${PORT}...`);
});
