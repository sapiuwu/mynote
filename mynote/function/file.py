from tkinter import *
from tkinter.messagebox import askokcancel
from tkinter.filedialog import asksaveasfilename
from tkinter import messagebox
from tkinter import filedialog


def quitf(self):
    alert = askokcancel('Exit', 'Do you really want to quit ?')
    if alert:
        Frame.quit(self)


def savef(self):

    if self.path:
        alltext = self.getText()
        open(self.path, 'w+').write(alltext)
        messagebox.showinfo('Success', 'Your file hane been saved')

    else:
        filetype = [('Text File', '*.txt'), ('Python File', '*.py'),
                    ('Word File', '*.doc'), ('All File', '.*')]
        filename = asksaveasfilename(filetypes=(
            filetype), initialfile=self.ftitle.get())

        if filename:
            alltext = self.getText()
            open(filename, 'w+').write(alltext)
            self.path = filename


def openf(self):
    ext = [('All File', '.*'), ('Text File', '*.txt'),
           ('Word Document', '*.doc'), ('Python File', '*.py')]
    opn = filedialog.askopenfilename(filetypes=ext)
    if opn != '':
        text = self.readFile(opn)

        if text:
            self.path = opn
            name = os.path.basename(opn)
            self.ftitle.delete(0, END)
            self.ftitle.insert(END, name)
            self.paper.delete('0.1', END)
            self.paper.insert(END, text)
