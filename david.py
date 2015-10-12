import os
import sys
import time
import webbrowser
from Tkinter import Tk

ENDIC_URL = 'http://m.endic.naver.com/search.nhn?query={}&searchOption='
DIC_URL = 'http://dictionary.reference.com/browse/{}?s=t'

def openDic(keyword):
    for url in (ENDIC_URL, DIC_URL):
        webbrowser.open(url.format(keyword))

def getClipboard(tk):
    result = r.selection_get(selection="CLIPBOARD")
    return result.split('\n')[0].strip(".")

if __name__ == '__main__':
    if len(sys.argv) == 2:
        keyword = sys.argv[1]
        openDic(keyword)
        os.exit(0)

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
