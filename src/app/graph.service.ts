import { Injectable, Output, EventEmitter } from '@angular/core';
import { EdgeImmutPlain } from './algorithms/GraphImmut/EdgeImmut';
import GraphImmut from './algorithms/GraphImmut/GraphImmut';
import gHelp from './algorithms/graphHelpers';
import genericH from './algorithms/genericHelpers';
import { GraphPlain } from './algorithms/graphPlain';
import { VisNetworkData, VisNodes, VisEdges, VisNode, VisEdge } from 'ngx-vis';
import randomColor from 'randomcolor';
import { NodeImmutPlain } from './algorithms/GraphImmut/NodeImmut';
import { Subject, Observable } from 'rxjs';
import Fitness from './algorithms/fitness';
import HarmonySearch from './algorithms/HS/harmonySearch';
import { Result } from './models/results';
import { ImportExportService } from './providers/import-export.service';
import WelshPowell from './algorithms/welshPowell';
import Genetic from './algorithms/Genetic/Genetic';

@Injectable({
  providedIn: 'root'
})

export class GraphService {
  @Output() changeData: EventEmitter<VisNetworkData> = new EventEmitter();
  private result = new Subject<Result>();
  private _initialized = false;
  graph: GraphImmut;
  private _physics = true;
  private _stepByStepAlgorithm = true;
  private _timePerStep = 500;
  private _numOfTurnPerStep = 200;

  private _hms = 10;
  private _nvar: number;
  private _maxIteration = 10000;
  private _numberOfRun = 1;
  private _bw = .01;
  private _bw_min = .0001;
  private _hmcr = .9;
  private _par = .3;
  private _par_min = .01;
  private _par_max = .99;

  public get initialized() {
    return this._initialized;
  }
  public set initialized(value: boolean) {
    this._initialized = value;
  }

  public get physics() {
    return this._physics;
  }
  public set physics(value: boolean) {
    this._physics = value;
  }

  public get hms() {
    return this._hms;
  }
  public set hms(value) {
    this._hms = value;
  }
  public get nvar(): number {
    return this._nvar;
  }
  public set nvar(value: number) {
    this._nvar = value;
  }
  public get maxIteration() {
    return this._maxIteration;
  }
  public set maxIteration(value) {
    this._maxIteration = value;
  }
  public get numberOfRun() {
    return this._numberOfRun;
  }
  public set numberOfRun(value) {
    this._numberOfRun = value;
  }
  public get bw() {
    return this._bw;
  }
  public set bw(value) {
    this._bw = value;
  }
  public get bw_min() {
    return this._bw_min;
  }
  public set bw_min(value) {
    this._bw_min = value;
  }
  public get hmcr() {
    return this._hmcr;
  }
  public set hmcr(value) {
    this._hmcr = value;
  }
  public get par() {
    return this._par;
  }
  public set par(value) {
    this._par = value;
  }
  public get par_max() {
    return this._par_max;
  }
  public set par_max(value) {
    this._par_max = value;
  }
  public get par_min() {
    return this._par_min;
  }
  public set par_min(value) {
    this._par_min = value;
  }
  public set stepByStepAlgorithm(stepByStepAlgorithm: boolean) {
    this._stepByStepAlgorithm = stepByStepAlgorithm;
  }
  public get stepByStepAlgorithm() {
    return this._stepByStepAlgorithm;
  }
  public set timePerStep(timePerStep: number) {
    this._timePerStep = timePerStep;
  }
  public get timePerStep() {
    return this._timePerStep;
  }
  public get numOfTurnPerStep() {
    return this._numOfTurnPerStep;
  }
  public set numOfTurnPerStep(value) {
    this._numOfTurnPerStep = value;
  }

  loadData() {
    this.changeData.emit(this.getGraphAsDataSet());
  }

  private petersen(): Readonly<GraphPlain> {
    const petersenEdges = [
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 5, to: 1 },
      { from: 6, to: 8 },
      { from: 7, to: 9 },
      { from: 7, to: 10 },
      { from: 8, to: 10 },
      { from: 9, to: 6 },
      { from: 1, to: 6 },
      { from: 2, to: 7 },
      { from: 3, to: 8 },
      { from: 4, to: 9 },
      { from: 5, to: 10 }
    ] as EdgeImmutPlain[];

