import {
  FamilyConicLandmarkKnots as Knots,
} from "../../../reference-conics/FamilyConicLandmarkKnots";
import { nclose } from "../../internal/predicates";
import { AutoMovieHumanConicSection as S } from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanConicLoft,
} from "@automovie/interface";

/**
 * A family's landmark knots, as the fit tool takes them: run ends, sites and outline extrema with their places in their runs.
 *
 * The made families are round tubes on `limb(0)` along `Z`, their fields given every 25 mm: every extreme's own coordinate is the
 * tube's radius there, so every outline has the radius's extrema.
 *
 * Scenarios:
 * 1. A tube 200 mm long with one belly, radius `40 + 10 sin(pi s / 200)`: three knots, 0, 100 and 200, at places 0, 0.5 and 1 of its one
 *    run. The belly's knot is exact by the fields' symmetry about 100 and is compared within 1e-5 mm, what a search on values resolves.
 * 2. A limb 400 mm long with a joint at 200 and a belly on each bone, radius `40 + 10 |sin(pi s / 200)|`, and a site at 150: six knots,
 *    0, the first belly, the site, the joint, the second belly, 400. The waist at the joint is the run end itself and takes no second
 *    knot. A belly's knot is the extremum of the cubic through fields 25 mm apart, within a millimetre of the profile's 100 and 300; the
 *    two stand as far either side of the joint as each other within 1e-5 mm, by the fields' symmetry about 200. The second belly lies in
 *    run 1 at a place within 0.005 of 0.5.
 * 3. The fit tool's argument lists the stations to a hundredth of a millimetre.
 * 4. A site outside the fitted stations is left out, and `to` ends the knots before the family's last.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the tool module on made families and reads the stations, bases, runs and places it returns.
 * @evidence contracts/development/testing.md#independent-expectations The bellies' places are the made radius's closed-form maxima and the fields' symmetries; the run places are their definition.
 * @evidence contracts/development/common.md#meaningful-documentation Sinusoidal tube and limb profiles give exact knot stations and run shares. Tool arguments, excluded exterior sites and a shorter requested domain have separate checks.
 */
export function test_human_landmark_knots(): void {
  const failures: string[] = [];
  const quarter: number = Math.SQRT2 - 1;
  const tube = (centres: AutoMovieVector3Tuple[], halves: number[], length: number, radius: (s: number) => number): IAutoMovieHumanConicLoft.IFamily => {
    const knots: number[] = Array.from({ length: length / 25 + 1 }, (_: unknown, k: number): number => 25 * k);
    const field = (of: (r: number) => number): number[] => knots.map((s: number): number => of(radius(s)));
    return {
      name: "made",
      centres,
      halves,
      up: [1, 0, 0],
      layout: S.limb(0),
      knots,
      values: [
        field((r: number): number => r),
        field((): number => 0),
        field((): number => 0),
        field((r: number): number => r),
        field((r: number): number => -r),
        field((): number => 0),
        field((): number => 0),
        field((r: number): number => -r),
        ...[0, 1, 2, 3].map((): number[] => field((): number => quarter)),
      ],
    };
  };

  // 1. One belly.
  const one: Knots.IKnot[] = Knots.knots(tube([[0, 0, 0], [0, 0, 200]], [], 200, (s: number): number => 40 + 10 * Math.sin((Math.PI * s) / 200)), { sites: [], step: 2 });
  if (one.length !== 3) failures.push("the tube's knots: " + JSON.stringify(one));
  else {
    [0, 100, 200].forEach((s: number, k: number): void => {
      if (!nclose(one[k]!.station, s, 1e-5)) failures.push("the tube's knot " + k + " stands at " + one[k]!.station + ", not " + s);
    });
    if (!nclose(one[1]!.tau, 0.5, 1e-7) || one[1]!.run !== 0 || one[1]!.basis !== "extremum") failures.push("the tube's belly is not an extremum halfway its one run: " + JSON.stringify(one[1]));
    if (Knots.argument(one) !== "--knots=0,100,200") failures.push("the tube's argument reads " + Knots.argument(one));
  }

  // 2. Two bones, a belly on each, a waist at the joint, a site.
  const limb: IAutoMovieHumanConicLoft.IFamily = tube([[0, 0, 0], [0, 0, 200], [0, 0, 400]], [10], 400, (s: number): number => 40 + 10 * Math.abs(Math.sin((Math.PI * s) / 200)));
  const two: Knots.IKnot[] = Knots.knots(limb, { sites: [150, 450], step: 2 });
  if (two.length !== 6) failures.push("the limb's knots: " + JSON.stringify(two));
  else {
    const expected: [number, string, number][] = [[0, "run", 1e-9], [100, "extremum", 1], [150, "site", 1e-9], [200, "run", 1e-9], [300, "extremum", 1], [400, "run", 1e-9]];
    expected.forEach(([s, basis, tolerance]: [number, string, number], k: number): void => {
      if (!nclose(two[k]!.station, s, tolerance) || two[k]!.basis !== basis) failures.push("the limb's knot " + k + " is " + JSON.stringify(two[k]) + ", not " + basis + " at " + s);
    });
    if (!nclose(200 - two[1]!.station, two[4]!.station - 200, 1e-5)) failures.push("the two bellies do not stand alike either side of the joint: " + two[1]!.station + ", " + two[4]!.station);
    if (two[4]!.run !== 1 || !nclose(two[4]!.tau, 0.5, 0.005)) failures.push("the second belly's place in its run: " + JSON.stringify(two[4]));
    if (two[3]!.run !== 0 || two[3]!.tau !== 1) failures.push("the joint is not its first run's end: " + JSON.stringify(two[3]));
  }

  // 4. An early end.
  const early: Knots.IKnot[] = Knots.knots(limb, { sites: [], step: 2, to: 200 });
  if (early.length !== 3 || early.at(-1)!.station !== 200) failures.push("the knots to 200 mm: " + JSON.stringify(early));
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
