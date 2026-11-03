import type { IAutoMovieHumanShoulderOutline } from "./IAutoMovieHumanShoulderOutline";
import { AutoMovieHumanDeltoidCap } from "./AutoMovieHumanDeltoidCap";
import { AutoMovieHumanShoulderCap } from "./AutoMovieHumanShoulderCap";
import { AutoMovieHumanTrunkSolve } from "./AutoMovieHumanTrunkSolve";

/**
 * The arm's horizontal section at a height, the ellipse the arm's root is
 * made of, from the glenohumeral centre and the upper arm's girth radius.
 *
 * Below the glenohumeral centre the arm is a cylinder of radius R about an
 * axis abducted by the bind's angle from the vertical, so a horizontal cut is
 * an ellipse of forward half size R and lateral half size `R STRETCH`
 * (`AutoMovieHumanShoulderCap.STRETCH`) whose centre moves outward by
 * `tan(abduction)` and forward by the humerus' forward drift per mm of
 * descent, the arm prior's own bone. This is
 * the same size the arm's own construction reads the root from (its area
 * times the cosine of the bone's tilt is the circle's, generalization.md,
 * Arm and hand). Above the centre the deltoid cap takes over
 * (`AutoMovieHumanDeltoidCap`).
 */
export namespace AutoMovieHumanArmRootOval {
  /** An ellipse in a horizontal plane. */
  export type IOval = AutoMovieHumanDeltoidCap.IOval;

  /** What the oval reads. */
  export interface IInput {
    /** The glenohumeral centre `[x, y, z]`, mm. */
    glenohumeral: readonly [number, number, number];

    /** The upper arm's girth radius, mm: the biceps tape over 2 pi. */
    radius: number;

    /** The cap's outline from the centre's height to the shoulder point. */
    cap: IAutoMovieHumanShoulderOutline;
  }

  /**
   * The ellipse at a height.
   *
   * @param input The centre, radius and cap.
   * @param y Height, mm.
   * @returns The ellipse, or null where the arm has no root (at and above the shoulder point).
   */
  export function at(input: IInput, y: number): IOval | null {
    const [x, gy, gz]: readonly [number, number, number] = input.glenohumeral;
    const R: number = input.radius;
    if (y >= input.cap.to) return null;

    // Below the centre the centre line runs outward with the abduction and
    // forward with the humerus' forward drift, the arm's own bone.
    if (y <= gy)
      return {
        x: x + (gy - y) * AutoMovieHumanShoulderCap.FORWARD,
        z: gz + (gy - y) * Math.tan(AutoMovieHumanShoulderCap.ABDUCTION),
        rx: R,
        rz: R * AutoMovieHumanShoulderCap.STRETCH,
      };

    // Above it the deltoid cap's ellipse reaches the cap's outline from the fixed centre.
    return AutoMovieHumanDeltoidCap.at({ glenohumeral: input.glenohumeral, outline: input.cap }, y);
  }

  /**
   * The outline's lateral extreme at a height with its slope and curvature:
   * the arm's outer edge below the centre, the cap's fillet above it.
   *
   * @param input The centre, radius and cap.
   * @param y Height, mm.
   * @returns The extreme's jet.
   */
  export function outline(input: IInput, y: number): AutoMovieHumanTrunkSolve.IJet {
    const [, gy, gz]: readonly [number, number, number] = input.glenohumeral;

    if (y >= gy) return input.cap.at(Math.min(y, input.cap.to));
    const tan: number = Math.tan(AutoMovieHumanShoulderCap.ABDUCTION);
    const edge: number = gz + input.radius * AutoMovieHumanShoulderCap.STRETCH;

    return { value: edge + (gy - y) * tan, slope: -tan, curvature: 0 };
  }

  /**
   * The ellipse's curvature at its lateral extreme: `rz / rx^2`, 1/mm.
   *
   * @param oval The ellipse.
   * @returns The curvature.
   */
  export function curvature(oval: IOval): number {
    return oval.rz / (oval.rx * oval.rx);
  }
}
