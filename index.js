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
        usage: "Creates a graph representation of the output for use with tools like graphviz.",
        lifecycleEvents: [
          'graph',
        ]
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

      var pseudoSubgraph = lib.handlePseudoParams(graph['edges'], serverless)
      graph['subgraphs'].push(pseudoSubgraph)

      // serverless.cli.consoleLog(graph);
      lib.renderGraph(graph)
    });
  }
}

module.exports = ServerlessGraph;
