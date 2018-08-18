'use strict';

import {List} from 'immutable';
import {default as NodeImmut, NodeImmutPlain} from './NodeImmut';
import {default as EdgeImmut, EdgeImmutPlain} from './EdgeImmut';

interface NodeMapping {
    [key: number]: number;
}

const filterNodeExtraAttr = (data: any) => {
    return Object.keys(data)
        .filter((key) => !(['label', 'id']).includes(key))
        .reduce((obj: any, key) => {
            obj[key] = data[key];
            return obj;
        }, {});
};

const genericEdgesToImmutEdges = (edges: any, nodeMap: NodeMapping = {}): boolean | List<EdgeImmut> => {
    if (edges === null) {
        return false;
    }

    let newEdges: List<EdgeImmut> = List();

    if (typeof edges === 'object') {
        edges.forEach((edge: any) => {
            let from = 0;
            let to = 0;

            if ('from' in edge) {
                from = nodeMap[edge.from];
            }
            if ('to' in edge) {
                to = nodeMap[edge.to];
            }

            newEdges = newEdges.push(new EdgeImmut(from, to));
        });
    } else {
        return false;
    }

    return newEdges;
};

const genericNodesToImmutNodes = (nodes: any): boolean | { nodes: Readonly<List<NodeImmut>>; map: { [key: number]: number } } => {
    if (nodes === null) {
        return false;
    }

    let newNodes: List<NodeImmut> = List();
    const nodeMap: NodeMapping = {};

    if (typeof nodes === 'number') {
        // Create the nodes
        for (let i = 0; i < Math.floor(nodes); i++) {
            newNodes = newNodes.set(i, new NodeImmut(i));
            nodeMap[i] = i;
        }
    } else if (typeof nodes === 'object') {
        let nodeNum = 0;
        nodes.forEach((n: any) => {
            const id = nodeNum++;
            let label = null;
            let extraAttrs = null;

            if ('label' in n) {
                label = n.label;
            }
            if ('id' in n) {
                nodeMap[n.id] = id;
                if ('label' in n && n.label === n.id.toString()) {
                    label = id.toString();
                }
            } else {
                nodeMap[id] = id;
            }
            if ('attributes' in n) {
                extraAttrs = filterNodeExtraAttr(n.attributes);
            } else {
                extraAttrs = filterNodeExtraAttr(n);
            }

            newNodes = newNodes.set(id, new NodeImmut(id, label, extraAttrs));
        });
    } else {
        return false;
    }

    return {nodes: Object.freeze(newNodes), map: nodeMap};
};

export default class GraphImmut {
    private readonly directed: Readonly<boolean>;
    private readonly nodes: Readonly<List<NodeImmut>>;
    private readonly numNodes: Readonly<number>;
    private readonly edges: Readonly<List<EdgeImmut>>;
    private readonly numEdges: Readonly<number>;

    constructor(nodes: number | List<NodeImmut> | NodeImmutPlain[],
                edges: null | List<EdgeImmut> | EdgeImmutPlain[] = null,
                directed = false) {
        this.directed = Object.freeze(directed);
        let nodeMap = {};

        // Make Nodes
        if (typeof nodes === 'number' || (typeof nodes === 'object' && !(nodes instanceof List))) {
            const n = genericNodesToImmutNodes(nodes);
            if (typeof n !== 'object') {
                throw new Error('Unable to parse node input!');
            }
            this.nodes = n.nodes;
            nodeMap = n.map;
        } else if (nodes instanceof List) {
            this.nodes = nodes as List<NodeImmut>;
        } else {
            throw new Error('Illegal type of \'node\' input to GraphImmut constructor');
        }
        this.nodes = Object.freeze(this.nodes);
        this.numNodes = Object.freeze(this.nodes.size);

        // If we are given edges, add them to the graph
        if (edges !== null && typeof edges === 'object' && !(edges instanceof List)) {
            const e = genericEdgesToImmutEdges(edges, nodeMap);
            if (typeof e !== 'object') {
                throw new Error('Unable to parse Edge input');
            }
            this.edges = e;
        } else if (edges instanceof List) {
            this.edges = edges as List<EdgeImmut>;
        } else {
            this.edges = List();
        }
        this.edges = Object.freeze(this.edges);
        this.numEdges = Object.freeze(this.edges.size);

        if (new.target === GraphImmut) {
            Object.freeze(this);
        }
    }

