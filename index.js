'use strict';

const path = require('path'),
  fs = require('fs'),
  BbPromise = require('bluebird'),
  CFGraph = require('cloudformation-graph');

class ServerlessGraph {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    // set the providers name here
    this.provider = this.serverless.getProvider('providerName');

    this.commands = {
      graph: {
        usage: "Creates graphviz compatible graph output of nodes and edges. Saves to graph.out file.",
        lifecycleEvents: [
          'graph',
        ],
        options: {
          vertical: {
            usage: 'Graph nodes from top down instead of left to right.'
          },
          edgelabels: {
            usage: 'Display edgelabels in graph.',
            shortcut: 'e'
          },
          clarity: {
            usage: 'By default we show everything, clarity mode will attempt to remove implied nodes and edges for a better graph',
            shortcut: 'c'
          },
          outFile: {
            usage: 'Output file, defaults to graph.out',
            shortcut: 'o'
          }
        }
      }
    };

    this.hooks = {
      'before:graph:graph': () => BbPromise.bind(this)
        .then(() => {
          if (!this.options.package && !this.serverless.service.package.path) {
            return this.serverless.pluginManager.spawn('package');
          }
          return BbPromise.resolve();
        }),

      'graph:graph': () => BbPromise.bind(this)
        .then(this.graph),
    };
  }

  graph() {
    const currentDir = process.cwd();
    var serverless = this.serverless;

    var options = this.options;
    options.outFile = options.outFile || 'graph.out'
    let fileName = `${currentDir}/.serverless/cloudformation-template-update-stack.json`;

    let cfGraphOptions = this.options;
    let cfGraph = new CFGraph(cfGraphOptions);
    try {
      serverless.cli.log("Rendering graph...");
      let graph = cfGraph.graph(fileName);
      fs.writeFileSync(this.options.outFile, graph)
      serverless.cli.log(`Graph saved to ${this.options.outFile}`);
    } catch (e) {
      throw new serverless.classes.Error(e.message)
    }
    return
  }
}

module.exports = ServerlessGraph;
