import {EdgeImmutPlain} from './GraphImmut/EdgeImmut';
import {NodeImmutPlain} from './GraphImmut/NodeImmut';

export interface GraphPlain {
    edges: EdgeImmutPlain[];
    nodes: NodeImmutPlain[];
}
