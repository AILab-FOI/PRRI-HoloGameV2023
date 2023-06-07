Import RPi.GPIO as GPIO
PIR_PIN = 21

GPIO.setup(PIR_PIN, GPIO.IN)

def motiondetect():

//funkcija za slanje signala kameri

GPIO.add_event_detect(PIR_PIN, GPIO.RISING, callback=motiondetect) 