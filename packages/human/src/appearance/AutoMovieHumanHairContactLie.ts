import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";
import type { IAutoMovieHumanHairSettled } from "./IAutoMovieHumanHairSettled";

/**
 * A strand point lying on the body: the shoulder field's upper surface seen
 * from a candidate point, where the surface slopes by at most 45 degrees (a
 * gradient of at most 1).
 *
 * A point at least half a step beyond `clearance` over the surface (height
 * over it times the secant of the slope) is clear; once the strand rests the
 * margin is a step and a half, so resting hair follows a convex surface over
 * its edge instead of leaving it on a tangent. A point inside or nearer than
 * that lies on it: it moves vertically to that clearance and takes the
 * surface normal, but is not lifted by more than two and a half steps. Where
 * the field is steeper (the side of the neck, the back below a shoulder
 * blade, or the edge between one surface and a lower one, where the gradient
 * measures a step rather than a slope), a point is clear only when it is
 * `clearance` above the surface in its own column; otherwise it steps out
 * (`AutoMovieHumanHairContactStepOut`). The step margins and the lift limit
 * are conventions of this prototype.
 */
export namespace AutoMovieHumanHairContactLie {
  /**
   * Settle a point on the gentle surface or declare it clear.
   *
   * @param next Candidate point, head-local millimetres
   * @param y Its model height, millimetres
   * @param h The surface height in its column, model millimetres
   * @param g The surface gradient's magnitude
   * @param normal The surface normal
   * @param clearance Distance from the skin, millimetres
   * @param step Guide step, millimetres
   * @param resting Whether the strand already rests on the body
   * @returns The point clear of or lying on the body, or null when it must
   *   step out
   */
  export function lie(
    next: AutoMovieHumanSkinVector.Vec3,
    y: number,
    h: number,
    g: number,
    normal: AutoMovieHumanSkinVector.Vec3,
    clearance: number,
    step: number,
    resting: boolean,
  ): IAutoMovieHumanHairSettled | null {
    if (g <= 1) {
      const secant: number = Math.hypot(1, g);
      if (y - h >= (clearance + (resting ? 1.5 : 0.5) * step) * secant)
        return { point: next, normal: null };

      const lift: number = h + clearance * secant - y;
      if (lift <= 2.5 * step)
        return {
          point: [next[0], next[1] + lift, next[2]],
          normal,
        };
      return null;
    }
    return y >= h + clearance ? { point: next, normal: null } : null;
  }
}
