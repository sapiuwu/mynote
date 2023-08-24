from tkinter import *
from tkinter import ttk
from function.file import *
from function.edit import *


class mynote(Frame):
    def __init__(self, parent=None, file=None):
        Frame.__init__(self, parent)
        self.pack(fill=BOTH, expand=YES)
        self.notebook = ttk.Notebook(self)
        self.notebook.pack(fill=BOTH, expand=YES)

        self.createFile()
        parent.title("MyNote")
        self.createMenu()
        self.index = 1.0
        self.path = ''

    def createMenu(self):
        menubar = Menu(app)
        app.config(menu=menubar)

        file_menu = Menu(menubar, tearoff=0)
        menubar.add_cascade(label="File", menu=file_menu)
        file_menu.add_command(label="New", command=self.createFile)
        file_menu.add_command(label="Open", command=lambda: openf(self))
        file_menu.add_command(label="Save", command=lambda: savef(self))
        file_menu.add_separator()

        edit_menu = Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Edit", menu=edit_menu)
        edit_menu.add_command(label="Cut", command=lambda: cut(self))
        edit_menu.add_command(label="Copy", command=lambda: copy(self))
        edit_menu.add_command(label="Paste", command=lambda: paste(self))

        menubar.add_command(label="Exit", command=lambda: quitf(self))

    def createFile(self):
        new_editor = Text(self.notebook, relief=SUNKEN)
        scroll = Scrollbar(new_editor)
        new_editor.config(yscrollcommand=scroll.set)
        scroll.config(command=new_editor.yview)
        scroll.pack(side=RIGHT, fill=Y)
        new_editor.pack(side=LEFT, fill=BOTH, expand=YES)

        close_button = Button(
            new_editor, text="Close Tab", cursor="hand2", command=lambda tab=new_editor: self.close_tab(tab))
        close_button.place(relx=1.0, anchor='ne')

        self.notebook.add(new_editor, text="Untitled")

    def close_tab(self, tab):
        tab_id = self.notebook.index(tab)
        if tab_id >= 0:
            self.notebook.forget(tab_id)

    def textarea(self):
        scroll = Scrollbar(self)
        paper = Text(self, relief=SUNKEN)
        scroll.config(command=paper.yview)
        paper.config(yscrollcommand=scroll.set)
        scroll.pack(side=RIGHT, fill=Y)
        paper.pack(side=LEFT, fill=BOTH, expand=YES)
        self.paper = paper
        self.pack(expand=YES, fill=BOTH)

    def setText(self, text='', file=None):
        if file:
            text = open(file, 'r+').read()
            self.paper.delete('1.0', END)
            self.paper.insert('1.0', text)
            self.paper.mark_set(INSERT, '1.0')
            self.paper.focus()

    def getText(self):
        return self.paper.get('1.0', END+'-1c')

    def readFile(self, filename):
        try:
            fn = open(filename, 'r+')
            text = fn.read()
            return text
        except:
            messagebox.showerror("Oops! Something Wrong!")
            return None


app = Tk()
mynote(app)
app.mainloop()
