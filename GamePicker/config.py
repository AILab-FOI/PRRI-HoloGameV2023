#!/usr/bin/env python3



abe = {
    "title": "Abe's Amazing Adventure",
    "players": 1,
    "executable": ["/usr/games/abe"],
    'toggles': ['UP', 'DOWN', 'LEFT', 'RIGHT'],
    'taps': ['SELECT', 'START', 'A', 'B'],
    "description": """A scrolling, platform-jumping, key-collecting, ancient pyramid exploring game, vaguely in the style of similar games for the Commodore+4. The game is intended to show young people (I'm writing it for my son's birthday) all the cool games they missed.""",
    "website": "abe.sourceforge.net",
    "developer": "Gabor Torok",
    "controls": [
        {
            'UP': 'up',
            'DOWN': 'down',
            'LEFT': 'left',
            'RIGHT': 'right',
            'SELECT': 'esc',
            'START': 'enter',
            'A': 'space',
            'B': 'enter'
        }
    ]
}

bunner = {
    "title": "Bunner",
    "players": 1,
    "executable": [ "pgzrun", "/usr/share/code-the-classics/bunner/bunner.py" ],
    "toggles": ["UP", "DOWN", "LEFT", "RIGHT"],
    "taps": ["SELECT", "START", "A", "B"],
    "controls": [
        {
            "UP": "up",
            "DOWN": "down",
            "LEFT": "left",
            "RIGHT": "right",
            "SELECT": "esc",
            "START": "enter",
            "A": "space",
            "B": "enter"
        }
    ]
}

mainPage = {
    "players": 1,
    'toggles': ['UP', 'DOWN', 'LEFT', 'RIGHT'],
    'taps': ['SELECT', 'START', 'A', 'B'],
    "controls": [
        {
            'UP': 'up',
            'DOWN': 'down',
            'LEFT': 'left',
            'RIGHT': 'right',
            'START': 'enter',
            'B': 'enter'
        }
    ]
}

GAMES = { "abe":abe , "bunner":bunner, "mainPage":mainPage}
