import EdgeImmut, { EdgeImmutPlain } from './GraphImmut/EdgeImmut';
import GraphImmut from './GraphImmut/GraphImmut';
import gHelp from './graphHelpers';
import genericH from './genericHelpers';
import { GraphPlain } from './graphPlain';
import { NodeImmutPlain } from './GraphImmut/NodeImmut';

export default class Fitness {
    edges: EdgeImmut[] | EdgeImmutPlain[];
    adjacencies: number[][];
    numOfNodes: number;
    constructor(private graph: GraphImmut) {
        this.edges = this.graph.getAllEdges(true);
        this.numOfNodes = this.graph.getNumberOfNodes();
        this.adjacencies = new Array<Array<number>>(this.numOfNodes);
        for (let i = 0; i < this.numOfNodes; i++) {
            this.adjacencies[i] = [...this.graph.getNodeAdjacency(i)];
        }
    }

    public getfitness(index: number, colorIndex: { [key: number]: number }) {
        const chromaticNumber = this.getChromaticNumber(colorIndex);
        switch (index) {
            case 1:
                return this.fitness1(chromaticNumber, colorIndex);
            default:
                return this.fitness3(chromaticNumber, colorIndex);
        }
    }

    public getChromaticNumber(colorIndex: { [key: number]: number }) {
        return genericH.max(genericH.flatten(colorIndex) as any[]) + 1;
    }

    fitness1 = (chromaticNumber, colorIndex: { [key: number]: number }) => {
        for (const edge of this.edges) {
            if (colorIndex[(edge as EdgeImmut).getFrom()] === colorIndex[(edge as EdgeImmut).getTo()]) {
                return 0;
            }
        }
        return (this.numOfNodes + 1 - chromaticNumber);
    }

    fitness3 = (chromaticNumber, colorIndex: { [key: number]: number }) => {
        let fit = 0;
        for (const edge of this.edges) {
            if (colorIndex[(edge as EdgeImmut).getFrom()] !== colorIndex[(edge as EdgeImmut).getTo()]) {
                fit++;
            }
        }
        if (fit === this.edges.length) {
            fit += (this.numOfNodes - chromaticNumber);
        }
        return fit;
    }

    public conflict = (colorIndex: { [key: number]: number }): boolean => {
        for (const edge of this.edges) {
            if (colorIndex[(edge as EdgeImmut).getFrom()] === colorIndex[(edge as EdgeImmut).getTo()]) {
                return true;
            }
        }
        return false;
    }

    public numConflict = (colorIndex: { [key: number]: number }, index: number): number => {
        // const adjacencies = this.graph.getNodeAdjacency(index);
        let numConflict = 0;
        for (const adjacency of this.adjacencies[index]) {
            if (colorIndex[adjacency] === colorIndex[index]) {
                numConflict++;
            }
        }
        return numConflict;
    }

    public numMakeConflict = (colorIndex: { [key: number]: number }, vertex1: number, vertex2: number): number => {
        const adjacency1 = this.adjacencies[vertex1];
        adjacency1.splice(adjacency1.indexOf(vertex2), 1);
        const adjacency2 = this.adjacencies[vertex2];
        adjacency2.splice(adjacency2.indexOf(vertex1), 1);
        let numConflict = 0;
        for (const adjacency of adjacency1) {
            if (colorIndex[adjacency] === colorIndex[vertex2]) {
                numConflict++;
            }
        }
        for (const adjacency of adjacency2) {
            if (colorIndex[adjacency] === colorIndex[vertex1]) {
                numConflict++;
            }
        }
        return numConflict;
    }

    public swapStep = (colorIndex: { [key: number]: number }, index: number): number[] => {
        // const adjacencies = this.graph.getNodeAdjacency(index);
        let conflict = Number.MAX_VALUE;
        let diffrenceConflict = Number.MAX_VALUE;
        let adjacencyIndex = 0;
        // console.log(index);
        // console.log(colorIndex);
        for (const adjacency of this.adjacencies[index]) {
            if (colorIndex[index] !== colorIndex[adjacency]) {
                const beforeConflicts = this.numConflict(colorIndex, index) + this.numConflict(colorIndex, adjacency);
                const adjacencyConflict = this.numMakeConflict(colorIndex, index, adjacency);
                const diffConf = adjacencyConflict - beforeConflicts;
                // console.log('adja Conflict:', adjacencyConflict, adjacency);
                if (diffConf < diffrenceConflict) {
                    diffrenceConflict = diffConf;
                    conflict = adjacencyConflict;
                    adjacencyIndex = adjacency;
                } else if (diffConf === diffrenceConflict && adjacencyConflict < conflict) {
                    conflict = adjacencyConflict;
                    adjacencyIndex = adjacency;
                }
            }
        }
        // console.log(adjacencyIndex);
        return [adjacencyIndex, diffrenceConflict];
    }

    public randomAdjacency = (index: number): number => {
        const nodes = [...this.adjacencies[index]];
        return nodes[Math.floor(Math.random() * nodes.length)];
    }

}
