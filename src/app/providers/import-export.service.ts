import { Injectable } from '@angular/core';
import help from '../algorithms/genericHelpers';
import GraphImmut from '../algorithms/GraphImmut/GraphImmut';
import { EdgeImmutPlain } from '../algorithms/GraphImmut/EdgeImmut';
import { NodeImmutPlain } from '../algorithms/GraphImmut/NodeImmut';
import { GraphPlain } from '../algorithms/graphPlain';
import { NzMessageService } from 'ng-zorro-antd';

@Injectable({
  providedIn: 'root'
})
export class ImportExportService {

  constructor(private message: NzMessageService) {
  }

  import = (string: string, format: string): GraphImmut => {
    if (format.toLowerCase() === 'json') {
      try {
        const n = JSON.parse(string);
        if ('nodes' in n && 'edges' in n) {
          return n;
        } else {
          this.message.create('error', 'Data Import Error <p> The provided input does not conform the the import specifications </p>');
        }
      } catch (err) {
        this.message.create('error', `JSON Parse Error <p> here was an error parsing your input as JSON</p><pre>${err}</pre>`);
      }
    } else if (format.toLowerCase() === 'dimacs' || format.toLowerCase() === 'col') {
      const lines = string.split(/\r?\n/);
      let graph: GraphImmut = null;
      let error = false;
      lines.forEach((l) => {
        const vals = l.split(/\s+/);
        if (vals[0].toLowerCase() === 'p') {
          if (vals[1].toLowerCase() !== 'edge') {
            this.message.create('error',
              'DIMACS Parse Error Sorry, <p> but I only know how to parse &quot;edge&quot; formatted DIMACS files</p>');
            error = true;
            return;
          }
          graph = new GraphImmut(parseInt(vals[2]));
        } else if (vals[0].toLowerCase() === 'e' && graph !== null) {
          graph = graph.addEdge(parseInt(vals[1]) - 1, parseInt(vals[2]) - 1);
        }
      });

      if (graph === null && !error) {
        this.message.create('error', 'DIMACS Parse Error <p>No program line found!</p>');
        error = true;
      }

      if (!error) {
        return graph;
        // d.nodes.forEach((v) => {
        //   v.label = v.id.toString();
        // });
      }
    } else {
      this.message.create('error', 'Unrecognized Input Format <p>The format of your input is incorrect!.</p>');
    }
  }

  exportToFile = (format: string, graph: GraphPlain): void => {
    if (format.toLowerCase() === 'json') {
      this.downloadFile('graph.json', this.getDataAsJSON(graph));
    } else if (format.toLowerCase() === 'dimacs') {
      this.downloadFile('graph.dimacs', this.getDataAsDIMACS(graph));
    }
  }

  getDataAsJSON = (graph: GraphPlain): string => {
    const nodeKeys = ['id', 'label', 'color', 'x', 'y'];
    const edgeKeys = ['from', 'to'];
    graph.nodes = help.keepOnlyKeys(graph.nodes, nodeKeys) as NodeImmutPlain[];
    graph.edges = help.keepOnlyKeys(graph.edges, edgeKeys) as EdgeImmutPlain[];

    return JSON.stringify(graph);
  }

  getDataAsDIMACS = (graph: GraphPlain): string => {
    // If I add direction, DIMACS cannot be used, it only works for undirected graphs
    const graphImmut = new GraphImmut(graph.nodes, graph.edges);
    let adj = graphImmut.getFullAdjacency();
    adj = adj.filter((v: number[]) => {
      return v.length !== 0;
    });
    let text;

    const nodes: number[] = [];
    adj.forEach((v: number[], i: number) => {
      if (nodes.indexOf(i + 1) === -1) {
        nodes.push(i + 1);
      }
      v.forEach((n: number) => {
        if (nodes.indexOf(n + 1) === -1) {
          nodes.push(n + 1);
        }
      });
    });

    let edgeCount = 0;
    let edgeText = '';
    graph.edges.forEach((v: EdgeImmutPlain) => {
      edgeText += `e ${v.from + 1} ${v.to + 1}\n`;
      edgeCount++;
    });
    edgeText = edgeText.trim();

    text += `p edge ${nodes.length} ${edgeCount}\n`;
    return text + edgeText;
  }

  downloadFile = (filename: string, text: string): void => {
    const blob = new Blob([text], { type: 'text/plain' });
    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveBlob(blob, filename);
    } else {
      const a = window.document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blob as any);
    }
  }

  getFileExtension = (filename: string): string => {
    return filename.split('.').splice(-1)[0].toLowerCase();
  }
}
