# %%
import pyautogui
from random import randint

# %%
pyautogui.screenshot("cookies.png")

# %%
import pyautogui

cookie = pyautogui.locateOnScreen("LC20230427_english.png")
cookie_centre = pyautogui.center(cookie)
pyautogui.click(cookie_centre.x, cookie_centre.y)

# %%
import pyautogui

x, y = pyautogui.locateCenterOnScreen("LC20230427_grandma.png")
try:
    pyautogui.click(x, y)
except Exception as e:
    raise e

# %%
for _ in range(100):
    pyautogui.click(randint(250, 400), randint(450, 600))

############################

# %%

import subprocess

# %%
res = subprocess.run(
    ['ls', '-l'],
    capture_output=True
)
print(res.stdout)

# %%
proc = subprocess.Popen([
    'bomber'
])
print(proc)
proc.wait()
print(proc)

# %%
import shlex
import subprocess

command = "psql -h localhost -U bogdan -p 50432"
command = shlex.split(command)
print(command)

proc = subprocess.Popen(command)
# %%
proc.communicate(
    input=b"bogdan",
    timeout=5
)
# %%
proc.kill()
# %%
