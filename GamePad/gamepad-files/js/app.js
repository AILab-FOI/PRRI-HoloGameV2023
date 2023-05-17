
const btnChangeBackground = document.querySelector(".btn-background")
const bodyElement = document.querySelector('body')
const allButtonElements = document.querySelectorAll('.btn')

const bgFolder = '/gamepad-files/images/pozadina'
const backgroundsImageNames = ['plava.png', 'crvena.png', 'roza.png', 'siva.png', 'zelena.png']
let images = []

console.log('changes');
let imageCounter = 0
btnChangeBackground.addEventListener('click', function() {
   imageCounter++
   if (imageCounter > backgroundsImageNames.length-1) imageCounter = 0;
   bodyElement.style.backgroundImage = `url(${bgFolder}/${backgroundsImageNames[imageCounter]})`
})

var ws = io();
	ws.on('connect', function() {
            console.log( 'Connected to server!' );
			startTimeout(600)
	});
	ws.on('error', function( msg ){
	    console.log( msg );
	});
	ws.on('stop', function(){
	    alert('Game finished!');
	    window.location.href = "/start";
	});
	ws.on('redirect', function(location){
		window.location.href = location
	})
	
	function send( ctrl, context )
	{
	    ws.emit( 'ctrl', { data: JSON.stringify( { "cmd":ctrl, "context":context, "game":"{{game}}" } ) } );
	}
	
	$('.cbutton').on( 'mousedown touchstart', function( event ){
	    //event.stopPropagation();
	    event.preventDefault();
	    if(event.handled !== true) {
		
		send( $( this ).attr('alt'), 'start' );
		console.log( 'generic', $( this ).attr('alt'), 'start' );
		navigator.vibrate(100); 
		
		event.handled = true;
	    } else {
		return false;
	    }
	});
	
	$('.cbutton').on( 'mouseup touchend touchcancel', function( event ){
	    //event.stopPropagation();
	    event.preventDefault();
	    if(event.handled !== true) {
		   send( $( this ).attr('alt'), 'stop' );
		   console.log( 'generic', $( this ).attr('alt'), 'stop' );
		
		   event.handled = true;
	    } else {
		   return false;
	    }
	});

var connection_timer;

function startTimeout(seconds){
	if(connection_timer != null){
		clearTimeout(connection_timer);
	}
	connection_timer = setTimeout(timedOut, seconds * 1000);
}

function timedOut(){
	ws.disconnect();
	window.location.href = "/timed-out";
}
	
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
			startTimeout(30)
            event.handled = true;
         } else {
            return false;
         }
      })
   })
   
})