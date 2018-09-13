import Fitness from '../fitness';
import { Subject, Observable } from 'rxjs';
import { Result } from '../../models/results';

export default class HarmonySearch {

    private result = new Subject<Result>();

    generation = 0;
    protected _NVAR: number;
    protected _HMS: number;
    protected _maxIter: number;
    protected _PAR: number;
    protected _PAR_MIN: number;
    protected _PAR_MAX: number;
    protected _BW: number;
    protected _BW_MIN: number;
    protected _BW_MAX: number;
    protected _HMCR;
    // high and low should be 1 number or Array
    protected low: number;
    protected high: number;
    private NCHV: number[];
    private bestFitHistory: number[];
    private bestHarmony: number[];
    //    protected  worstFitHistory[];
    private HM: number[][];
    private terminationCriteria = true;
    public showPrints: boolean;
    public rangedForRandom: number[];
    private strategyName: string;
    private chromaticNumber: number[];
    private bestChromaticNumber: number;
    private _stepByStepAlgorithm: boolean;
    private _timePerStep: number;
    private _numOfTurnPerStep: number;
    private parIndexes: number[];

    public set stepByStepAlgorithm(value: boolean) {
        this._stepByStepAlgorithm = value;
    }

    public get stepByStepAlgorithm() {
        return this._stepByStepAlgorithm;
    }

    public set timePerStep(value: number) {
        this._timePerStep = value;
    }

    public get timePerStep() {
        return this._timePerStep;
    }

    public set numOfTurnPerStep(value: number) {
        this._numOfTurnPerStep = value;
    }

    public get numOfTurnPerStep() {
        return this._numOfTurnPerStep;
    }

    public get maxIter() {
        return this._maxIter;
    }

    public set maxIter(maxIter: number) {
        this._maxIter = maxIter;
    }

    protected fillRandomRanged(): void {
        this.rangedForRandom = new Array<number>(this._NVAR + 1);
        for (let i = 0; i < this._NVAR; i++) {
            const v = (this.high - this.low) / this._NVAR;
            this.rangedForRandom[i] = (v * i) + this.low;
        }
        this.rangedForRandom[this._NVAR] = this.high;
    }

    public get BW_MIN() {
        return this._BW_MIN;
    }

    public set BW_MIN(BW_MIN) {
        this._BW_MIN = BW_MIN;
    }

    public get BW_MAX() {
        return this._BW_MAX;
    }

    public set BW_MAX(BW_MAX) {
        this._BW_MAX = BW_MAX;
    }

    public get PAR_MIN() {
        return this._PAR_MIN;
    }

    public set PAR_MIN(PAR_MIN) {
        this._PAR_MIN = PAR_MIN;
    }

    public get PAR_MAX() {
        return this._PAR_MAX;
    }

    public set PAR_MAX(PAR_MAX) {
        this._PAR_MAX = PAR_MAX;
    }

    public set NVAR(NVAR) {
        this._NVAR = NVAR;
    }

    public set PAR(PAR) {
        this._PAR = PAR;
    }

    public set HMCR(HMCR) {
        this._HMCR = HMCR;
    }

    public set BW(BW) {
        this._BW = BW;
    }

    public set HMS(HMS) {
        this._HMS = HMS;
    }

    public setArrays() {
        // this.low = new Array<number>(this._NVAR);
        // this.high = new Array<number>(this._NVAR);
        this.NCHV = new Array<number>(this._NVAR);
        this.chromaticNumber = new Array<number>(this._NVAR);
        this.bestHarmony = new Array<number>(this._NVAR + 1);
        this.bestFitHistory = new Array<number>(this._maxIter + 1);
        this.HM = new Array<Array<number>>(this._HMS);
        for (let i = 0; i < this.HM.length; i++) {
            this.HM[i] = new Array<number>(this._NVAR + 1);
        }
    }

    public setBounds(low: number, high: number): void {
        this.setArrays();
        this.low = low;
        this.high = high;
    }

    public initiator(fitness: Fitness): void {
        let i: number;
        let curFit;
        for (i = 0; i < this._HMS; i++) {
            for (let j = 0; j < this._NVAR; j++) {
                this.HM[i][j] = randomGenerator(this.low, this.high);
            }
            curFit = this.calculateFitness(fitness, this.HM[i]);
            this.HM[i][this._NVAR] = curFit; // the calculateFitness is stored in the last column of HM
            this.chromaticNumber[i] = this.calculateChromaticNumber(fitness, this.HM[i]);
            // console.log(`fitness childes is : ${curFit}`);
        }
    }

    public calculateFitness(fitness: Fitness, newHarmony: number[]) {
        return fitness.getfitness(3, newHarmony);
    }

