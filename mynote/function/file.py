from tkinter import *
from tkinter.messagebox import askokcancel
from tkinter.filedialog import asksaveasfilename
from tkinter import messagebox
from tkinter import filedialog
import os


def quitf(self):
    alert = askokcancel('Exit', 'Do you really want to quit ?')
    if alert:
        Frame.quit(self)


def openf(self):
    ext = [('All File', '.*'), ('Text File', '*.txt'),
           ('Word Document', '*.doc'), ('Python File', '*.py')]
    opn = filedialog.askopenfilename(filetypes=ext)
    if opn:
        text = self.readFile(opn)

        if text:
            self.path = opn
            name = os.path.basename(opn)

            current_editor = self.notebook.select()  # Get the currently selected tab
            text_widget = self.notebook.nametowidget(current_editor)
            text_widget.delete('1.0', END)
            text_widget.insert('1.0', text)

            self.notebook.tab(current_editor, text=name)  # Update the tab text


def savef(self):
    current_editor = self.notebook.select()  # Get the currently selected tab
    text_widget = self.notebook.nametowidget(current_editor)

    if hasattr(text_widget, 'file_path') and text_widget.file_path:
        alltext = text_widget.get('1.0', END+'-1c')
        with open(text_widget.file_path, 'w+') as file:
            file.write(alltext)
        messagebox.showinfo('Success', 'Your file has been saved')

        file_name = os.path.basename(text_widget.file_path)
        self.notebook.tab(current_editor, text=file_name)
    else:
        filetype = [('Text File', '*.txt'), ('Python File', '*.py'),
                    ('Word File', '*.doc'), ('All Files', '*.*')]
        filename = asksaveasfilename(
            filetypes=filetype, initialfile="Untitled.txt")
        if filename:
            alltext = text_widget.get('1.0', END+'-1c')
            with open(filename, 'w+') as file:
                file.write(alltext)
            self.path = filename

            file_name = os.path.basename(filename)
            self.notebook.tab(current_editor, text=file_name)
            text_widget.file_path = filename
