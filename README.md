# PEK's developer blog

This is the source code for PEK's developer blog you find in on
https://devblog.pekspro.com/. If you have any question, create an issue in in
repository. 

The code is in the blog branch. It is build Jekyll and GitHub actions, and the
result pushed into the master branch. GitHub Pages is then using these files
during hosting.

Feel free to clone it if you want to use it as base for you own blog. Read more
in [Jekyll
docs](https://jekyllrb.com/docs/continuous-integration/github-actions/).

## Dev container

You can run this in a dev container. To do this:

* Clone this repository, preferably in Linux. It works in Windows too, but it will be a low slower on build.
* Open the cloned folder in VS Code.
* Select to open the folder as a dev container.
* Launching the dev container first time will take a minute or next.
* Once the container is open, you can run `make serve` in a terminal to run the blog.
