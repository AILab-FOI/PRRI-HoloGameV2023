const express = require('express');
const { Server } = require('socket.io');
const path = require('path');
const robot = require("robotjs")
// const { exec } = require('child_process');
const app = express();

app.use(express.static('gamepad-files'));
app.use(express.static('gamepicker-files'));
const server = app.listen(5002, '0.0.0.0', () => {
  console.log('Server running on port 5002');
});
const io = new Server(server);
const GAMES = require('./config.js');
const Player = require('./player.js');

let totalPlayers = 0;
let GAME_STARTED = false;
let GAME_NAME = 'mainPage';
let GAME = GAMES[GAME_NAME];;
let reportBackTimer = null; // Timeout handle for the timer

// A set to keep track of connected clients
const connectedClients = {}
const playerWaitingQueue = [];
let reportedBackGamepads = []

// function addPlayer(gamepadHash) {
//   if (connectedClients.has(gamepadHash)) return;

//   connectedClients.add(gamepadHash);
//   const addedPlayerIndex = Array.from(connectedClients).sort().indexOf(gamepadHash);
//   PLAYERS = connectedClients.length;

//   console.log('PLAYER', gamepadHash, ' IS ', addedPlayerIndex);

//   if (addedPlayerIndex + 1 > GAMES[GAME_NAME].players) {
//     console.log('Too many players, adding player to waiting queue');
//     playerWaitingQueue.push(gamepadHash);

//     // SEND A PLAYER WAITING QUEUE PAGE HERE
//     // res.redirect('/waiting_queue');
//     // render_template('timed_out.html', game = 'mainPage');
//   }
// }

// function removeFromCollections(sid) {
//   if (connectedClients.has(sid)) {
//     connectedClients.delete(sid);
//     connectedClients.add(playerWaitingQueue.shift());
//   } else {
//     PLAYERS--;
//     playerWaitingQueue.splice(playerWaitingQueue.indexOf(sid), 1);
//   }
// }

function compareLists(list1, list2) {
  const uniqueElements = [];

  for (const element of list1) {
    if (!list2.has(element)) {
      uniqueElements.push(element);
    }
  }

  return uniqueElements;
}


function removePlayerAndUpdateQueue(playerToDisconnect) {
    console.log("player disconnect method called");
    Array.from(Object.values(connectedClients)).map(player => {
        if (player.getNumber() > playerToDisconnect.getNumber()) player.moveForwardInQueue()
        return player;
    })
    delete connectedClients[playerToDisconnect.getHash()]
    totalPlayers--;
    console.log("Disconnected player:", playerToDisconnect.getHash(), playerToDisconnect.getNumber() );
    console.log("there are currently " + Array.from(Object.values(connectedClients)).length + " connected clients")
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);


  socket.on("add-player", playerHash => {
    console.log("ADD PLAYER CALLED", playerHash);
    if (!connectedClients[playerHash]) {
        let newPlayer = new Player(playerHash, ++totalPlayers);
        connectedClients[playerHash] = newPlayer

        let maximumPlayers = GAMES[GAME_NAME].players;
        // totalPlayers is in this case the number of player added
        if (totalPlayers > maximumPlayers) {
            socket.emit('queue', maximumPlayers - totalPlayers)
            return;
        }
        console.log(newPlayer);
        newPlayer.startDisconnectTimer(removePlayerAndUpdateQueue)

        console.log("there are currently " + Array.from(Object.values(connectedClients)).length + " connected clients")
    }
  })

//   socket.on('remove-player', playerHash => {
//     console.log('REMOVE PLAYER CALLED', playerHash);
//     if (!connectedClients[playerHash]) {
//         console.log("Player is already disconnected");
//         return;
//     }
//     let disconnectedPlayer = connectedClients[playerHash];
//     console.log(disconnectedPlayer);
//     let disconnectedPlayerNumber = disconnectedPlayer.getNumber();
//     removePlayerAndUpdateQueue(disconnectedPlayer)
//     console.log("there are currently " + Array.from(Object.values(connectedClients)).length + " connected clients")
//   })

  socket.on('ctrl', (message) => {
    message = JSON.parse(message.data)
    const { cmd, context, clientHash } = message;

    if (!connectedClients[clientHash]) {
        console.log("Not existing player tried to use controls. Ignoring them");
        return;
    }

    console.log('ctrl', message);

    let currentGame = GAMES[GAME_NAME];
    let playerNumber = connectedClients[clientHash].getNumber()
    console.log("Player index is: ", playerNumber);
    let pressedControl = currentGame.controls[playerNumber - 1][cmd]
    if (!pressedControl) return
    console.log("pressedControl", pressedControl);

    if (currentGame.toggles.includes(cmd)) {
        if (context == "start") robot.keyToggle(pressedControl, "down");
        if (context == "stop") robot.keyToggle(pressedControl, "up");
    } else if (currentGame.taps.includes(cmd)) {
        if (context == "start") robot.keyTap(pressedControl);
        
    }

    let currentPlayer = connectedClients[clientHash]
    currentPlayer.startDisconnectTimer(removePlayerAndUpdateQueue)


    const game = GAME_NAME;

    if (totalPlayers > GAMES[game].players) {
        console.log('Too many players! Player', totalPlayers);
        socket.emit('error', { message: 'Too many players already connected for this game.' });
        return;
    }
  });

//   io.on('present', (gamepadHash) => {
//     addPlayer(gamepadHash);
//     reportedBackGamepads.add(gamepadHash);
//     console.log('PLAYER ADDED:', PLAYERS, gamepadHash);
//   });

//   io.on('game-started', (gameName) => {
//     console.log(`Game clicked: ${gameName}`);
//     GAME_NAME = gameName;
//     GAME = GAMES[gameName];
//     console.log('SET GAME TO', GAME_NAME);

//     function gameExitCallback() {
//         GAME_STARTED = false;
//         console.log('Game finished! Asking clients to stop.');
//         io.emit('stop');
//         console.log('Done!');
//     }

//     exec(GAME.executable.join(' '), (error) => {
//         if (error) {
//         console.error('Error while executing game:', error);
//         } else {
//         GAME_STARTED = true;
//         gameExitCallback();
//         }
//     });
//   });
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
