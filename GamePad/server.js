const express = require('express');
const { Server } = require('socket.io');
const path = require('path');
const robot = require("robotjs")
const os = require('os');
const { exec, spawn } = require('child_process');
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
const { log } = require('console');

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

//   socket.on("disconnect", (reason) => {
//    console.log("disconnected:", reason);
//    socket.conn.transport.doClose = false;
   
//    // socket.connect();
//  });

   socket.on('game-started', gameName => {
      if (!GAMES[gameName]) {
         console.log(`Invalid gamename: ${gameName}`)
         return
      }

      GAME_NAME = gameName
      GAME = GAMES[gameName]

   // // Start the game using the game's path
   // var gameProcess = exec(GAME.executable[0], (error, stdout, stderr) => {
   //    if (error) {
   //    console.error(`Failed to start the game: ${error}`);
   //    } else {
   //    console.log("Game started");
   //    }
   // });
      var gameProcess
   if (GAME.path.endsWith('.py')) {
      console.log('Its a python game');
      gameProcess = spawn("python3", [GAME.path, "arg1", "arg2"]);
   } else if (GAME.path.endsWith('cpp')) {
      console.log("its a C++ game");
      gameProcess = spawn(GAME.path);
   }
   // Start the Python game using the game's path and arguments
  

   // Handle game process output
   gameProcess.stdout.on("data", (data) => {
      console.log(`Game output: ${data}`);
      // Handle game output here, e.g., send it to players, process it, etc.
   });

   // Handle game process error
   gameProcess.stderr.on("data", (data) => {
      console.error(`Game error: ${data}`);
      // Handle game error here, e.g., log it, notify players, etc.
   });

   // Handle game process exit
   gameProcess.on("exit", (code, signal) => {
      console.log(`Game process exited with code ${code} and signal ${signal}`);
      // Handle game process exit here, e.g., update game status, notify players, etc.
   });


   })

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
    if (!pressedControl) return;

    if (currentGame.toggles.includes(cmd)) {
        try {
            if (context == "start") robot.keyToggle(pressedControl, "down");
            if (context == "stop") robot.keyToggle(pressedControl, "up");
        } catch(e) {
            console.error(e);
        }
        
    } else if (currentGame.taps.includes(cmd)) {
        try {
            if (context == "start") robot.keyTap(pressedControl);
        } catch (e) {
            console.error(e)
        }
        
    }

    let currentPlayer = connectedClients[clientHash]
    currentPlayer.startDisconnectTimer(removePlayerAndUpdateQueue)
  });
})


io.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    socket.emit('reportBack');
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

app.get('/', (req, res) => {
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
