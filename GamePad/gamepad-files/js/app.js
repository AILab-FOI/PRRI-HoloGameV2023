
const btnChangeBackground = document.querySelector(".btn-background")
const bodyElement = document.querySelector('body')
const allButtonElements = document.querySelectorAll('.btn')

const bgFolder = '/gamepad-files/images/pozadina'
const backgroundsImageNames = ['plava.png', 'crvena.png', 'roza.png', 'siva.png', 'zelena.png']
const AFTER_PRESS_TIMEOUT_SECONDS = 20;
const INITIAL_TIMEOUT_SECONDS = 20
let images = []
let gamepadHash = localStorage.getItem('gamepad-hash')
if (gamepadHash === null) {
	gamepadHash = ""+Date.now()
	localStorage.setItem('gamepad-hash', gamepadHash)
}

let imageCounter = 0
btnChangeBackground.addEventListener('click', function() {
   imageCounter++
   if (imageCounter > backgroundsImageNames.length-1) imageCounter = 0;
   bodyElement.style.backgroundImage = `url(${bgFolder}/${backgroundsImageNames[imageCounter]})`
})

var ws = io();

	ws.on('connect', function() {
		ws.emit('add-player', gamepadHash);
         console.log( 'Connected to server!' );
			startTimeout(INITIAL_TIMEOUT_SECONDS)
	});

	ws.on('error', function( msg ){
	    console.log( msg );
	});

	ws.on('stop', function(){
	    alert('Game finished!');
	    window.location.href = "/start";
	});

	ws.on('queue', function(queueNumber) {
		window.location.href = '/queue'
	})

   ws.on('unqueue', function() {
		console.log("GOT UNQUEUE");
	})

//    ws.on('reportBack', function(){
// 		if (gamepadHash === null) {
//          gamepadHash = Date.now()
//          localStorage.setItem('gamepad-hash', gamepadHash);
//       } else {
//          gamepadHash = localStorage.getItem('gamepad-hash')
//       }

//       console.log("Gamepad hash is:", gamepadHash);

// 		ws.emit('present', (""+gamepadHash));
// 	})


	
	function send( ctrl, context )
	{
	    ws.emit( 'ctrl', { data: JSON.stringify( { "cmd":ctrl, "context":context, "clientHash": gamepadHash } ) } );
	}
	
	// $('.cbutton').on( 'mousedown touchstart', function( event ){
	//     //event.stopPropagation();
	//     event.preventDefault();
	//     if(event.handled !== true) {
		
	// 	send( $( this ).attr('alt'), 'start' );
	// 	console.log( 'generic', $( this ).attr('alt'), 'start' );
	// 	navigator.vibrate(100); 
		
	// 	event.handled = true;
	//     } else {
	// 	return false;
	//     }
	// });
	
	// $('.cbutton').on( 'mouseup touchend touchcancel', function( event ){
	//     //event.stopPropagation();
	//     event.preventDefault();
	//     if(event.handled !== true) {
	// 	   send( $( this ).attr('alt'), 'stop' );
	// 	   console.log( 'generic', $( this ).attr('alt'), 'stop' );
		
	// 	   event.handled = true;
	//     } else {
	// 	   return false;
	//     }
	// });

var connection_timer;

function startTimeout(seconds){
	if(connection_timer != null){
		clearTimeout(connection_timer);
	}
	connection_timer = setTimeout(timedOut, seconds * 1000);
}

function timedOut(){
//    localStorage.clear();
console.log("TIMED OUT");
	ws.emit('remove-player', gamepadHash)
	window.location.href = "/timed-out";
}


function onBeforeUnload(e) {
   e.preventDefault()
//    localStorage.clear();
	console.log("unload");
	ws.emit('remove-player', gamepadHash)
}

window.addEventListener('beforeunload', onBeforeUnload);
	
console.log(allButtonElements);
allButtonElements.forEach(btnElement => {
   'mousedown touchstart'.split(' ').forEach(eventName => {
      btnElement.addEventListener(eventName, function(event) {
         let className = this.className.split(' ')[0]
   
         event.preventDefault();
          if(event.handled !== true) {
         
         send( $( this ).attr('alt'), 'start' );
         console.log( 'generic', $( this ).attr('alt'), 'start' );
         navigator.vibrate(100); 
         
         event.handled = true;
          } else {
         return false;
          }
            
      })
   })
   
   'mouseup touchend touchcancel'.split(" ").forEach(eventName => {
      btnElement.addEventListener(eventName, function(event) {
         event.preventDefault();
         if(event.handled !== true) {
            send( $( this ).attr('alt'), 'stop' );
            console.log( 'generic', $( this ).attr('alt'), 'stop' );
			startTimeout(AFTER_PRESS_TIMEOUT_SECONDS)
            event.handled = true;
         } else {
            return false;
         }
      })
   })
   
})