    return {
      edges: petersenEdges,
      nodes: gHelp.interpolateNodesFromEdges(petersenEdges)
    };
  }

  private konigsberg(): Readonly<GraphPlain> {
    const konigsbergEdges = [
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 4 },
      { from: 3, to: 4 },
      { from: 4, to: 1 },
      { from: 4, to: 1 },
    ] as EdgeImmutPlain[];
    return {
      edges: konigsbergEdges,
      nodes: gHelp.interpolateNodesFromEdges(konigsbergEdges)
    };
  }

  private completeGraph = (V: number): Readonly<GraphPlain> => {
    const edges = [];
    const nodes = [];

    for (let i = 0; i < V; i++) {
      nodes.push({ id: i, label: i.toString() });
      for (let j = i + 1; j < V; j++) {
        edges.push({ from: i, to: j });
      }
    }

    return genericH.deepFreeze({ nodes, edges } as GraphPlain);
  }

  private hypercubeGraph = (D: number): Readonly<GraphPlain> => {
    const edges: EdgeImmutPlain[] = [];
    const nodes: NodeImmutPlain[] = [];

    const numNodes = Math.pow(2, D);

    const pad = (str: string, max: number): string => {
      return str.length < max ? pad('0' + str, max) : str;
    };

    const generateDifferByOne = (input: number, numBits: number) => {
      const inputBits = pad((input).toString(2), numBits).split('').reverse();
      const allDiffer = [];

      // 1 bit difference from input, increasing order, none less than input
      for (let b = 0; b < numBits; b++) {
        if (inputBits[b] === '0') {
          const newNum = inputBits.slice();
          newNum[b] = '1';
          newNum.reverse();
          allDiffer.push(parseInt(newNum.join(''), 2));
        }
      }

      return allDiffer;
    };

    for (let i = 0; i < numNodes; i++) {
      nodes.push({ id: i, label: pad(i.toString(2), D) });
      generateDifferByOne(i, D).forEach((j) => {
        edges.push({ from: i, to: j });
      });
    }

    return genericH.deepFreeze({ nodes, edges } as GraphPlain);
  }

  private newCustomGraph = (V: number): Readonly<GraphPlain> => {
    const nodes = [];
    for (let i = 0; i < V; i++) {
      nodes.push({ id: i, label: i.toString() });
    }

    return genericH.deepFreeze({ nodes, edges: [] } as GraphPlain);
  }

  public setComplete(num: number) {
    const data = this.completeGraph(num);
    this.graph = new GraphImmut(data.nodes, data.edges, false);
    this.loadData();
  }

  public setHypercube(num: number) {
    const data = this.hypercubeGraph(num);
    this.graph = new GraphImmut(data.nodes, data.edges, false);
    this.loadData();
  }

  public setCustom(num: number) {
    const data = this.newCustomGraph(num);
    this.graph = new GraphImmut(data.nodes, data.edges, false);
    this.loadData();
  }

  public setKonigsberg() {
    const data = this.konigsberg();
    this.graph = new GraphImmut(data.nodes, data.edges, false);
    this.loadData();
  }

  public setPetersen() {
    const data = this.petersen();
    this.graph = new GraphImmut(data.nodes, data.edges, false);
    this.loadData();
  }

  constructor(private importExportService: ImportExportService) {
    this.setPetersen();
  }

  getGraph() {
    return this.graph;
  }

  getGraphAsDataSet(): VisNetworkData {
    return { nodes: new VisNodes(this.graph.getAllNodes() as VisNode[]), edges: new VisEdges(this.graph.getAllEdges() as VisEdge[]) };
  }

  public graphPlainToGraphImmut = (gp: GraphPlain): GraphImmut => {
    return new GraphImmut(gp.nodes, gp.edges);
  }

  public welshPowell = (): void => {
    const wp = new WelshPowell(this.graph);
    const res = wp.mainLoop();
    this.applyColors(res);
  }

  public applyColors(res: Result) {
    const graphColors = res.graphColors;
    const chromaticNumber = res.chromaticNumber;
    const colors = randomColor({ count: chromaticNumber, luminosity: 'light' });
    let G = this.graph;
    (G.getAllNodes() as NodeImmutPlain[]).forEach((v) => {
      G = G.editNode(v.id, { color: colors[graphColors[v.id]] });
    });
    this.graph = G;
    this.sendResult(res);
    this.changeData.emit(this.getGraphData(G));
  }

  public harmonySearch = (): void => {
    const fitness = new Fitness(this.graph);
    const hs = new HarmonySearch();
    this.setNVAR();
    hs.setStrategyName(' Harmony Search ');
    hs.stepByStepAlgorithm = this._stepByStepAlgorithm;
    hs.numOfTurnPerStep = this._numOfTurnPerStep;
    hs.timePerStep = this._timePerStep;
    hs.showPrints = true;
    hs.NVAR = this._nvar;
    hs.HMS = this._hms;
    hs.BW = this._bw;
    hs.HMCR = this._hmcr;
    hs.PAR = this._par;
    hs.maxIter = this._maxIteration;
    hs.setBounds(0, new WelshPowell(this.graph).mainLoop().chromaticNumber - 1);
    hs.getResult().subscribe((res: Result) => {
      this.applyColors(res);
    });
    hs.mainLoop(fitness);
  }

  public genetic = (): void => {
    const fitness = new Fitness(this.graph);
    const genetic = new Genetic();
    this.setNVAR();
    genetic.setStrategyName(' Genetic ');
    genetic.stepByStepAlgorithm = this._stepByStepAlgorithm;
    genetic.numOfTurnPerStep = this._numOfTurnPerStep;
    genetic.timePerStep = this._timePerStep;
    genetic.lengthChromosome = this._nvar;
    genetic.numberChromosome = 10;
    genetic.pBest = 40.0;
    genetic.pCross = 40.0;
    genetic.pMutation = 20.0;
    genetic.pReproduce = 40.0;
    genetic.maxIter = this._maxIteration;
    genetic.setBounds(0, new WelshPowell(this.graph).mainLoop().chromaticNumber - 1);
    genetic.getResult().subscribe((res: Result) => {
      this.applyColors(res);
    });
    genetic.mainLoop(fitness);
  }

  setNVAR() {
    this.nvar = this.graph.getNumberOfNodes();
  }

  getGraphData(graph: GraphImmut, clearColors = false): GraphPlain {
    const nodes = graph.getAllNodes() as NodeImmutPlain[];
    return {
      nodes: clearColors ? this.clearColorFromNodes(nodes) : nodes,
      edges: graph.getAllEdges() as EdgeImmutPlain[],
    };
  }

  clearColorFromNodes(nodes: NodeImmutPlain[]): NodeImmutPlain[] {
    nodes.forEach((v) => {
      v.color = null;
    });
    return nodes;
  }

  sendResult(res: Result) {
    this.result.next(res);
  }

  getResult(): Observable<Result> {
    return this.result.asObservable();
  }

  public getFileExtension(filename: string) {
    return this.importExportService.getFileExtension(filename);
  }

  public importFile(string: string, filetype: string) {
    const graph = this.importExportService.import(string, filetype);
    if (graph) {
      this.graph = graph;
    }
    this.loadData();
  }

  public exportFile(format: string) {
    this.importExportService.exportToFile(format, this.getGraphData(this.graph));
  }

  public getVertices() {
    return this.graph.getNumberOfNodes();
  }

  public addNode(data, label) {
    data.label = label;
    this.graph = this.graph.addNode(data);
    return {
      nodes: this.clearColorFromNodes(this.graph.getAllNodes() as NodeImmutPlain[]),
      edges: this.graph.getAllEdges() as EdgeImmutPlain[]
    };
  }

  public addEdge(from: number | string, to: number | string) {
    const edgeFrom = this.getInt(from);
    const edgeTo = this.getInt(to);
    this.graph = this.graph.addEdge(edgeFrom, edgeTo);
    return {
      nodes: this.clearColorFromNodes(this.graph.getAllNodes() as NodeImmutPlain[]),
      edges: this.graph.getAllEdges() as EdgeImmutPlain[]
    };
  }

  public deleteEdge(from: number | string, to: number | string) {
    const edgeFrom = this.getInt(from);
    const edgeTo = this.getInt(to);
    this.graph = this.graph.deleteEdge(edgeFrom, edgeTo, false);
    return {
      nodes: this.clearColorFromNodes(this.graph.getAllNodes() as NodeImmutPlain[]),
      edges: this.graph.getAllEdges() as EdgeImmutPlain[]
    };
  }

  public deleteNode(id: number | string) {
    const iId = this.getInt(id);
    const newGraph = this.graph.deleteNode(iId);
    if (newGraph instanceof GraphImmut) {
      this.graph = newGraph;
      return {
        nodes: this.clearColorFromNodes(newGraph.getAllNodes() as NodeImmutPlain[]),
        edges: newGraph.getAllEdges() as EdgeImmutPlain[]
      };
    }
  }

  getInt = (v: string | number): number => {
    if (typeof v === 'number') {
      return v;
    }
    return parseInt(v);
  }

  setLocations(locations: { [key: string]: { x: number; y: number } }): void {
    let newNodes = this.graph.getAllNodesAsImmutableList();
    Object.keys(locations).forEach((i) => {
      const v = locations[i];
      const node = newNodes.get(parseInt(i));
      if (node.getAttribute('x') !== v.x || node.getAttribute('y') !== v.y) {
        newNodes = newNodes.set(parseInt(i), node.editNode(node.getLabel(), { x: v.x, y: v.y }));
      }
    });

    const graph = new GraphImmut(newNodes, this.graph.getAllEdgesAsImmutableList(), false);
    this.graph = graph;
  }

}
