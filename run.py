# run.py
from app import app, socketio
import threading, time, webbrowser

def open_browser():
    time.sleep(1)
    webbrowser.open('http://127.0.0.1:5000')

if __name__ == '__main__':
    threading.Thread(target=open_browser, daemon=True).start()
    socketio.run(app, host='127.0.0.1', port=5000, debug=True, use_reloader=False)
