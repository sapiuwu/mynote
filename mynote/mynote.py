from tkinter import *
from function.file import *
from function.edit import *


class mynote(Frame):
    def __init__(self, parent=None, file=None):
        Frame. __init__(self, parent)
        self.frame = Frame(parent)
        self.frame.pack(fill=X)
        self.layout = Frame(app)
        self.createFile()
        parent.title("MyNote")
        self.createMenu()
        self.textarea()
        self.index = 1.0
        self.path = ''

    def createMenu(self):
        menubar = Menu(app)
        app.config(menu=menubar)

        file_menu = Menu(menubar, tearoff=0)
        menubar.add_cascade(label="File", menu=file_menu)
        file_menu.add_command(label="New", command=self.create_new)
        file_menu.add_command(label="Open", command=lambda: openf(self))
        file_menu.add_command(label="Save", command=lambda: savef(self))
        file_menu.add_separator()

        edit_menu = Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Edit", menu=edit_menu)
        edit_menu.add_command(label="Cut", command=lambda: cut(self))
        edit_menu.add_command(label="Copy", command=lambda: copy(self))
        edit_menu.add_command(label="Paste", command=lambda: paste(self))

        menubar.add_command(label="Exit", command=lambda: quitf(self))

    def create_new(self):
        mynote(Frame)

    def createFile(self):
        self.layout.pack(fill=BOTH, expand=1, padx=17, pady=5)
        title = Label(self.layout, text='File name: ')
        title.pack(side=LEFT)
        self.ftitle = Entry(self.layout)
        self.ftitle.pack(side=LEFT, expand=YES, fill=X)

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
