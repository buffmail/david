import os
import sys
import time
import webbrowser
from Tkinter import Tk

ENDIC_URL = 'http://m.endic.naver.com/search.nhn?query={}&searchOption='
DIC_URL = 'http://dictionary.reference.com/browse/{}?s=t'

if __name__ == '__main__':

    if len(sys.argv) == 2:
        keyword = sys.argv[1]
        for url in (ENDIC_URL, DIC_URL):
            webbrowser.open(url.format(keyword))
        os.exit(0)

    r = Tk()
    r.withdraw()

    text = ''

    while True:
        result = r.selection_get(selection="CLIPBOARD")
        newText = result.split('\n')[0]
        if newText != text:
            for url in (ENDIC_URL, DIC_URL):
                webbrowser.open(url.format(newText))
            text = newText
        time.sleep(1)
    r.destroy()
