import os
import sys
import time
import webbrowser
import logging
import win32gui
import win32api
import win32process
import wmi
from Tkinter import Tk
import traceback

ENDIC_URL = 'http://m.endic.naver.com/search.nhn?query={}&searchOption='
DIC_URL = 'http://dictionary.reference.com/browse/{}?s=t'

BROWSER_PROC_NAME = u'chrome.exe'
BROWSER_WINDOW_NAME= 'Chrome_WidgetWin_1'

def openDic(rawKeyword):
    keyword = rawKeyword.split('\n')[0].strip(",.\r\n")
    logging.info('keyword [{}]'.format(keyword))
    for url in (DIC_URL, ENDIC_URL):
        webbrowser.open(url.format(keyword))

def adjustWinPos():
    _, forePid = win32process.GetWindowThreadProcessId(
        win32gui.GetForegroundWindow())

    querystr = ('SELECT Name FROM Win32_Process '
                'WHERE ProcessId = {0}').format(forePid)

    procNames = [p.Name for p in wmi.WMI().query(querystr)]
    if not procNames:
        logging.warn('no foreground window.')
        return

    if procNames[0] == BROWSER_PROC_NAME:
        logging.info('browser is foreground window, skipping'
                     ' adjust position')
        return

    adjustWinPos.chromeWin = None

    def callback(hwnd, name):
        if not win32gui.IsWindowVisible(hwnd):
            return
        className = win32gui.GetClassName(hwnd)
        if className == name:
            logging.info('found {} '.format(name))
            adjustWinPos.chromeWin = hwnd

    win32gui.EnumWindows(callback, BROWSER_WINDOW_NAME)

    if adjustWinPos.chromeWin:
        screenInfo = win32api.GetMonitorInfo(1)
        height = screenInfo['Work'][3]
        halfWidth = win32api.GetSystemMetrics(0) / 2
        cursorX, _ = win32api.GetCursorPos()
        leftSide = (cursorX > halfWidth)
        xPos = 0 if leftSide else halfWidth
        win32gui.MoveWindow(adjustWinPos.chromeWin,
                            xPos, 0, halfWidth, height, True)
        logging.info(
            'moving window {} side'.format(
                'left' if leftSide else 'right'))

def getClipboard(r):
    result = r.selection_get(selection="CLIPBOARD")
    return result

def main():
    if (len(sys.argv) > 1):
        keyword = ' '.join(sys.argv[1:])
        openDic(keyword)
        adjustWinPos()
        return

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

    logging.basicConfig(filename=logPath, level=logging.INFO
                        , format='%(asctime)s %(message)s'
                        , datefmt='[%m/%d/%Y %I:%M:%S]')
    logging.info('started with arg {}'.format(sys.argv))

    try:
        main()
        logging.info('exit')
        logging.info('')
    except:
        tb = traceback.format_exc()
        logging.error(str(tb))
