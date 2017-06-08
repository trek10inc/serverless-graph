'use strict';

const path    = require('path'),
    fs        = require('fs'),
    BbPromise = require('bluebird'),
    lib       = require('./lib'),
    _         = require('lodash');

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
          horizontal: {
            usage: 'Graph nodes from left to right instead of top down.'
          },
          edgelabels: {
            usage: 'Display edgelabels in graph.',
            shortcut: 'e',
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
    const serverless = this.serverless;

    var options = this.options;

    fs.readFile(`${currentDir}/.serverless/cloudformation-template-update-stack.json`, 'utf8', function(err, data) {
      if (err) {
        const errorMessage = [
          `The file "cloudformation-template-update-stack.json" could not be opened.`,
          `${err}`,
        ].join('\n');

        throw new serverless.classes.Error(errorMessage);
      }

      const template = JSON.parse(data);
      var obj = lib.extractGraph(template.Description, template.Resources, serverless)
      var graph = obj.graph;
      graph.edges = graph.edges.concat(obj.edges);
      lib.handleTerminals(template, graph, 'Parameters', 'source')

      serverless.cli.log("Rendering graph...");
      lib.renderGraph(graph, options)
      serverless.cli.log("Graph saved to graph.out.");
    });
  }
}

module.exports = ServerlessGraph;
