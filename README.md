Serverless Plugin Boilerplate
=============================

This project was adapted from [CFVIZ](https://github.com/benbc/cloud-formation-viz/blob/master/cfviz). Serverless Graph outputs your serverless architecture and resources as a [Graphviz](http://www.graphviz.org/) dot compatible output. Currently only supports the AWS provider.

**Note:** Serverless *v1.x.x* or higher is required.

### Get Started
* `npm install --save serverless-graph`
* Install graphviz
  * Homebrew - brew install graphviz
* Add serverless-graph to the plugins section of your serverless.yml

### Run
If you have any commandline params that don't have defaults you will have to pass in any opt variables as this plugin hooks into the package step and then reads the output
* `sls graph {--opts}`
* Output SVG
  * `cat graph.out | dot -Tsvg -oexample.svg`
* Output PNG
  * `cat graph.out | dot -Tpng -oexample.png`
* See [Graphviz](http://www.graphviz.org/pdf/dot.1.pdf) for more information.
