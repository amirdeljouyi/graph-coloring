import EdgeImmut, { EdgeImmutPlain } from './GraphImmut/EdgeImmut';
import GraphImmut from './GraphImmut/GraphImmut';
import gHelp from './graphHelpers';
import genericH from './genericHelpers';
import { GraphPlain } from './graphPlain';
import { NodeImmutPlain } from './GraphImmut/NodeImmut';

export default class Fitness {
    constructor(private graph: GraphImmut) {
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
        const edges = this.graph.getAllEdges(true);
        for (const edge of edges) {
            if (colorIndex[(edge as EdgeImmut).getFrom()] === colorIndex[(edge as EdgeImmut).getTo()]) {
                return 0;
            }
        }
        return (this.graph.getNumberOfNodes() + 1 - chromaticNumber);
    }

    fitness3 = (chromaticNumber, colorIndex: { [key: number]: number }) => {
        const edges = this.graph.getAllEdges(true);
        let fit = 0;
        for (const edge of edges) {
            if (colorIndex[(edge as EdgeImmut).getFrom()] !== colorIndex[(edge as EdgeImmut).getTo()]) {
                fit++;
            }
        }
        if (fit === edges.length) {
            fit += (this.graph.getNumberOfNodes() - chromaticNumber);
        }
        return fit;
    }

    public conflict = (colorIndex: { [key: number]: number }): boolean => {
        const edges = this.graph.getAllEdges(true);
        for (const edge of edges) {
            if (colorIndex[(edge as EdgeImmut).getFrom()] === colorIndex[(edge as EdgeImmut).getTo()]) {
                return true;
            }
        }
        return false;
    }


}
