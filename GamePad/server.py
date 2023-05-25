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

ADDR_OUT = '0.0.0.0'
PORT = 5002

app = Flask(__name__)
app.config[ 'SECRET_KEY' ] = 'VelikaTajna321!'
socketio = SocketIO( app, cors_allowed_origins="*", async_mode='eventlet')
import eventlet
eventlet.monkey_patch()

cameraSignal = False

PLAYERS = 0
GAME_STARTED = False
GAME_NAME = "mainPage"

GAME = GAMES[ GAME_NAME ]
REPORT_BACK_TIMER = 3

timer_running = False  # Flag variable to track the timer status
timer_thread = None  # Variable to hold the timer thread

# A set to keep track of connected clients
connected_clients = []
# active_players = set()
player_waiting_queue = []
reported_back_gamepads = []
# start_time = 0


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

def background_thread_check_sensor():
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

def addPlayer(gamepad_hash):
    global PLAYERS, GAME_NAME, GAME_STARTED, connected_clients

    if gamepad_hash in connected_clients: return;    

    connected_clients.append( gamepad_hash )
    connected_clients.sort()
    added_player_index = connected_clients.index(gamepad_hash)
    PLAYERS = len(connected_clients)

    print("PLAYER", gamepad_hash, " IS ", added_player_index)

    if added_player_index + 1 > GAMES [ GAME_NAME ] [ "players" ]:
        print("Too many players, adding player to waiting queue")
        player_waiting_queue.append(gamepad_hash)
      #   sid.emit("redirect", "/waiting_queue")
        render_template( 'timed_out.html',game = 'mainPage' )
   #  else:
   #      PLAYERS += 1
   #      active_players.add(gamepad_hash)


def removeFromCollections(sid):
    global PLAYERS
    if sid in active_players:
        active_players.remove(sid)
        active_players.add(player_waiting_queue.pop(0))
    else:
        PLAYERS -= 1
        player_waiting_queue.remove(sid)
    connected_clients.remove(sid)


def compare_lists(connected_client_hashes, reported_back_hashes):
    unique_elements = []

    # Check elements in list1 that are not in list2
    for element in connected_client_hashes:
        if element not in reported_back_hashes:
            unique_elements.append(element)
    return unique_elements

def timer_callback():
    print("Timer ended!")
    global timer_running, connected_clients, reported_back_gamepads
    clients_to_remove = compare_lists(connected_clients, reported_back_gamepads)
    for client_hash in clients_to_remove:
        print("Removing client: ", client_hash)
        connected_clients.remove(client_hash)
    timer_running = False

def start_timer(duration, callback):
    print("TIMER STARTING")
    global timer_running, timer_thread, reported_back_gamepads, connected_clients
    time.sleep(duration)
    callback()


@socketio.on( 'connect' )
def connect():
    print( 'Client connected:', request.sid )
    global PLAYERS, timer_thread, timer_running
    PLAYERS = 0

    reported_back_gamepads.clear()

    
    if timer_running:
        print("TIMER ALREADY EXISTS, WAITING...")
        timer_thread.join()

    timer_thread = threading.Thread(target=start_timer, args=(REPORT_BACK_TIMER, timer_callback))
    timer_thread.start()
    timer_running = True
    socketio.emit('reportBack')


@socketio.on('present')
def addPlayer1(gamepad_hash):
    global PLAYERS, reported_back_gamepads
    addPlayer(gamepad_hash)
    reported_back_gamepads.append(gamepad_hash)
    print("PLAYER ADDED:"     , PLAYERS, gamepad_hash)

@socketio.on( 'disconnect' )
def disconnect():
    print( 'Client disconnected:', request.sid )
    socketio.emit('reportBack')

# @socketio.on( 'client-timeout' )
# def timeout(gamepad_hash):
#     print( 'Client timed out:', gamepad_hash )
#     removeFromCollections(gamepad_hash)


@socketio.on("game-started")
def handle_game_clicked(game_name):
   global GAME_NAME
   print(f"Game clicked: {game_name}")
   GAME_NAME = game_name
   GAME = GAMES[ game_name ] # setting current game
   print("SET GAME TO", GAME_NAME)

   global GAME_STARTED
   def game_exit_callback():
        GAME_STARTED = False
        print( 'Game finished! Asking clients to stop.' )
        socketio.server.emit( 'stop', broadcast=True ) # TODO: Not working for some reason!
        print( 'Done!' )
   popenAndCall( lambda: game_exit_callback(), *GAME[ 'executable' ] )
   GAME_STARTED = True
   return

