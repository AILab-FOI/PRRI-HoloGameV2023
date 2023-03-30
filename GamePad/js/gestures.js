/*
More API functions here:
https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose

the link to your model provided by Teachable Machine export panel

LATEST POSE MODEL: https://teachablemachine.withgoogle.com/models/l9442e_e4/
*/
const URL = 'https://teachablemachine.withgoogle.com/models/l9442e_e4/';
let model, webcam, ctx, labelContainer, maxPredictions;
let gestures = {
    Neutral: "Neutral",
    Right: "Right",
    Left: "Left",
    SelectStart: "SelectStart",
    Up: "Up",
    Down: "Down",
};
let oldState = "Neutral";//gestures.Neutral;
let newState = "Neutral";//gestures.Neutral;

let ws;

function send( ctrl, context )
{
    //need to change the hardcoded game argument
    ws.emit( 'ctrl', { data: JSON.stringify( { "cmd":ctrl, "context":context, "game":"abe" } ) } );
}

async function init() 
{
    ws = io();
    ws.on('connect', function() {
        console.log( 'Connected to server!' );
    });
    ws.on('error', function( msg ){
        console.log( msg );
    });
    ws.on('stop', function(){
        alert('Game finished!');
        window.location.href = "/start";
    });


    const modelURL = URL + 'model.json';
    const metadataURL = URL + 'metadata.json';

    console.log("ON INIT: " + newState + " " + oldState);

    // load the model and metadata
    // Refer to tmPose.loadFromFiles() in the API to support files from a file picker
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Convenience function to setup a webcam
    const flip = true; // whether to flip the webcam
    webcam = new tmPose.Webcam(200, 200, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    webcam.play();
    window.requestAnimationFrame(loop);

    // append/get elements to the DOM
    const canvas = document.getElementById('canvas');
    canvas.width = 200; canvas.height = 200;
    ctx = canvas.getContext('2d');
    labelContainer = document.getElementById('label-container');
    for (let i = 0; i < maxPredictions; i++) { // and class labels
        labelContainer.appendChild(document.createElement('div'));
    }
}

async function loop(timestamp) {
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    // Prediction #1: run input through posenet
    // estimatePose can take in an image, video or canvas html element
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    // Prediction 2: run input through teachable machine classification model
    const prediction = await model.predict(posenetOutput);

    for (let i = 0; i < maxPredictions; i++) {
        const cName = prediction[i].className;
        const classPrediction =
            prediction[i].className + ': ' + prediction[i].probability.toFixed(2);
        labelContainer.childNodes[i].innerHTML = classPrediction;

        if (prediction[i].probability.toFixed(2) > 0.90)
        {
            newState = cName;
            console.log("CLASS NAME: " + prediction[i].className + " " + cName);
            //change detected
            if (newState != oldState) 
            {
                if (oldState == "Neutral") 
                {
                    let command = (newState == "SelectStart") ? "SELECT" : newState; 
                    send(command.toUpperCase(), "start");
                    console.log("START " + command.toUpperCase());
                }
                else 
                {
                    //first of all, stop the current/just ended gesture's game movement
                    let command = (newState == "SelectStart") ? "SELECT" : oldState; 
                    send(command.toUpperCase(), "stop");
                    console.log("STOP " + command.toUpperCase());

                    //check if new gesture is neutral - if yes, don't send any game movement command
                    //if it's not, meaning it went from one gesture command straight to another, then start that new gesture's game movement
                    if (newState != "Neutral")
                    {
                        command = (newState == "SelectStart") ? "SELECT" : newState; 
                        send(command.toUpperCase(), "start");
                        console.log("START " + command.toUpperCase());
                    }
                }
                //update state
                oldState = newState;
            }					

        }
    }

    // finally draw the poses
    drawPose(pose);
}

function drawPose(pose) {
	ctx.drawImage(webcam.canvas, 0, 0);
	// draw the keypoints and skeleton
	if (pose) {
		const minPartConfidence = 0.5;
		tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
		tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
	}
}