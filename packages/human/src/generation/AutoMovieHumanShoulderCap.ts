import type { IAutoMovieHumanShoulderOutline } from "./IAutoMovieHumanShoulderOutline";
import { AutoMovieHumanArmPrior } from "./AutoMovieHumanArmPrior";
import { AutoMovieHumanTrunkSolve } from "./AutoMovieHumanTrunkSolve";

/** The arm prior's bind humerus direction, left frame. */
const HUMERUS: readonly number[] = AutoMovieHumanArmPrior.PRIOR.arm.upper;

/**
 * The shoulder's cap: the corner of the frontal outline between the
 * trapezius line and the deltoid's outer edge, from the shoulder point down
 * to the glenohumeral centre's height.
 *
 * In the frontal plane the trapezius line comes down from the neck and the
 * arm's outer edge runs at the bind's abduction of the humerus, so the
 * outline turns between them, not through a dome. The cap is the quintic
 * Hermite of that turn: it takes the line's jet at the shoulder point, and at
 * the glenohumeral centre's height the arm's outer edge, a straight line whose
 * lateral place there is the arm's centre line plus the ellipse's lateral
 * half size `R STRETCH`. It has no flat apex, so the outline is monotone from
 * the arm to the neck.
 */
export namespace AutoMovieHumanShoulderCap {
  /**
   * The bind's abduction of the arm's axis from the vertical in the frontal
   * plane, radians: the arm prior's humerus direction (`AutoMovieHumanArmPrior.
   * PRIOR.arm.upper`), the same bone the arm's tube is built about, so the
   * shoulders' ellipse and the arm's tube stand on one axis.
   */
  export const ABDUCTION: number = Math.atan2(HUMERUS[2]!, -HUMERUS[1]!);

  /** Forward drift of the arm's axis per millimetre of descent: the humerus direction's forward over its downward component. */
  export const FORWARD: number = HUMERUS[0]! / -HUMERUS[1]!;

  /**
   * Stretch of the arm's horizontal cut over its girth radius: a cylinder whose
   * axis leans from the vertical by the humerus' whole tilt is cut by a level
   * plane into an ellipse longer by one over the cosine of that tilt, along
   * the lean, which lies almost in the frontal plane.
   */
  export const STRETCH: number = Math.hypot(HUMERUS[0]!, HUMERUS[1]!, HUMERUS[2]!) / -HUMERUS[1]!;

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
   * height: the centre line's place plus the ellipse's lateral half size,
   * `R STRETCH`.
   *
   * @param edge The arm's edge data.
   * @returns The extreme's lateral place, mm.
   */
  export function extreme(edge: IEdge): number {
    return edge.z + edge.radius * STRETCH;
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
    // The edge is straight: z falls by the abduction's tangent per mm of height.
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
