import os
import sys
import time
import webbrowser
import logging
import win32gui
import win32api
from Tkinter import Tk

ENDIC_URL = 'http://m.endic.naver.com/search.nhn?query={}&searchOption='
DIC_URL = 'http://dictionary.reference.com/browse/{}?s=t'

def openDic(rawKeyword):
    keyword = rawKeyword.split('\n')[0].strip(",.\r\n")
    logging.info('keyword [{}]'.format(keyword))
    for url in (DIC_URL, ENDIC_URL):
        webbrowser.open(url.format(keyword))

def adjustWinPos():
    adjustWinPos.chromeWin = None

    def callback(hwnd, name):
        if not win32gui.IsWindowVisible(hwnd):
            return
        className = win32gui.GetClassName(hwnd)
        if className == name:
            logging.info('found {} hwnd {}'.format(name, hwnd))
            adjustWinPos.chromeWin = hwnd

    win32gui.EnumWindows(callback, 'Chrome_WidgetWin_1')

    if adjustWinPos.chromeWin:
        hw = win32api.GetSystemMetrics(0) / 2
        height = win32api.GetSystemMetrics(1)
        cursorX, _ = win32api.GetCursorPos()
        xPos = (cursorX < hw) and 0 or hw
        logging.info('cursorX {} hw {} pos {}'.format(cursorX, hw, xPos))
        win32gui.MoveWindow(adjustWinPos.chromeWin,
                            xPos, 0, hw, height, True)

def getClipboard(tk):
    result = r.selection_get(selection="CLIPBOARD")
    return result

def main():
    if (len(sys.argv) > 1):
        keyword = ' '.join(sys.argv[1:])
        openDic(keyword)
        adjustWinPos()
        sys.exit(0)

    r = Tk()
    r.withdraw()

    text = getClipboard(r)

    while True:
        newText = getClipboard(r)
        if newText != text:
            openDic(newText)
            adjustWinPos()
            text = newText
        time.sleep(1)

    r.destroy()

if __name__ == '__main__':
    dir = os.path.dirname(os.path.realpath(__file__))
    logPath = dir + '/david.log'

    logging.basicConfig(filename=logPath, level=logging.INFO)
    logging.info('started with arg {}'.format(sys.argv))

    try:
        main()
    except Exception as e:
        logging.warn('{}', e)
