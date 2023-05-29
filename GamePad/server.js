const express = require('express');
const { Server } = require('socket.io');
const path = require('path');
const robot = require("robotjs")
const os = require('os');
// const { exec } = require('child_process');
const app = express();
var socketGlobal;

app.use(express.static('gamepad-files'));
app.use(express.static('gamepicker-files'));
const server = app.listen(5002, '0.0.0.0', () => {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const network of iface) {
      if (network.family === 'IPv4' && !network.internal) {
        console.log(`Server running on ${network.address}:${server.address().port}`);
        console.log(`Controller: http://${network.address}:${server.address().port}/gamepad`);
        console.log(`Game Picker: http://${network.address}:${server.address().port}/start`);
        break;
      }
    }
  }
});

const io = new Server(server, {
   pingInterval: 60000,  // Send a ping every 25 seconds
   pingTimeout: 120000,   // Wait 60 seconds for a response
 });
const GAMES = require('./config.js');
const Player = require('./player.js');

let totalPlayers = 0;
let GAME_STARTED = false;
let GAME_NAME = 'mainPage';
let GAME = GAMES[GAME_NAME];;

// A set to keep track of connected clients
const connectedClients = {}


function removePlayerAndUpdateQueue(playerToDisconnect, socket) {
    console.log("player disconnect method called");
    Array.from(Object.values(connectedClients)).map(player => {
        if (player.getNumber() > playerToDisconnect.getNumber()) player.moveForwardInQueue()
        return player;
    })
    delete connectedClients[playerToDisconnect.getHash()]
    totalPlayers--;
    console.log("Disconnected player:", playerToDisconnect.getHash(), playerToDisconnect.getNumber() );
    console.log("there are currently " + Array.from(Object.values(connectedClients)).length + " connected clients")

    let maximumPlayers = GAMES[GAME_NAME].players;

    if (Array.from(Object.values(connectedClients)).length === 0) {
      console.log('Last player disconnected, and there are no players in queue');
      return;
    }

    let playerToRemoveFromQueue = Array.from(Object.values(connectedClients)).find(player => player.getNumber() === maximumPlayers)
    if (!playerToRemoveFromQueue) return;

    console.log("emmiting unqueue event");
    io.emit('unqueue', playerToRemoveFromQueue.getHash())
}


io.on('connection', (socket) => {
   socketGlobal = socket;
  console.log('Client connected:', socket.id);

  socket.on("disconnect", (reason) => {
   console.log("disconnected:", reason);
   socket.conn.transport.doClose = false;
   
   // socket.connect();
 });

  socket.on("add-player", playerHash => {
    console.log("ADD PLAYER CALLED", playerHash);
    let maximumPlayers = GAMES[GAME_NAME].players;

    if (!connectedClients[playerHash]) {
      console.log("upper");
        let newPlayer = new Player(playerHash, ++totalPlayers);
        connectedClients[playerHash] = newPlayer
        console.log("there are currently " + Array.from(Object.values(connectedClients)).length + " connected clients")

        // totalPlayers is in this case the number of player added
        if (totalPlayers > maximumPlayers) {
            socket.emit('queue', maximumPlayers - totalPlayers)
            return;
        }
        console.log(newPlayer);
        newPlayer.startDisconnectTimer(removePlayerAndUpdateQueue, socket)

    } else {
      console.log("bottom case");
      playerRequested = connectedClients[playerHash]
      if (playerRequested.isInQueue(maximumPlayers)) {
         socket.emit('queue', maximumPlayers - totalPlayers)
         return;
     }
    }
  })

  socket.on('ctrl', (message) => {
    message = JSON.parse(message.data)
    const { cmd, context, clientHash } = message;

    if (!connectedClients[clientHash]) {
        console.log("Not existing player tried to use controls. Ignoring them");
        return;
    }

    let currentGame = GAMES[GAME_NAME];
    let playerNumber = connectedClients[clientHash].getNumber()
    let maximumPlayers = currentGame.players;
    if (playerNumber > maximumPlayers) {
        console.log(`Player in queue (${playerNumber - maximumPlayers} in queue) tried to use controls. Ignoring them`);
        return;
    }

    console.log('ctrl', message);

    
    console.log("Pressed player number: ", playerNumber);
    let pressedControl = currentGame.controls[playerNumber - 1][cmd]
    if (!pressedControl) return

    if (currentGame.toggles.includes(cmd)) {
        if (context == "start") robot.keyToggle(pressedControl, "down");
        if (context == "stop") robot.keyToggle(pressedControl, "up");
    } else if (currentGame.taps.includes(cmd)) {
        if (context == "start") robot.keyTap(pressedControl);
        
    }

    let currentPlayer = connectedClients[clientHash]
    currentPlayer.startDisconnectTimer(removePlayerAndUpdateQueue)
  });
})


io.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    socket.emit('reportBack');
});


// Route for games
app.get('/', (req, res) => {
  const { param: gameName } = req.query;
  GAME = GAMES[gameName];
  exec(GAME.executable.join(' '), (error) => {
    if (error) {
      console.error('Error while executing game:', error);
    } else {
      GAME_STARTED = true;
      res.sendFile('/ctrl.html', { game: gameName });
    }
  });
});

// Route for serving the start button
app.get('/start', (req, res) => {
    const filePath = path.join(__dirname, '/templates/index.html');
    res.sendFile(filePath, { game: 'mainPage' });
});

app.get('/gamepad', (req, res) => {
    const filePath = path.join(__dirname, '/templates/ctrl.html');
    res.sendFile(filePath, { game: 'mainPage' });
});

// Route for disconnecting timed out players
app.get('/timed-out', (req, res) => {
    const filePath = path.join(__dirname, '/templates/timed_out.html');
    res.sendFile(filePath, { game: 'mainPage' });
});

app.get('/queue', (req, res) => {
    const filePath = path.join(__dirname, '/templates/waiting_queue.html');
    res.sendFile(filePath, { game: 'mainPage' });
});

// Routes for serving static files
app.use('/gamepad-files', express.static('gamepad-files'));
app.use('/gamepicker-files', express.static('gamepicker-files'));