    alignNodeIDs(alignTo = 0): GraphImmut {
        const nodeMap: NodeMapping = {};
        let nodeCount = alignTo;
        let newNodes: List<NodeImmut> = List();
        this.nodes.forEach((v) => {
            let label = v.getLabel();
            if (v.getLabel() === v.getID().toString()) {
                label = nodeCount.toString();
            }

            newNodes = newNodes.set(nodeCount, new NodeImmut(nodeCount, label, v.getAllAttributes()));
            nodeMap[v.getID()] = nodeCount++;
        });

        let newEdges: List<EdgeImmut> = List();
        this.edges.forEach((v) => {
            newEdges = newEdges.push(new EdgeImmut(nodeMap[v.getFrom()], nodeMap[v.getTo()]));
        });

        return new GraphImmut(newNodes, newEdges, this.directed);
    }

    getNode(id: number, rich = false): NodeImmut | NodeImmutPlain | boolean {
        if (id >= this.numNodes) {
            return false;
        }
        if (rich) {
            return this.nodes.get(id);
        }
        return this.nodes.get(id).toPlain();
    }

    addNode(data: any = null): GraphImmut {
        if (data === null) {
            data = {};
        }

        const id = this.numNodes;
        if (!('label' in data)) {
            data.label = id.toString();
        }

        const extraAttrs = filterNodeExtraAttr(data);

        return new GraphImmut(this.nodes.set(id, new NodeImmut(id, data.label, extraAttrs)),
            this.edges, this.directed);
    }

    editNode(id: number, data: any): any {
        if (!this.nodes.has(id)) {
            return false;
        }

        const extraAttrs = filterNodeExtraAttr(data);
        if (!('label' in data)) {
            data.label = (this.getNode(id, true) as NodeImmut).getLabel();
        }
        return new GraphImmut(this.nodes.set(id, (this.getNode(id, true) as NodeImmut).editNode(data.label, extraAttrs)),
            this.edges, this.directed);
    }

    deleteNode(id: number): GraphImmut | boolean {
        // Make sure the ID exists
        if (!(id >= 0 && id < this.numNodes)) {
            return false;
        }

        const nodeMap: NodeMapping = {}; // Map for old IDs to new ones since we're deleting an entry

        // Remove it from the node list
        let nodeCount = 0;
        const newNodes: List<NodeImmut> = this.nodes
            .filter((n) => {
                if (n.getID() === id) {
                    nodeMap[n.getID()] = -1;
                } else {
                    nodeMap[n.getID()] = nodeCount++;
                }

                return n.getID() !== id;
            })
            .map((node) => {
                let label = node.getLabel();
                if (node.getID().toString() === label) {
                    label = nodeMap[node.getID()].toString();
                }

                return new NodeImmut(nodeMap[node.getID()], label, node.getAllAttributes());
            }) as List<NodeImmut>;

        // Remap edges
        const newEdges: List<EdgeImmut> = this.edges
            .filter((edge) => {
                return !(edge.getFrom() === id || edge.getTo() === id);
            })
            .map((edge) => {
                return new EdgeImmut(nodeMap[edge.getFrom()], nodeMap[edge.getTo()]);
            }) as List<EdgeImmut>;

        return new GraphImmut(newNodes, newEdges, this.directed);
    }

    addEdge(from: number, to: number): GraphImmut {
        const newEdges = this.edges.push(new EdgeImmut(from, to));
        return new GraphImmut(this.nodes, newEdges, this.directed);
    }

