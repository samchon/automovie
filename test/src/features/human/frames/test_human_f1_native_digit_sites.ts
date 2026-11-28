import {
  AutoMovieHumanConicLoft as H,
  AutoMovieHumanF1,
  AutoMovieHumanF1NativeCalibration as Calibration,
  AutoMovieHumanF1NativeSites as Sites,
} from "@automovie/human";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanF1,
  IAutoMovieViewAxis,
} from "@automovie/interface";

/**
 * A digit's caliper site stands at its definition's joint on the digit the calibration reads, and moving the site leaves f1 as it is.
 *
 * Scenarios:
 * 1. The finger's and the toe's sites are read on the first knuckled digit of the arm and of the leg in the figure's own list, the
 *    digit whose caliper the calibration takes for its hand's and its foot's digits.
 * 2. Each site is the station of that digit's course at its second centre, the first joint past its root: the course's distance to that
 *    centre is no smaller 0.05 mm either side, and is under the turn's half length there (a course passes a centre inside its turn).
 * 3. Each site lies strictly inside its family's fitted stations, where a caliper reads a section of the digit and not its end.
 * 4. f1's own sites carried through f1 are the same records.
 * 5. The digits' native scale is the ratio of a person's caliper to f1's at the same site, so at f1's own caliper it is exactly
 *    `[1, 1]` wherever the site stands: the native builder's unit scale returns f1's stored digit, which is why moving the site from a
 *    family's first knot to its joint cannot move f1. A caliper 7 % deeper and as broad gives exactly `[1.07, 1]`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the production site owner on f1's stored digits and the calibration's ratio.
 * @evidence contracts/development/testing.md#independent-expectations The joint's station is checked by direct distances on the course to the stored joint centre; the ratio's identity is arithmetic on made calipers.
 * @evidence contracts/development/common.md#meaningful-documentation The digit sites use the declared finger and toe, the nearest station to their next joint, an interior address and the corresponding caliper ratio.
 */
export function test_human_f1_native_digit_sites(): void {
  const failures: string[] = [];
  const sites: Sites.ISites = Sites.REFERENCE;
  const distance = (axis: IAutoMovieViewAxis.IAxis, s: number, p: readonly number[]): number => {
    const o: readonly number[] = axis.at(s).origin;
    return Math.hypot(o[0]! - p[0]!, o[1]! - p[1]!, o[2]! - p[2]!);
  };
  for (const [kind, limb] of [["finger", "arm"], ["toe", "leg"]] as const) {
    const site: Sites.IDigitSite = sites.digits[kind];

    // 1. The digit the calibration reads.
    const read: IAutoMovieHumanF1.IDigit | undefined = AutoMovieHumanF1.DIGITS.find((digit: IAutoMovieHumanF1.IDigit): boolean => digit.limb === limb && digit.knuckle);
    if (read === undefined || read.family.name !== site.family) failures.push(`the ${kind}'s site is read on ${site.family}, the calibration's digit is ${read?.family.name}`);
    const family: IAutoMovieHumanConicLoft.IFamily = Sites.F1.digits[kind];
    if (family.name !== site.family) failures.push(`the ${kind}'s site names ${site.family}, its input family is ${family.name}`);

    // 2. At the joint: a local minimum of the course's distance to the second centre, inside the turn.
    const axis: IAutoMovieViewAxis.IAxis = H.axis(family);
    const joint: readonly number[] = family.centres[1]!;
    const here: number = distance(axis, site.station, joint);
    if (distance(axis, site.station - 0.05, joint) < here || distance(axis, site.station + 0.05, joint) < here) failures.push(`the ${kind}'s site at ${site.station} is not the course's nearest station to its joint`);
    if (!(here < family.halves[0]!)) failures.push(`the ${kind}'s site stands ${here} mm from its joint, outside the turn's half length ${family.halves[0]}`);

    // 3. Inside the fitted stations.
    if (!(site.station > family.knots[0]! && site.station < family.knots.at(-1)!)) failures.push(`the ${kind}'s site at ${site.station} lies outside ${family.name}'s fitted stations ${family.knots[0]}..${family.knots.at(-1)}`);
  }

  // 4. The identity carry.
  if (Sites.resolve(Sites.F1).digits !== sites.digits) failures.push("f1's digit sites carried through f1 are not the same records");

  // 5. The scale at f1's own caliper, and at a changed one.
  const own: { depth: number; breadth: number } = { depth: 13.7, breadth: 15.2 };
  const [unitDepth, unitBreadth]: [number, number] = Calibration.ratio(own, own);
  if (unitDepth !== 1 || unitBreadth !== 1) failures.push(`f1's own caliper gives the scale [${unitDepth}, ${unitBreadth}], not [1, 1]`);
  const [deeper, asBroad]: [number, number] = Calibration.ratio({ depth: 1.07 * own.depth, breadth: own.breadth }, own);
  if (Math.abs(deeper - 1.07) > 1e-15 || asBroad !== 1) failures.push(`a caliper 7 % deeper gives the scale [${deeper}, ${asBroad}], not [1.07, 1]`);
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
