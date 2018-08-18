export interface Result {
    algorithm: string;
    chromaticNumber: number;
    graphColors: { [key: number]: number };
    generation?: number;
    fitness?: number;
}
