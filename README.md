Serverless Plugin Boilerplate
=============================

This project was adapted from the following [CFVIZ](https://github.com/benbc/cloud-formation-viz/blob/master/cfviz)

**Note:** Serverless *v1.x.x* or higher is required.

###Get Started

* `npm install --save serverless-graph`
* Add serverless-graph to your plugins section of the project
* Install graphviz
  * Homebrew - brew install graphviz

### Run
If you have any commandline params that don't have defaults you will have to pass in any opt variables as this plugin hooks into the package step and then reads the output
* `sls graph {--opts} | dot -Tsvg -oexample.svg`