    public calculateChromaticNumber(fitness: Fitness, newHarmony: number[]) {
        return fitness.getChromaticNumber(newHarmony);
    }

    public stopCondition(fitness: Fitness): boolean {
        let fitnessCondition = true;
        for (let i = 0; i < this._HMS; i++) {
            if (fitness.conflict(this.HM[i])) {
                fitnessCondition = false;
            }
        }
        if (this.generation > this._maxIter || fitnessCondition) {
            this.terminationCriteria = false;
        }
        return this.terminationCriteria;
    }

    public stopCondition2(fitness: Fitness, percent: number): boolean {
        let avg = 0;

        const per = this._HMS * (percent / 100);

        for (let i = 0; i < this._HMS && this.terminationCriteria; i++) {
            if (!fitness.conflict(this.HM[i])) {
                avg++;
                if (avg === per) {
                    this.terminationCriteria = false;
                    break;
                }
            }
        }

        if (this.generation > this._maxIter) {
            this.terminationCriteria = false;
        }

        return this.terminationCriteria;
    }

    public updateHarmonyMemory(newFitness, newChromaticNumber): void {

        let worst = this.HM[0][this._NVAR];
        let worstIndex = 0;
        for (let i = 0; i < this._HMS; i++) {
            if (this.HM[i][this._NVAR] < worst) {
                worst = this.HM[i][this._NVAR];
                worstIndex = i;
            }
        }
        if (newFitness > worst) {
            for (let k = 0; k < this._NVAR; k++) {
                this.HM[worstIndex][k] = this.NCHV[k];
            }
            this.HM[worstIndex][this._NVAR] = newFitness;
            this.chromaticNumber[worstIndex] = newChromaticNumber;
        }

        this.findBestHarmony();
    }
    private findBestHarmonyInGeneration(): number[] {
        const best = new Array<number>(2);
        best[0] = this.HM[0][this._NVAR];
        best[1] = 0;
        for (let i = 0; i < this._HMS; i++) {
            if (this.HM[i][this._NVAR] > best[0]) {
                best[0] = this.HM[i][this._NVAR];
                best[1] = i;
            }
        }
        return best;
    }


    private findBestHarmony() {
        // find best harmony
        const bestArr = this.findBestHarmonyInGeneration();
        const best = bestArr[0];
        const bestIndex = bestArr[1];
        this.bestFitHistory[this.generation] = best;

        if (this.generation > 0 && best > this.bestFitHistory[this.generation - 1]) {
            for (let k = 0; k < this._NVAR; k++) {
                this.bestHarmony[k] = this.HM[bestIndex][k];
            }
            this.bestHarmony[this._NVAR] = best;
            // this.NCHV = [...this.bestHarmony];
            this.bestChromaticNumber = this.chromaticNumber[bestIndex];
        }
    }

    protected memoryConsideration(nchvIndex): void {
        this.NCHV[nchvIndex] =
            this.HM[randomGenerator(0, this._HMS - 1)][nchvIndex];
    }

    protected pitchAdjustments(fitness: Fitness) {
        for (const index of this.parIndexes) {
            this.pitchAdjustment(fitness, index);
        }
    }
    protected pitchAdjustment(fitness: Fitness, nchvIndex): void {
        const swap = fitness.swapStep(this.NCHV, nchvIndex);
        if (swap[1] < 0) {
            const index = swap[0];
            const temp = this.NCHV[nchvIndex];
            this.NCHV[nchvIndex] = this.NCHV[index];
            this.NCHV[index] = temp;
        }
    }

    protected calculateBW() {
        return this.high - this.low;
    }

    protected randomSelection(varIndex): void {
        this.NCHV[varIndex] = randomGenerator(this.low, this.high);
    }

    protected minHM(columnIndex) {
        let minValue = this.HM[0][columnIndex];
        for (let j = 1; j < this._HMS; j++) {
            if (minValue > this.HM[j][columnIndex]) {
                minValue = this.HM[j][columnIndex];
            }
        }
        return minValue;
    }

    protected maxHM(columnIndex) {
        let maxValue = this.HM[0][columnIndex];
        for (let j = 1; j < this._HMS; j++) {
            if (maxValue < this.HM[j][columnIndex]) {
                maxValue = this.HM[j][columnIndex];
            }
        }
        return maxValue;
    }

    protected bestIndexHM() {
        let best = this.HM[0][this._NVAR];
        let bestIndex = 0;
        for (let i = 0; i < this._HMS; i++) {
            if (this.HM[i][this._NVAR] < best) {
                best = this.HM[i][this._NVAR];
                bestIndex = i;
            }
        }
        return bestIndex;
    }

