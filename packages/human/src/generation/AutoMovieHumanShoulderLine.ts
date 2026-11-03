import type { IAutoMovieHumanShoulderOutline } from "./IAutoMovieHumanShoulderOutline";
import { AutoMovieHumanTrunkNeckSeat } from "./AutoMovieHumanTrunkNeckSeat";
import { AutoMovieHumanTrunkSolve } from "./AutoMovieHumanTrunkSolve";

/**
 * The shoulder line: the trapezius' upper border in the frontal plane, from
 * the shoulder point up to the neck's bottom ring (Gray 1918).
 *
 * The neck chain's bottom ring is itself the trapezius' flare, so the line
 * does not start at a neck circle: it arrives at the ring with the ring's
 * own width, slope and curvature (rule J3 copy, `AutoMovieHumanTrunkNeckSeat.
 * lateral`) and runs down to the shoulder point as one quintic Hermite whose
 * lower end takes the chord's slope and no curvature, so the line is a
 * straight run bent only as the neck's end requires. It is C2 with the neck
 * at its top; at the shoulder point it publishes its jet, which the cap's
 * fillet copies.
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
    // The chord from the shoulder point to the ring's edge gives the lower
    // end's slope: the line leaves the shoulder point straight toward the neck.
    const chord: number = (neck.z - shoulder.z) / (neck.y - shoulder.y);
    const low: AutoMovieHumanTrunkSolve.IJet = { value: shoulder.z, slope: chord, curvature: 0 };
    const high: AutoMovieHumanTrunkSolve.IJet = { value: neck.z, slope: neck.slope, curvature: neck.curvature };

    return {
      from: shoulder.y,
      to: neck.y,
      at: (y: number): AutoMovieHumanTrunkSolve.IJet =>
        AutoMovieHumanTrunkSolve.quintic(low, high, shoulder.y, neck.y, y),
    };
  }
}
