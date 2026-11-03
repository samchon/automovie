import type { IAutoMovieHumanShoulderOutline } from "./IAutoMovieHumanShoulderOutline";
import { AutoMovieHumanTrunkSolve } from "./AutoMovieHumanTrunkSolve";

/**
 * The shoulder's cap: the corner of the frontal outline between the
 * trapezius line and the deltoid's outer edge, from the shoulder point down
 * to the glenohumeral centre's height.
 *
 * In the frontal plane the trapezius line leaves the neck at a slope near 17
 * degrees below horizontal and the arm's outer edge runs at the bind's
 * abduction, 33 degrees from the vertical, so the outline turns through some
 * 40 degrees between them, not through a dome. The cap is the quintic Hermite
 * of that turn: it takes the line's jet at the shoulder point, and at the
 * glenohumeral centre's height the arm's outer edge, a straight line whose
 * lateral place there is the arm's centre line plus the ellipse's lateral
 * half size `R / cos(abduction)`. It has no flat apex, so the outline is
 * monotone from the arm to the neck.
 */
export namespace AutoMovieHumanShoulderCap {
  /**
   * The bind's abduction of the arm's axis from the vertical, radians: the
   * generated A-pose's 33 degrees (generalization.md, Rig). A bind
   * convention, measured on the references.
   */
  export const ABDUCTION: number = (33 * Math.PI) / 180;

  /** The arm's outer edge at the glenohumeral centre's height. */
  export interface IEdge {
    /** Height of the glenohumeral centre, mm. */
    y: number;

    /** Lateral place of the glenohumeral centre, mm. */
    z: number;

    /** The upper arm's girth radius, mm: the biceps tape over 2 pi. */
    radius: number;
  }

  /**
   * The lateral extreme of the arm's horizontal ellipse at the centre's
   * height: the centre line's place plus `R / cos(abduction)`, since a
   * cylinder of radius R tilted by the abduction is cut obliquely by a
   * horizontal plane into an ellipse stretched by `1 / cos(abduction)`.
   *
   * @param edge The arm's edge data.
   * @returns The extreme's lateral place, mm.
   */
  export function extreme(edge: IEdge): number {
    return edge.z + edge.radius / Math.cos(ABDUCTION);
  }

  /**
   * The cap.
   *
   * @param line The trapezius line's jet at the shoulder point, `at(from)` of the line.
   * @param shoulderY Height of the shoulder point, mm.
   * @param edge The arm's outer edge at the glenohumeral centre's height.
   * @returns The outline from the centre's height to the shoulder point's.
   */
  export function create(
    line: AutoMovieHumanTrunkSolve.IJet,
    shoulderY: number,
    edge: IEdge,
  ): IAutoMovieHumanShoulderOutline {
    // The edge is straight: z falls by tan(abduction) per mm of height.
    const low: AutoMovieHumanTrunkSolve.IJet = {
      value: extreme(edge),
      slope: -Math.tan(ABDUCTION),
      curvature: 0,
    };

    return {
      from: edge.y,
      to: shoulderY,
      at: (y: number): AutoMovieHumanTrunkSolve.IJet =>
        AutoMovieHumanTrunkSolve.quintic(low, line, edge.y, shoulderY, y),
    };
  }
}
