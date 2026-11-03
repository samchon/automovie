import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";

/**
 * The jaw joint's fullness as a relief window ahead of the ear: the condyle
 * and its capsule swell the skin a little in front of the tragion, at the
 * height of the ear's centre, as wide as the cranial base's half breadth
 * allows. Its centre is `joint` millimetres of height under the eye level and
 * at a share of the cranial half breadth, and it grows with the jaw's lateral
 * excursion (the identity's `mandibularLaterotrusion` times the prior's gain).
 *
 * Reads: the skeleton's eye level, scale, breadth and joint fullness, and the
 * cranial base's share of the breadth. Publishes a height in millimetres that
 * vanishes with its slopes at the window's edge.
 */
export namespace AutoMovieHumanHeadJawJoint {
  /** What the joint window reads. */
  export interface IInput {
    /** The landmark skeleton: eye level, scale, head breadth and the joint's fullness. */
    plan: Pick<IAutoMovieHumanHeadLayout, "eye" | "scale" | "breadth" | "joint">;

    /** The cranial base's half breadth over the cranium's, the prior's `frame.base`. */
    base: number;
  }

  /**
   * Height of the joint's swelling at a point.
   *
   * @param input What the window reads.
   * @param y Height of the point.
   * @param a Distance of the point from the midline, `|z|`.
   * @returns Height in millimetres, positive outward.
   */
  export function height(input: IInput, y: number, a: number): number {
    const k: number = input.plan.scale;
    return (
      input.plan.joint *
      AutoMovieHumanHeadMath.bell2(
        (y - input.plan.eye + 42 * k) / (14 * k),
        (a - 0.98 * input.base * (input.plan.breadth / 2)) / (12 * k),
      )
    );
  }
}