# @socketio.on("game-started")
# def handle_game_clicked(game_name):
#    global GAME_NAME
#    print(f"Game clicked: {game_name}")
#    GAME_NAME = game_name
#    GAME = GAMES[ game_name ] # setting current game
#    print("SET GAME TO", GAME_NAME)

#    global GAME_STARTED
#    def game_exit_callback():
#         GAME_STARTED = False
#         print( 'Game finished! Asking clients to stop.' )
#         socketio.server.emit( 'stop', broadcast=True ) # TODO: Not working for some reason!
#         print( 'Done!' )
#    popenAndCall( lambda: game_exit_callback(), *GAME[ 'executable' ] )
#    GAME_STARTED = True
#    return

@socketio.on( 'ctrl' )
def handle_message( message ):
    print( 'ctrl', message )
    global PLAYERS, GAME_STARTED, GAMES
   #  if not GAME_STARTED:
   #      print( 'Game aborted or not started! Player', PLAYERS )
   #      emit( 'error', { "message": "Game hasn't started or stopped running!" }, broadcast=True )
   #      return
    try:
        msg = json.loads( message[ 'data' ] )
    except Exception as e:
        print( "Error while loading message:", message )
        emit( 'error', { "message": "Your browser sent an unparsable message." }, broadcast=True )
        return
    
    print("msg", msg)
    cmd = msg[ "cmd" ]
    context = msg[ "context" ]
    game = GAME_NAME
    print("CURRENT GAME", game)

    if PLAYERS > GAMES[ game ][ "players" ]:
        print( "Too many players! Player", PLAYERS )
        emit( 'error', { "message": "Too many players already connected for this game." }, broadcast=True )
        return
    # TODO: add controls for other players
   #  try:
    toggles = GAMES[ game ][ "controls" ][ PLAYERS - 1 ]
   #  except Exception as e:
   #      print( "Error, unknown game! Player", PLAYERS )
   #      emit( 'error', {"message": "Error! Unknown game!" }, broadcast=True )
   #      return

    if cmd in GAMES[ game ][ 'taps' ]:
        if context == "start":
            pyautogui.press( toggles[ cmd ] ) # discard stop, only one tap is needed
    if cmd in GAMES[ game ][ 'toggles' ]:
        if context == "start":
            pyautogui.keyDown( toggles[ cmd ] )
        else:
            pyautogui.keyUp( toggles[ cmd ] )
    print( 'Player', PLAYERS, 'Got', cmd, context )

# Route for games
@app.route( '/' )
def run_game():
    global GAME_STARTED, GAME
    value = request.args.get('param'); # catching game name from url
    GAME = GAMES[ value ] # find game in dictionary
    def game_exit_callback():
        GAME_STARTED = False
        print( 'Game finished! Asking clients to stop.' )
        socketio.server.emit( 'stop', broadcast=True ) # TODO: Not working for some reason!
        print( 'Done!' )
    popenAndCall( lambda: game_exit_callback(), *GAME[ 'executable' ] )
    GAME_STARTED = True
    return render_template( 'ctrl.html', game= value)

# Route for serving the start button
@app.route( '/start' )
def start():
    Cthread = Thread(target=background_thread_check_sensor)
    Cthread.daemon = True
    Cthread.start()
    return render_template( 'index.html',game = 'mainPage' )

@app.route( '/gamepad' )
def show_gamepad():
    return render_template( 'ctrl.html',game = 'mainPage' )


# @app.route( '/picker' )
# def picker():
#     return render_template( '../GamePicker/index.html',game = 'mainPage' )

# Route for disconnecting timed out players
@app.route( '/timed-out' )
def serve_timed_out():
    return render_template( 'timed_out.html' )

@app.route('/waiting_queue')
def serve_waiting_queue():
    return render_template('waiting_queue')

# Routes for serving static files
@app.route( '/gamepad-files/<path:path>' )
def serve_gamepad( path ):
    return send_from_directory( 'gamepad-files', path )


@app.route( '/gamepicker-files/<path:path>' )
def serve_gamepicker( path ):
    return send_from_directory( 'gamepicker-files', path )

# @app.route( '/gamepad-files/js/<path:path>' )
# def serve_js( path ):
#     return send_from_directory( 'js', path )


if __name__ == '__main__':
    print( 'Starting server ...' )
    GPIO.add_event_detect(PIR_PIN, GPIO.RISING, callback=motiondetect)
    socketio.run( app, host='0.0.0.0', port=5002 )
