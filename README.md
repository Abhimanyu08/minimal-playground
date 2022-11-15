## A minimal interactive coding environment - https://minimal-playground.vercel.app/

Just select what language you want to program in (`python` or `node`) and you will be provided with a minimal setup having a code editor with support for multiple files,
a terminal, filesystem and a console. 
Behind the scenes, you are provided access to a containerized application running on a remote server. You can interact with it, make changes to filesystem,
get information about it etc. using the terminal.

Once you select `Python` or `Node`, please wait for filesystem to load and display in the leftmost panel. Once it's ready, click on any filename to start editing it in the
code editor. You can save/run the file by clicking on the green button in the top panel of the code editor. You can create new files, folders using `touch` and `mkdir`
commands in the terminal. 

Your files and code (which you have saved by clicking on `Save`) will be intact even if you refresh or close the browser at some point. Let's say you've written some
code in `Node` environment, if you close your tab or browser, come back to the website, and select `Node`, your files and code will be loaded from your previous container.
If you want an enitrely new setup, you can delete `playground-container` key from your localStorage and refresh the page. (Didn't make it easier cause someone can spam
open containers on my server).

