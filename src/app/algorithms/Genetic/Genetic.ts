import Fitness from '../fitness';
import { Subject, Observable } from 'rxjs';
import { Result } from '../../models/results';
import genericH from '../genericHelpers';
export default class Genetic {

    protected _maxIter: number;
    generation = 0;
    protected low: number;
    protected high: number;
    private _stepByStepAlgorithm: boolean;
    private _timePerStep: number;
    private _numOfTurnPerStep: number;
    private terminationCriteria = true;
    private strategyName: string;
    protected _pBest: number;
    protected _pCross: number;
    protected _pMutation: number;
    protected _pReproduce: number;
    protected _lengthChromosome: number;
    protected _numberChromosome: number;
    private result = new Subject<Result>();
    private bestChromosome: number[];
    bestFitness = 0;

    population: number[][];
    constructor() {
    }

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

    public get pBest() {
        return this._pBest;
    }

    public set pBest(value: number) {
        this._pBest = value;
    }

    public get pCross() {
        return this._pCross;
    }

    public set pCross(value: number) {
        this._pCross = value;
    }

    public get pMutation() {
        return this._pMutation;
    }

    public set pMutation(value: number) {
        this._pMutation = value;
    }

    public get pReproduce() {
        return this._pReproduce;
    }

    public set pReproduce(value: number) {
        this._pReproduce = value;
    }

    public get lengthChromosome() {
        return this._lengthChromosome;
    }

    public set lengthChromosome(value: number) {
        this._lengthChromosome = value;
    }

    public get numberChromosome() {
        return this._numberChromosome;
    }

    public set numberChromosome(value: number) {
        this._numberChromosome = value;
    }

    public setArrays() {
        this.bestChromosome = new Array<number>(this.lengthChromosome);
        this.population = new Array<Array<number>>(this.numberChromosome);
        for (let i = 0; i < this.population.length; i++) {
            this.population[i] = new Array<number>(this.lengthChromosome);
        }
    }

    public setBounds(low: number, high: number): void {
        this.setArrays();
        this.low = low;
        this.high = high;
    }


    public calculateFitness(fitness: Fitness, chromosome: number[]) {
        return fitness.getfitness(3, chromosome);
    }

    public calculateFitnesses(fitness: Fitness) {
        const fitnesses = new Array<number>(this.population.length);
        for (let i = 0; i < fitnesses.length; i++) {
            fitnesses[i] = fitness.getfitness(3, this.population[i]);
        }
        return fitnesses;
    }

    public initiator(): void {
        for (let i = 0; i < this.numberChromosome; i++) {
            for (let j = 0; j < this.lengthChromosome; j++) {
                this.population[i][j] = randomGenerator(this.low, this.high);
            }
        }
    }

    protected findBestChromosomes(fitness: Fitness, percentage: number) {
        const nodeArr: number[] = new Array<number>(this.numberChromosome);
        for (let i = 0; i < nodeArr.length; i++) {
            nodeArr[i] = i;
        }
        // Put vertices in array in decreasing order of degree
        const fitnesses = this.calculateFitnesses(fitness);
        const fitnessOrder = genericH.sort(nodeArr, (a, b) => {
            return fitnesses[a] < fitnesses[b] ? 1 : fitnesses[a] === fitnesses[b] ? 0 : -1;
        });
        const nBestChromosomes = Math.floor(percentage * this.numberChromosome);
        let bestChromosomes = new Array<Array<number>>(nBestChromosomes);
        for (let i = 0; i < bestChromosomes.length; i++) {
            bestChromosomes[i] = new Array<number>(this.lengthChromosome);
        }

        for (let i = 0; i < nBestChromosomes; ++i) {
            bestChromosomes[i] = this.population[fitnessOrder.shift()];
        }

        return bestChromosomes;
    }

    protected findBestChromosome(fitness: Fitness) {
        let maxFit = 0;
        let indexMaxFit = 0;
        const fitnesses = this.calculateFitnesses(fitness);
        for (let i = 0; i < fitnesses.length; i++) {
            if (fitnesses[i] > maxFit) {
                maxFit = fitnesses[i];
                indexMaxFit = i;
            }
        }

        this.bestChromosome = this.population[indexMaxFit];
        this.bestFitness = maxFit;
    }

    protected chromomeReproduce(parent_1: number[], parent_2: number[]) {
        const start = this.lengthChromosome / 3;
        const randomA = randomGenerator(start, this.lengthChromosome - start);
        let newChromosome = new Array<number>(this.lengthChromosome);
        for (let i = 0; i < randomA; i++) {
            newChromosome[i] = parent_1[i];
        }

        for (let i = randomA; i < this.lengthChromosome; i++) {
            newChromosome[i] = parent_2[i];
        }

        return newChromosome;
    }


