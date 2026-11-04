import type { IAutoMovieHumanShoulderOutline } from "./IAutoMovieHumanShoulderOutline";
import { AutoMovieHumanTrunkNeckSeat } from "./AutoMovieHumanTrunkNeckSeat";
import { AutoMovieHumanTrunkSolve } from "./AutoMovieHumanTrunkSolve";

/**
 * The shoulder line: the trapezius' upper border in the frontal plane, from
 * the shoulder point up to the side neck point on the neck's bottom ring
 * (Gray 1918; ISO 8559-1 3.1.1 and 3.1.7).
 *
 * The line is one concave curve: it leaves the neck's side with the ring's own
 * width, slope and curvature (rule J3 copy, `AutoMovieHumanTrunkNeckSeat.
 * lateral`), bends out over the trapezius and reaches the shoulder point with
 * no curvature, the outline's single inflection, where the cap's convex
 * fillet takes the line's jet (G2). As a function of height the half width's
 * slope runs from the shoulder point's to the ring's while its bend grows from
 * zero, so the mean slope over the line is the chord's: a slope `a + b t^2`
 * of the line's share `t` from the shoulder point, with `a + b` the ring's
 * slope and `a + b / 3` the chord's, leaves the shoulder point at
 * `(3 chord - ring) / 2`. The line is the quintic Hermite between those two
 * jets.
 */
export namespace AutoMovieHumanShoulderLine {
  /** The shoulder point's place on the outline. */
  export interface IPoint {
    /** Height of the shoulder point, mm. */
    y: number;

    /** Its lateral place, mm: half the biacromial breadth the course input fixes. */
    z: number;
  }

  /**
   * The line.
   *
   * @param shoulder The shoulder point on the outline.
   * @param neck The neck's bottom ring's lateral jet.
   * @returns The outline from the shoulder point's height to the ring's.
   */
  export function create(
    shoulder: IPoint,
    neck: AutoMovieHumanTrunkNeckSeat.ILateral,
  ): IAutoMovieHumanShoulderOutline {
    // The slope the line leaves the shoulder point with, so that its mean is
    // the chord's while its bend starts from zero there.
    const chord: number = (neck.z - shoulder.z) / (neck.y - shoulder.y);
    const low: AutoMovieHumanTrunkSolve.IJet = { value: shoulder.z, slope: (3 * chord - neck.slope) / 2, curvature: 0 };
    const high: AutoMovieHumanTrunkSolve.IJet = { value: neck.z, slope: neck.slope, curvature: neck.curvature };

    return {
      from: shoulder.y,
      to: neck.y,
      at: (y: number): AutoMovieHumanTrunkSolve.IJet =>
        AutoMovieHumanTrunkSolve.quintic(low, high, shoulder.y, neck.y, y),
    };
  }
}
