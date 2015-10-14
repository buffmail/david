import os
import sys
import time
import webbrowser
import logging
from Tkinter import Tk

ENDIC_URL = 'http://m.endic.naver.com/search.nhn?query={}&searchOption='
DIC_URL = 'http://dictionary.reference.com/browse/{}?s=t'

def openDic(rawKeyword):
    keyword = rawKeyword.split('\n')[0].strip(".\r\n")
    logging.info('keyword [{}]'.format(keyword))
    for url in (ENDIC_URL, DIC_URL):
        webbrowser.open(url.format(keyword))

def getClipboard(tk):
    result = r.selection_get(selection="CLIPBOARD")
    return result

if __name__ == '__main__':
    dir = os.path.dirname(os.path.realpath(__file__))
    logPath = dir + '/david.log'

    logging.basicConfig(filename=logPath, level=logging.INFO)
    logging.info('started with arg {}'.format(sys.argv))
    if (len(sys.argv) > 1):
        keyword = ' '.join(sys.argv[1:])
        openDic(keyword)
        sys.exit(0)

    r = Tk()
    r.withdraw()

    text = getClipboard(r)

    while True:
        newText = getClipboard(r)
        if newText != text:
            openDic(newText)
            text = newText
        time.sleep(1)

    r.destroy()
