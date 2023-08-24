def cut(self):
    self.paper.event_generate("<<Cut>>")


def copy(self):
    self.paper.event_generate("<<Copy>>")


def paste(self):
    self.paper.event_generate("<<Paste>>")
