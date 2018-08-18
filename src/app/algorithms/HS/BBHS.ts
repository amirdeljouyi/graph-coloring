// import { HarmonySearch } from './harmonySearch';

// export class BBHS extends HarmonySearch {

//     protected lowPrim: number[];
//     protected highPrim: number[];
//     applyMethodIteration: number;

//     @Override
//     public void initiator(FitnessFunction fitnessFunction, Function function) {
//         lowPrim = Arrays.copyOf(low, low.length);
//         highPrim = Arrays.copyOf(high, high.length);
//         applyMethodIteration = 250;
//         super.initiator(fitnessFunction, function);
//     }

//     @Override
//     public double mainLoop(FitnessFunction fitnessFunction, Function function) {
//         initiator(fitnessFunction, function);
//         printHM();
//         while (stopCondition()) {
//             if (generation % applyMethodIteration == 0) {
//                 applyMethod();
//             }
//             makeNCHV();
//             double currentFit = calculateFitness(function, NCHV);
//             updateHarmonyMemory(currentFit);
//             printHM();
//             generation++;
//         }
//         printBest();
//         printNCHVHistory();
//         return bestHarmony[NVAR];
//     }

//     @Override
//     protected void makeNCHV() {

//         double p = randomGenerator.ran1();
//         if (p < .1) {
//             double[] hmRow = HM[randomGenerator.randVal(0, HMS - 1)];
//             int nchvIndex = randomGenerator.randVal(0, NVAR - 1);
//             BW = calculateBW();
//             double rand = randomGenerator.ran1();
//             double temp = hmRow[nchvIndex];
//             if (rand < 0.5) {
//                 temp += rand * BW;
//                 if (temp < high[nchvIndex]) {
//                     hmRow[nchvIndex] = temp;
//                 }
//             } else {
//                 temp -= rand * BW;
//                 if (temp > low[nchvIndex]){
//                     hmRow[nchvIndex] = temp;
//                 }
//             }
//             NCHV = hmRow;
//         } else {
//             for (int i = 0; i < NVAR; i++) {
//                 double p2 = randomGenerator.ran1();
//                 if (p2 < .5){
//                     NCHV[i] = randomGenerator.randVal(lowPrim[i], highPrim[i]);
//                 }
//                 else {
//                     NCHV[i] = randomGenerator.randVal(low[i], high[i]);
//                 }

//             }
//         }
//     }

//     private void applyMethod() {
//         for (int i = 0; i < NVAR; i++) {
//             double maxHM = maxHM(i);
//             double minHM = minHM(i);
//             highPrim[i] = maxHM;
//             lowPrim[i] = minHM;
//         }
//     }
// }