    deleteEdge(from: number, to: number, deleteAll = true): GraphImmut {
        let foundOneEdge = false;
        const newEdges: List<EdgeImmut> = this.edges.filter((edge) => {
            // If we're not deleting everything and we have found one edge, then do not filter anymore
            if (foundOneEdge && !deleteAll) {
                return true;
            }

            // If we have an exact match
            if (edge.getFrom() === from && edge.getTo() === to) {
                foundOneEdge = true;
                return false; // Remove this edge
            }

            // If we are undirected, check for opposing matches
            if (!this.directed) {
                if (edge.getFrom() === to && edge.getTo() === from) {
                    foundOneEdge = true;
                    return false; // Remove this edge
                }
            }

            return true;
        }) as List<EdgeImmut>;

        return new GraphImmut(this.nodes, newEdges, this.directed);
    }


    getAllNodes(rich = false): NodeImmut[] | NodeImmutPlain[] {
        if (rich) {
            return this.nodes.toArray();
        }
        return this.nodes.map((node) => {
            return node.toPlain();
        }).toArray();
    }

    getAllNodesAsImmutableList(): List<NodeImmut> {
        return this.nodes;
    }

    getAllEdgesAsImmutableList(): List<EdgeImmut> {
        return this.edges;
    }

    getAllEdges(rich = false): EdgeImmut[] | EdgeImmutPlain[] {
        if (rich) {
            return this.edges.toArray();
        }
        return this.edges.map((edge) => {
            return edge.toPlain();
        }).toArray();
    }

    getNumberOfNodes(): number {
        return this.numNodes;
    }

    getNumberOfEdges(): number {
        return this.numEdges;
    }

    getAllOutDegrees(): number[] {
        const degrees: number[] = [];
        this.edges.forEach((edge) => {
            if (edge.getFrom() in degrees) {
                degrees[edge.getFrom()]++;
            } else {
                degrees[edge.getFrom()] = 1;
            }
        });

        return degrees;
    }

    asDirected(doubleEdges = false): GraphImmut {
        if (!doubleEdges) {
            return new GraphImmut(this.nodes, this.edges, true);
        }

        let newEdges = this.edges;
        this.edges.forEach((edge) => {
            newEdges = newEdges.push(new EdgeImmut(edge.getTo(), edge.getFrom()));
        });

        return new GraphImmut(this.nodes, newEdges, true);
    }

    asUndirected(): GraphImmut {
        let newEdges: List<EdgeImmut> = List();
        const addedEdges: { [key: string]: null } = {};

        this.edges.forEach((edge) => {
            let from = edge.getFrom();
            let to = edge.getTo();
            if (to > from) {
                from = to;
                to = edge.getFrom();
            }
            if (!(`${from}_${to}` in addedEdges)) {
                addedEdges[`${from}_${to}`] = null;
                newEdges = newEdges.push(new EdgeImmut(from, to));
            }
        });

        return new GraphImmut(this.nodes, newEdges, false);
    }

    getNodeAdjacency(id: number): number[] {
        const adj: number[] = [];
        this.edges.forEach((edge) => {
            if (edge.getFrom() === id) {
                adj.push(edge.getTo());
            } else if (!this.directed && edge.getTo() === id) {
                adj.push(edge.getFrom());
            }
        });

        return adj;
    }

    getFullAdjacency(): number[][] {
        const adj: number[][] = [];
        this.nodes.forEach((n) => {
            adj[n.getID()] = this.getNodeAdjacency(n.getID());
        });

        return adj;
    }

    areAdjacent(id1: number, id2: number): boolean {
        return this.getNodeAdjacency(id1).includes(id2);
    }

    getEdgesBetween(id1: number, id2: number): EdgeImmut[] {
        const edgeList: EdgeImmut[] = [];
        this.edges.forEach((edge) => {
            if (!this.directed && edge.getFrom() === id2 && edge.getTo() === id1) {
                edgeList.push(edge);
            }

            if (edge.getFrom() === id1 && edge.getTo() === id2) {
                edgeList.push(edge);
            }
        });

        return edgeList;
    }

    isDirected() {
        return this.directed;
    }
}
