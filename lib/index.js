'use strict';

const _  = require('lodash'),
      fs = require('fs');

var lib = {

  extractGraph: function(name, elem, serverless) {
    var graph = {
      name: name,
      nodes: [],
      edges: [],
      subgraphs: []
    }
    var edges = []

    Object.keys(elem).forEach(function(key){
      graph.nodes.push({name: key});
      edges = edges.concat(_.flattenDeep(lib.findRefs(key, elem[key])))
    });

    return {graph: graph, edges: edges};
  },

  findRefs: function(key, elem) {
    if (Array.isArray(elem)) {
      return elem.map(function(e) {
        return lib.findRefs(key, e)
      });
    }
    else if (typeof(elem) === 'string') return [];
    else if (Number.isInteger(elem)) return [];
    else if (typeof(elem) === 'boolean') return [];
    else if (typeof(elem) === 'object') {
      var refs = [];
      Object.keys(elem).forEach(function(k) {
        if (k === 'Ref') {
          refs.push({'from': elem[k], 'to': key});
        } else if (k === 'Fn::GetAtt') {
          refs.push({'from': elem[k][0], 'to': key});
        } else {
          refs = refs.concat(lib.findRefs(key, elem[k]));
        }
      });
      return refs;
    }
    else throw new Error("Unexpected type");
  },

  handleTerminals: function(template, graph, name, rank) {
    if (name in template) {
      var obj = lib.extractGraph(name, template[name]);
      obj.graph['rank'] = rank;
      obj.graph['style'] = 'filled,rounded';
      graph['subgraphs'].push(obj.graph);
      graph['edges'] = graph['edges'].concat(obj.edges);
    }
  },

  handlePseudoParams: function(edges, serverless) {
    var graph = {'name': 'Psuedo Parameters', 'nodes': [], 'edges': [], 'subgraphs': []};
    graph['shape'] = 'ellipse';
    var params = new Set();

    edges.forEach(function(edge) {
      if (edge['from'] && edge['from'].startsWith('AWS::')) {
        params.add(edge['from'])
      }
    });

    params.forEach(function(param) {
      graph['nodes'] = graph['nodes'].concat({'name': param})
    });

    return graph
  },

  //   if 'style' in graph:
  //       print 'node [style="%s"]' % graph['style']
  //   if 'rank' in graph:
  //       print 'rank=%s' % graph['rank']
  //   for n in graph['nodes']:
  //       print '"%s"' % n['name']
  //   for s in graph['subgraphs']:
  //       render(s, True)
  //   for e in graph['edges']:
  //       print '"%s" -> "%s";' % (e['from'], e['to'])
  //   print '}'

  renderGraph: function(graph, subgraph=false, stream=undefined) {
    const filename = "graph.out";
    if (!stream || stream === undefined) {
      stream = fs.createWriteStream(filename);
      stream.once('open', function(fd) {
        lib.writeGraph(graph, subgraph, stream)
        stream.end();
      });
    } else {
      stream.write('\n')
      lib.writeGraph(graph, subgraph, stream)
    }
  },

  writeGraph: function(graph, subgraph, stream) {
    var graphtype = subgraph ? 'subgraph' : 'digraph'

    stream.write(`${graphtype} "${graph['name']}" {`);
    stream.write('\nlabeljust=l;');
    stream.write(`\nnode [shape=${graph['shape'] ? graph['shape'] : 'box'}];`);
    //   if 'style' in graph:
    //       print 'node [style="%s"]' % graph['style']
    //   if 'rank' in graph:
    //       print 'rank=%s' % graph['rank']
    graph.nodes.forEach(function(n) {
      stream.write(`\n"${n.name}"`);
    });
    graph.subgraphs.forEach(function(s) {
      lib.renderGraph(s, true, stream) //TODO: Rewrite this to use writeGraph
    });
    graph.edges.forEach(function(e) {
      stream.write(`\n"${e['from']}" -> "${e['to']}";`)
    });
    stream.write('\n}');
  }
}

module.exports = lib
