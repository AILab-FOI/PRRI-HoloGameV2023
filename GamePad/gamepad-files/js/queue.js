
var ws = io();

	ws.on('connect', function() {
		console.log("connected");
      console.log(localStorage.getItem('gamepad-hash'));
      ws.emit('queue-connection', "test")
	});

	ws.on('error', function( msg ){
	    console.log( msg );
	});

	// ws.on('stop', function(){
	//     alert('Game finished!');
	//     window.location.href = "/start";
	// });

	ws.on('unqueue', function(hash) {
      console.log("got unqueue", hash);
      if (localStorage.getItem('gamepad-hash') == hash) {
         window.location.href = '/gamepad'
      }
		
	})