    protected bestHM(columnIndex) {
        let best = this.HM[0][this._NVAR];
        let bestIndex = 0;
        for (let i = 0; i < this._HMS; i++) {
            if (this.HM[i][this._NVAR] > best) {
                best = this.HM[i][this._NVAR];
                bestIndex = i;
            }
        }
        return this.HM[bestIndex][columnIndex];
    }

    protected worstHM(columnIndex) {
        let worst = this.HM[0][this._NVAR];
        let worstIndex = 0;
        for (let i = 0; i < this._HMS; i++) {
            if (this.HM[i][this._NVAR] < worst) {
                worst = this.HM[i][this._NVAR];
                worstIndex = i;
            }
        }
        return this.HM[worstIndex][columnIndex];
    }


    public mainLoop(fitness: Fitness) {
        // HM ro por mikonim
        this.initiator(fitness);
        const t0 = performance.now();
        // this.printHM();
        // this.NCHV = [...this.HM[this.findBestHarmonyInGeneration()[1]].slice(0, this._NVAR)];
        // console.log(this.NCHV);
        if (this._stepByStepAlgorithm) {
            this.iteration(fitness);
        } else {
            this.nonRecursiveIteration(fitness);
        }
        const t1 = performance.now();
        console.log('Call to Harmony Search took ' + (t1 - t0) + ' milliseconds.');
        this.sendResult();
        // this.printBest();
        // this.printNCHVHistory();
    }

    iteration(fitness: Fitness) {
        if (!this.stopCondition(fitness)) {
            return;
        }
        this.makeNCHVS(fitness);
        const currentFit = this.calculateFitness(fitness, this.NCHV); // CEC
        const currentCN = this.calculateChromaticNumber(fitness, this.NCHV);
        this.updateHarmonyMemory(currentFit, currentCN);
        this.printHM();
        this.generation++;
        if (this.generation % this._numOfTurnPerStep === 0) {
            setTimeout(() => {
                this.sendResult();
                this.iteration(fitness);
            }, this._timePerStep);
        } else {
            this.iteration(fitness);
        }
    }

    nonRecursiveIteration(fitness: Fitness) {
        while (this.stopCondition2(fitness, 80)) {
            this.makeNCHVS(fitness);
            const currentFit = this.calculateFitness(fitness, this.NCHV); // CEC
            const currentCN = this.calculateChromaticNumber(fitness, this.NCHV);
            this.updateHarmonyMemory(currentFit, currentCN);
            // this.printHM();
            this.generation++;
        }
    }

    sendResult() {
        this.result.next({
            algorithm: this.strategyName,
            chromaticNumber: this.bestChromaticNumber,
            graphColors: this.bestHarmony,
            generation: this.generation,
            fitness: this.bestFitHistory[this.generation - 1]
        });
    }

    getResult(): Observable<any> {
        return this.result.asObservable();
    }

    protected printNCHVHistory(): void {

    }

    protected printHarmony(): void {
        console.log(`first Harmony: ${this.HM}`);
    }

    protected printBest(): void {
        if (this.showPrints) {
            console.log('best :' + this.bestHarmony[this._NVAR]);
            for (let i = 0; i < this._NVAR; i++) {
                console.log(' ' + this.bestHarmony[i]);
            }
        }
    }

    protected makeNCHVS(fitness: Fitness): void {
        this.parIndexes = [];
        for (let nvarIndex = 0; nvarIndex < this._NVAR; nvarIndex++) {
            this.makeNCHV(fitness, nvarIndex);
        }
        // console.log('this.par', this.parIndexes);
        this.pitchAdjustments(fitness);
    }

    protected printHM(): void {
        if (this.showPrints) {
            if (this.generation % 10001 === 0) {
                console.log(`\n HM after :  ${this.generation}`);
                console.log(`${this.HM}`);
            }
        }
    }

    protected makeNCHV(fitness: Fitness, nchvIndex: number): void {

        this._PAR = this.calculatePAR();
        if (Math.random() <= this._HMCR) {
            this.memoryConsideration(nchvIndex);
            if (Math.random() < this._PAR) {
                // this.pitchAdjustment(fitness, nchvIndex);
                this.parIndexes.push(nchvIndex);
            }
        } else {
            this.randomSelection(nchvIndex);
        }
    }

    protected calculatePAR() {
        return this._PAR;
    }

    public getStrategyName(): string {
        return this.strategyName;
    }

    public setStrategyName(strategyName: string): void {
        this.strategyName = strategyName;
    }

}

function randomGenerator(low, high) {
    return Math.floor(Math.random() * (high - low) + low + .5);
}
