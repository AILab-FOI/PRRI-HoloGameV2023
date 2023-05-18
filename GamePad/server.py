#!/usr/bin/env python3
 
import flask
from flask import Flask, render_template, send_from_directory, request, abort
from flask_socketio import SocketIO, emit
import json
import pyautogui
import subprocess
import threading
from threading import Thread
import time
import random
import RPi.GPIO as GPIO
GPIO.setmode( GPIO.BCM )
PIR_PIN = 21
GPIO.setup( PIR_PIN, GPIO.IN )
 
from config import GAMES
 
GAME = GAMES[ 'abe' ] # change this when multiple games are available
 
ADDR_OUT = '0.0.0.0'
PORT = 5000
 
app = Flask(_name_)
app.config[ 'SECRET_KEY' ] = 'šekret'
socketio = SocketIO( app, cors_allowed_origins="*", async_mode='eventlet')
import eventlet
eventlet.monkey_patch()
 
PLAYERS = 0
GAME_STARTED = False
 
cameraSignal = False
 
# A set to keep track of connected clients
connected_clients = set()
 
def popenAndCall( onExit, *popenArgs ):
    """
    Runs the given args in a subprocess.Popen, and then calls the function
    onExit when the subprocess completes.
    onExit is a callable object, and popenArgs is a list/tuple of args that 
    would give to subprocess.Popen.
 
    Adapted from: http://stackoverflow.com/questions/2581817/python-subprocess-callback-when-cmd-exits
    """
 
    def runInThread( onExit, *popenArgs ):
        proc = subprocess.Popen( *popenArgs )
        proc.wait()
        onExit()
        return
    thread = threading.Thread( target=runInThread, args=( onExit, popenArgs ) )
    thread.start()
    # returns immediately after the thread starts
    return thread
 
def background_thread():
    while True:
        global count
        time.sleep(5)
        if sendSignal() == True:
            global cameraSignal
            print("Emitting for camera..." + str(cameraSignal))
            socketio.emit('startCamera', {'message': 'Server generated event'}, namespace='/')
            cameraSignal = False
 
def sendSignal():
    return cameraSignal
 
def motiondetect(test=None):
    global cameraSignal
    if (cameraSignal == False):
        cameraSignal = True
 
@socketio.on( 'connect' )
def connect():
    print( 'Client connected:', request.sid )
    connected_clients.add( request.sid )
    global PLAYERS
    PLAYERS += 1
 
 
@socketio.on( 'disconnect' )
def disconnect():
    print( 'Client disconnected:', request.sid )
    connected_clients.remove( request.sid )
    global PLAYERS
    PLAYERS -= 1
 
@socketio.on( 'ctrl' )
def handle_message( message ):
    print( 'ctrl', message )
    global PLAYERS, GAME_STARTED, GAMES
    if not GAME_STARTED:
        print( 'Game aborted or not started! Player', PLAYERS )
        emit( 'error', { "message": "Game hasn't started or stopped running!" }, broadcast=True )
        return
    try:
        msg = json.loads( message[ 'data' ] )
    except Exception as e:
        print( "Error while loading message:", message )
        emit( 'error', { "message": "Your browser sent an unparsable message." }, broadcast=True )
        return
    cmd = msg[ "cmd" ]
    context = msg[ "context" ]
    game = msg[ "game" ]
    if PLAYERS > GAMES[ game ][ "players" ]:
        print( "Too many players! Player", PLAYERS )
        emit( 'error', { "message": "Too many players already connected for this game." }, broadcast=True )
        return
    # TODO: add controls for other players
    try:
        toggles = GAMES[ game ][ "controls" ][ PLAYERS - 1 ]
    except Exception as e:
        print( "Error, unknown game! Player", PLAYERS )
        emit( 'error', {"message": "Error! Unknown game!" }, broadcast=True )
        return
 
    if cmd in GAMES[ game ][ 'taps' ]:
        if context == "start":
            pyautogui.press( toggles[ cmd ] ) # discard stop, only one tap is needed
    if cmd in GAMES[ game ][ 'toggles' ]:
        if context == "start":
            pyautogui.keyDown( toggles[ cmd ] )
        else:
            pyautogui.keyUp( toggles[ cmd ] )
    print( 'Player', PLAYERS, 'Got', cmd, context )
 
 
# Route for serving the controller
@app.route( '/' )
def ctrl():
    global GAME_STARTED
    if (GAME_STARTED == False):
        def game_exit_callback():
            GAME_STARTED = False
            print( 'Game finished! Asking clients to stop.' )
            socketio.server.emit( 'stop' )
            print( 'Done!' )
        popenAndCall( lambda: game_exit_callback(), GAME[ 'executable' ] )
        GAME_STARTED = True  
    return render_template( 'ctrl.html', game='abe' )
 
 
# Route for serving the start button
@app.route( '/start' )
def start():
    Cthread = Thread(target=background_thread)
    Cthread.daemon = True
    Cthread.start()
    return render_template( 'index.html' )

@app.route( '/timed-out' )
def serve_timed_out():
    return render_template( 'timed_out.html' )


# Routes for serving static files
@app.route( '/images/<path:path>' )
def serve_images( path ):
    return send_from_directory( 'images', path )
 
@app.route( '/js/<path:path>' )
def serve_js( path ):
    return send_from_directory( 'js', path )
 
 
if _name_ == '_main_':
    print( 'Starting server ...' )
    GPIO.add_event_detect(PIR_PIN, GPIO.RISING, callback=motiondetect)
    socketio.run( app, host='0.0.0.0', port=5000 )