const abe = {
    title: "Abe's Amazing Adventure",
    players: 1,
    executable: ["/usr/games/abe"],
    toggles: ['UP', 'DOWN', 'LEFT', 'RIGHT'],
    taps: ['SELECT', 'START', 'A', 'B'],
    description: "A scrolling, platform-jumping, key-collecting, ancient pyramid exploring game, vaguely in the style of similar games for the Commodore+4. The game is intended to show young people (I'm writing it for my son's birthday) all the cool games they missed.",
    website: "abe.sourceforge.net",
    developer: "Gabor Torok",
    controls: [
      {
        UP: 'up',
        DOWN: 'down',
        LEFT: 'left',
        RIGHT: 'right',
        SELECT: 'esc',
        START: 'enter',
        A: 'space',
        B: 'enter'
      }
    ]
  };
  
  const bunner = {
    title: "Bunner",
    players: 1,
    executable: ["pgzrun", "/Users/timjuic/Desktop/hologameV/GamePicker/GameFiles/bunner/bunner.py"],
    toggles: ["UP", "DOWN", "LEFT", "RIGHT"],
    taps: ["SELECT", "START", "A", "B"],
    controls: [
      {
        UP: "up",
        DOWN: "down",
        LEFT: "left",
        RIGHT: "right",
        SELECT: "esc",
        START: "enter",
        A: "space",
        B: "enter"
      }
    ]
  };
  
  const soccer = {
    title: "soccer",
    players: 4,
    executable: ["pgzrun", "/Users/timjuic/Desktop/hologameV/GamePicker/GameFiles/soccer/soccer.py"],
    toggles: ["UP", "DOWN", "LEFT", "RIGHT"],
    taps: ["SELECT", "START", "A", "B"],
    controls: [
      {
        UP: "up",
        DOWN: "down",
        LEFT: "left",
        RIGHT: "right",
        SELECT: "esc",
        START: "enter",
        A: "space",
        B: "enter"
      },
      {
        UP: "up",
        DOWN: "down",
        LEFT: "left",
        RIGHT: "right",
        SELECT: "esc",
        START: "enter",
        A: "space",
        B: "enter"
      },
      {
        UP: "up",
        DOWN: "down",
        LEFT: "left",
        RIGHT: "right",
        SELECT: "esc",
        START: "enter",
        A: "space",
        B: "enter"
      },
      {
        UP: "up",
        DOWN: "down",
        LEFT: "left",
        RIGHT: "right",
        SELECT: "esc",
        START: "enter",
        A: "space",
        B: "enter"
      }
    ]
  };
  
  const mainPage = {
    players: 4,
    toggles: ['UP', 'DOWN', 'LEFT', 'RIGHT'],
    taps: ['SELECT', 'START', 'A', 'B'],
    controls: [
      {
        UP: 'up',
        DOWN: 'down',
        LEFT: 'left',
        RIGHT: 'right',
        START: 'enter',
        B: 'enter'
      },
      {
        UP: 'up',
        DOWN: 'down',
        LEFT: 'left',
        RIGHT: 'right',
        START: 'enter',
        B: 'enter'
      }
    ]
  };
  
  module.exports = {
    abe: abe,
    bunner: bunner,
    mainPage: mainPage,
    soccer: soccer
  };
  