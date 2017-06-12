# Serverless Graph

This project was adapted from [CFVIZ](https://github.com/benbc/cloud-formation-viz/blob/master/cfviz). Serverless Graph outputs your serverless architecture and resources as a [Graphviz](http://www.graphviz.org/) dot compatible output. Currently only supports the AWS provider.

**Note:** Serverless *v1.x.x* or higher is required.

### Example Output

![Example Generated Graph](https://user-images.githubusercontent.com/1689118/27042562-5a36cd72-4f65-11e7-813f-c3bfa6326ca2.png)

### Why?

Sometimes this is the fastest way to just visualize everything going on, it can also be extremely helpful in debugging circular dependency issues in CloudFormation templates.

### Get Started
* `npm install --save serverless-graph`
* Install graphviz
  * Homebrew - brew install graphviz
* Add serverless-graph to the plugins section of your serverless.yml

### Run
If you have any commandline params that don't have defaults you will have to pass in any opt variables as this plugin hooks into the package step and then reads the output.
* `sls graph {--opts}`
* Output SVG
  * `cat graph.out | dot -Tsvg -oexample.svg`
* Output PNG
  * `cat graph.out | dot -Tpng -oexample.png`
* See [Graphviz](http://www.graphviz.org/pdf/dot.1.pdf) for more information.

### Options (--help)

```
Plugin: ServerlessGraph
graph ......................... Creates graphviz compatible graph output of nodes and edges. Saves to graph.out file.
    --horizontal ....................... Graph nodes from left to right instead of top down.
    --edgelabels / -e .................. Display edgelabels in graph.
```
