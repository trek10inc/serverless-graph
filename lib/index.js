'use strict';

const _  = require('lodash'),
      fs = require('fs');

const subRegex = new RegExp('\\${(.*?)}', 'g')
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

  findRefs: function(key, elem, properties=undefined, parentKey=undefined) {
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
          if (!elem[k].startsWith('AWS::')) {
            refs.push({'from': elem[k], 'to': key, 'label': parentKey});
          }
        } else if (k === 'Fn::GetAtt') {
          refs.push({'from': elem[k][0], 'to': key, 'label': parentKey});
        } else if (k === 'Fn::Sub' && typeof(elem[k]) === 'string') {
            let subs = []
            let match
            while (match = subRegex.exec(elem[k])) {
              subs.push(match)
            }
            subs.map(m => {
              if (!m[1].startsWith('AWS::')) {
                refs.push({'from': m[1].split('.')[0], 'to': key, 'label': parentKey})
              }
            })
        } else {
          if (k == 'Properties') {
            properties = elem[k];
          }
          if (properties && properties[k]) {
            parentKey = k;
          }
          refs = refs.concat(lib.findRefs(key, elem[k], properties, parentKey));
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

  deDupeEdges: function(graph) {
    var edges = graph.edges;
    for(var i = 0; i < edges.length; i++) {
      for(var j = i+1; j < edges.length; j++) {
        if(edges[i].to === edges[j].to && edges[i].from === edges[j].from) {
          var index = edges.indexOf(edges[j]);
          edges.splice(index, 1);
        }
      }
    }

    graph.edges = edges;
    return graph;
  },

  renderGraph: function(graph, options, subgraph=false) {
    const filename = "graph.out";
    var stream = fs.createWriteStream(filename);
    stream.once('open', function(fd) {
      lib.writeGraph(graph, subgraph, stream, options)
      stream.end();
    });
  },

  writeGraph: function(graph, subgraph, stream, options) {
    graph = lib.deDupeEdges(graph)
    var graphtype = subgraph ? 'subgraph' : 'digraph'

    stream.write(`${graphtype} "${graph['name']}" {`);
    if (options.horizontal) {
      stream.write(`\nrankdir=LR`);
    }
    stream.write('\nlabeljust=l;');
    stream.write(`\nnode [shape=${graph['shape'] ? graph['shape'] : 'box'}];`);
    if ('style' in graph) {
      stream.write(`\nnode [style="${graph.style}"]`)
    }
    if ('rank' in graph) {
      stream.write(`\nrank=${graph.rank}`)
    }
    graph.nodes.forEach(function(n) {
      stream.write(`\n"${n.name}"`);
    });
    graph.subgraphs.forEach(function(s) {
      stream.write('\n')
      lib.writeGraph(s, true, stream, options)
    });
    graph.edges.forEach(function(e) {
      var label = "";
      if (options.edgelabels && e.label !== undefined) {
        label = ` [label=${e.label}]`
      }
      stream.write(`\n"${e['from']}" -> "${e['to']}" [dir=back]${label};`)
    });
    stream.write('\n}');
  }
}

module.exports = lib