    protected reproduce(population: number[][], num: number) {
        let newPopulation: number[][] = [];
        let parent_1, parent_2: number;
        let newChromosome: number[] = [];
        const nChromosomes = population.length;

        for (let i = 0; i < num; i++) {
            parent_1 = randomGenerator(0, nChromosomes - 1);
            // This way we won't have parent_1 == parent_2
            parent_2 = (parent_1 + randomGenerator(1, nChromosomes - 2)) % nChromosomes;

            newChromosome = this.chromomeReproduce(population[parent_1], population[parent_2]);
            newPopulation.push(newChromosome);

        }
        return newPopulation;
    }

    protected chromosomeMutate(chromosome: number[]) {
        const maxIterations = chromosome.length / 2;

        const randomA = randomGenerator(1, maxIterations);
        let newChromosome = new Array<number>(this.lengthChromosome);
        for (let i = 0; i < this.lengthChromosome; i++) {
            newChromosome[i] = chromosome[i];
        }
        let randomB;

        for (let i = 0; i < randomA; i++) {
            randomB = randomGenerator(0, chromosome.length - 1);
            newChromosome[randomB] = randomGenerator(this.low, this.high);
        }
        return newChromosome;
    }

    protected mutate(population: number[][], num: number) {
        let newPopulation: number[][] = [];
        for (let i = 0; i < num; i++) {
            const randomIdx = randomGenerator(0, population.length - 1);

            const newChromosome = this.chromosomeMutate(population[randomIdx]);
            newPopulation.push(newChromosome);
        }
        return newPopulation;

    }

    protected createNewPopulation(fitness: Fitness) {
        const pTotal = this.pBest + this.pReproduce + this.pMutation;
        const pBest = this.pBest / pTotal;
        const nRepro = this.numberChromosome * (this.pReproduce / pTotal);
        const nMutation = this.numberChromosome * (this.pMutation / pTotal);
        let newPopulation: number[][] = this.findBestChromosomes(fitness, pBest);
        const reproducePopulation: number[][] = this.reproduce(newPopulation, nRepro);
        const mutatePopulation: number[][] = this.mutate(newPopulation, nMutation);
        newPopulation = newPopulation.concat(reproducePopulation);
        newPopulation = newPopulation.concat(mutatePopulation);
        this.population = newPopulation;
    }

    protected correctColor(fitness: Fitness, percentage: number) {
        let avg = 0;
        let finish = false;

        let per = this.numberChromosome * (percentage / 100);

        for (let i = 0; i < this.numberChromosome && !finish; i++) {
            if (!fitness.conflict(this.population[i])) {
                avg++;
                if (avg === per) {
                    finish = true;
                }
            }
        }

        if (finish === true) {
            this.findBestChromosome(fitness);
        }

        return finish;
    }

    public mainLoop(fitness: Fitness) {
        const t0 = performance.now();
        this.initiator();
        if (this.stepByStepAlgorithm) {
            this.iteration(fitness);
        } else {
            this.nonRecursiveIteration(fitness);
            this.findBestChromosome(fitness);
            const t1 = performance.now();
            console.log('Call to Genetic took ' + (t1 - t0) + ' milliseconds.');
            this.sendResult();
        }
    }

    iteration(fitness: Fitness) {
        this.createNewPopulation(fitness);
        this.generation++;
        if (!this.stopCondition(fitness)) {
            this.findBestChromosome(fitness);
            this.sendResult();
            return;
        }
        if (this.generation % this.numOfTurnPerStep === 0) {
            setTimeout(() => {
                this.findBestChromosome(fitness);
                this.sendResult();
                this.iteration(fitness);
            }, this.timePerStep);
        } else {
            this.iteration(fitness);
        }
    }

    public stopCondition(fitness: Fitness): boolean {
        if (this.correctColor(fitness, 100.0 - this.pMutation)) {
            this.terminationCriteria = false;
        }
        if (this.generation > this._maxIter) {
            this.terminationCriteria = false;
        }
        return this.terminationCriteria;
    }

    nonRecursiveIteration(fitness: Fitness) {
        let correctColor = false;
        for (this.generation = 0; this.generation < this.maxIter && !correctColor; this.generation++) {
            this.createNewPopulation(fitness);
            if (this.correctColor(fitness, 100.0 - this.pMutation)) {
                correctColor = true;
            }
        }
    }

    public getStrategyName(): string {
        return this.strategyName;
    }

    public setStrategyName(strategyName: string): void {
        this.strategyName = strategyName;
    }

    sendResult() {
        this.result.next({
            algorithm: this.strategyName,
            chromaticNumber: this.high + 1,
            graphColors: this.bestChromosome,
            generation: this.generation,
            fitness: this.bestFitness
        });
    }

    getResult(): Observable<any> {
        return this.result.asObservable();
    }
}

function randomGenerator(low, high) {
    return Math.floor(Math.random() * (high - low) + low + .5);
}
