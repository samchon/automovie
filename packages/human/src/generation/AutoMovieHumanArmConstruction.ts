import type { IAutoMovieHumanHandMeasures } from "@automovie/interface";

import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";

/** A hand caliper in millimetres as a line on stature and circumference. */
type Line = readonly [intercept: number, stature: number, tape: number];

/** Hand length, palm length and hand breadth, respectively. */
type HandLines = readonly [length: Line, palm: Line, breadth: Line];

/** Survey defaults for hand dimensions that the person did not supply. */
export namespace AutoMovieHumanArmConstruction {
  /**
   * OLS in millimetres on [1, stature, hand circumference], fitted separately
   * to the 1,986 women and 4,082 men in the ANSUR II public working databases.
   * The rows predict hand length, palm length and hand breadth in that order.
   * Gordon et al. 2014, NATICK/TR-15/007, defines the straight table posture
   * and the same separate calipers that the production source reads.
   */
  const LINES: readonly [HandLines, HandLines] = [
    [
      [-14.37514121, 0.07676457, 0.37764161],
      [3.26452543, 0.04242173, 0.19485467],
      [1.6484862, 0.00394036, 0.37570993],
    ],
    [
      [-9.28672501, 0.0737871, 0.34377844],
      [6.68817782, 0.04117837, 0.17641331],
      [1.06789398, 0.00307912, 0.38526699],
    ],
  ];

  /**
   * Thumb length from its proximal flexion crease over measured whole hand
   * length, women and men. Greiner 1991, NATICK/TR-92/011, mm over mm.
   */
  const THUMB: readonly [number, number] = [63.5 / 180.7, 69.7 / 194.1];

  /**
   * Predict the omitted hand calipers for the person's stature and palm tape.
   * The width of an ellipse with positive depth must be less than half its
   * tape. In that out-of-domain case use a circle on the person's tape.
   *
   * @param stature Stature in world millimetres.
   * @param tape Hand circumference in world millimetres.
   * @param scale Calibration millimetres per world millimetre.
   * @param sex Selects the survey sample.
   */
  export function expected(
    stature: number,
    tape: number,
    scale: number,
    sex: AutoMovieHumanSex,
  ): IAutoMovieHumanHandMeasures {
    const index: 0 | 1 = sex === AutoMovieHumanSex.Female ? 0 : 1;
    const line = ([a, b, c]: Line): number => a + b * stature + c * tape;
    const [lengthLine, palmLine, widthLine]: HandLines = LINES[index];
    const length: number = line(lengthLine);
    const width: number = line(widthLine);
    const breadth: number =
      width > 0 && 2 * width < tape ? width : tape / Math.PI;
    return {
      length: length * scale,
      palm: line(palmLine) * scale,
      breadth: breadth * scale,
      thumb: length * THUMB[index] * scale,
    };
  }
}
