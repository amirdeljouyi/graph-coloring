import GraphImmut from './GraphImmut/GraphImmut';
import genericH from './genericHelpers';
import { Result } from '../models/results';

export default class WelshPowell {
    constructor(private graph: GraphImmut) { }
    public mainLoop() {
        // Get node ID's only
        const nodeArr: number[] = genericH.datasetToArray(this.graph.getAllNodes(), 'id') as number[];

        // Put vertices in array in decreasing order of degree
        const degrees = this.graph.getAllOutDegrees();
        const vertexOrder = genericH.sort(nodeArr, (a, b) => {
            return degrees[a] < degrees[b] ? 1 : degrees[a] === degrees[b] ? 0 : -1;
        });

        const colorIndex: { [key: number]: number } = {};
        let currentColor = 0;
        while (vertexOrder.length > 0) {
            const root = vertexOrder.shift();
            colorIndex[root] = currentColor;

            const myGroup = [];
            myGroup.push(root);

            for (let i = 0; i < vertexOrder.length;) {
                const p = vertexOrder[i];
                let conflict = false;

                for (let j = 0; j < myGroup.length; j++) {
                    if (this.graph.areAdjacent(p, myGroup[j])) {
                        i++;
                        conflict = true;
                        break;
                    }
                }
                if (conflict) {
                    continue;
                }

                colorIndex[p] = currentColor;
                myGroup.push(p);
                vertexOrder.splice(i, 1);
            }

            currentColor++;
        }

        const chromaticNumber = genericH.max(genericH.flatten(colorIndex) as any[]) + 1;
        const res: Result = {
            algorithm: 'Welsh Powell',
            chromaticNumber: chromaticNumber,
            graphColors: colorIndex
        };
        return res;
    }
}
