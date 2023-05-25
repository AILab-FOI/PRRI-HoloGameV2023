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

let totalPlayers = 0;
let GAME_STARTED = false;
let GAME_NAME = 'mainPage';

let GAME = GAMES[GAME_NAME];;
const REPORT_BACK_TIMER = 3;

let reportBackTimer = null; // Timeout handle for the timer

// A set to keep track of connected clients
const connectedClients = {}
const playerWaitingQueue = [];
let reportedBackGamepads = []

function addPlayer(gamepadHash) {
  if (connectedClients.has(gamepadHash)) return;

  connectedClients.add(gamepadHash);
  const addedPlayerIndex = Array.from(connectedClients).sort().indexOf(gamepadHash);
  PLAYERS = connectedClients.length;

  console.log('PLAYER', gamepadHash, ' IS ', addedPlayerIndex);

  if (addedPlayerIndex + 1 > GAMES[GAME_NAME].players) {
    console.log('Too many players, adding player to waiting queue');
    playerWaitingQueue.push(gamepadHash);

    // SEND A PLAYER WAITING QUEUE PAGE HERE
    // res.redirect('/waiting_queue');
    // render_template('timed_out.html', game = 'mainPage');
  }
}

function removeFromCollections(sid) {
  if (connectedClients.has(sid)) {
    connectedClients.delete(sid);
    connectedClients.add(playerWaitingQueue.shift());
  } else {
    PLAYERS--;
    playerWaitingQueue.splice(playerWaitingQueue.indexOf(sid), 1);
  }
}

function compareLists(list1, list2) {
  const uniqueElements = [];

  for (const element of list1) {
    if (!list2.has(element)) {
      uniqueElements.push(element);
    }
  }

  return uniqueElements;
}

function timerCallback() {
  console.log('Timer ended!');
  const clientsToRemove = compareLists(connectedClients, reportedBackGamepads);
  for (const clientHash of clientsToRemove) {
    console.log('Removing client:', clientHash);
    connectedClients.delete(clientHash);
  }
  timerRunning = false;
}

function startTimer(duration, callback) {
  console.log('TIMER STARTING');
  reportBackTimer = setTimeout(() => {
    callback();
  }, duration * 1000);
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  PLAYERS = 0;

//   if (reportBackTimer !== null) {
//     console.log('TIMER ALREADY EXISTS, CANCELLING IT...');
//     clearTimeout(reportBackTimer);
//     reportBackTimer = null;
//   }

//   startTimer(REPORT_BACK_TIMER, timerCallback);
//   socket.emit('reportBack');

  socket.on("add-player", playerHash => {
    console.log("ADD PLAYER CALLEd");
    if (!connectedClients[playerHash]) {
        console.log("setting new index", playerHash);

        connectedClients[playerHash] = totalPlayers;
        totalPlayers++
    } else {

    }
    
  })

  socket.on('ctrl', (message) => {
    message = JSON.parse(message.data)
    console.log('ctrl', message);
    const { cmd, context, clientHash } = message;
    console.log(connectedClients);

    let currentGame = GAMES[GAME_NAME];
    let playerIndex = connectedClients[clientHash] - 1
    console.log("Player index is: ", playerIndex);
    let pressedControl = currentGame.controls[playerIndex][cmd]
    if (!pressedControl) return
    console.log("pressedControl", pressedControl);

    if (currentGame.toggles.includes(cmd)) {
        if (context == "start") robot.keyToggle(pressedControl, "down");
        if (context == "stop") robot.keyToggle(pressedControl, "up");
    } else if (currentGame.taps.includes(cmd)) {
        if (context == "start") robot.keyTap(pressedControl);
        
    }

    


    const game = GAME_NAME;

    if (PLAYERS > GAMES[game].players) {
        console.log('Too many players! Player', PLAYERS);
        socket.emit('error', { message: 'Too many players already connected for this game.' });
        return;
    }



    // Perform the necessary actions based on cmd and context
    if (GAMES[game].taps.includes(cmd)) {
        console.log("its a tap");


    }



    if (cmd in GAMES[game].taps) {
        
        if (context === 'start') {
        // Perform tap action
        }
    } else if (cmd in GAMES[game].toggles) {
        console.log("its a toggle");
        if (context === 'start') {
            
        // Perform toggle start action
        } else {
        // Perform toggle stop action
        }
    }

    console.log('Player', PLAYERS, 'Got', cmd, context);
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




// // Runs when server receives a gamepad control
// io.on('ctrl', (message) => {
//     console.log('ctrl', message);
//     const { cmd, context } = message;

//     const game = GAME_NAME;
//     console.log('CURRENT GAME', game);

//     if (PLAYERS > GAMES[game].players) {
//         console.log('Too many players! Player', PLAYERS);
//         socket.emit('error', { message: 'Too many players already connected for this game.' });
//         return;
//     }

//     // Perform the necessary actions based on cmd and context
//     if (cmd in GAMES[game].taps) {
//         if (context === 'start') {
//         // Perform tap action
//         }
//     } else if (cmd in GAMES[game].toggles) {
//         if (context === 'start') {
//         // Perform toggle start action
//         } else {
//         // Perform toggle stop action
//         }
//     }

//     console.log('Player', PLAYERS, 'Got', cmd, context);
// });

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

// app.get('/waiting_queue', (req, res) => {
//   res.render('waiting_queue');
// });

// Routes for serving static files
app.use('/gamepad-files', express.static('gamepad-files'));
app.use('/gamepicker-files', express.static('gamepicker-files'));
