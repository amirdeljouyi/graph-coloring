'use strict';

export interface EdgeImmutPlain {
    label?: string;
    from: number;
    to: number;
}

export default class EdgeImmut {
    private readonly from: Readonly<number>;
    private readonly to: Readonly<number>;

    constructor(from: number | EdgeImmutPlain, to?: number, weight: any = 1) {
        if (typeof from === 'object') {
            to = from.to;
            from = from.from;
        }

        this.from = Object.freeze(from);
        this.to = Object.freeze(to);

        if (new.target === EdgeImmut) {
            Object.freeze(this);
        }
    }

    getFrom(): Readonly<number> {
        return this.from;
    }

    getTo(): Readonly<number> {
        return this.to;
    }

    toPlain(): { from: Readonly<number>; to: Readonly<number> } {
        return {from: this.from, to: this.to};
    }
}
