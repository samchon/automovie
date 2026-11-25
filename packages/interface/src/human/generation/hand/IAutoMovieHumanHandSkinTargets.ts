import type { IAutoMovieHumanHandScales } from "./IAutoMovieHumanHandScales";
import type { IAutoMovieHumanHandWrist } from "./IAutoMovieHumanHandWrist";

/**
 * Knuckle skin breadth and girth targets and the arm constructor used to
 * measure them. Runtime construction and admission remain with
 * AutoMovieHumanHandSkinTargets in Human.
 */
export namespace IAutoMovieHumanHandSkinTargets {
  /**
   * Construct the candidate arm/wrist for the supplied hand scales so
   * skinTargets can measure the resulting knuckle skin. The callback must use
   * those trial scales; the caller owns the repeated measurement and target
   * adjustment.
   */
  export type SkinTargetsMakeArm = (
    measures: IAutoMovieHumanHandScales,
  ) => IAutoMovieHumanHandWrist;

  /**
   * Knuckle section breadth and girth targets in millimetres for the hand
   * solve. These include the correction measured on the actual palm and web
   * skin, in the canonical left frame shared by reflected sides.
   */
  export type ISkinTargetsResult = {
    /** Target skin breadth over the knuckles, millimetres. */
    breadth: number;
    /** Target skin tape around the knuckles, millimetres. */
    girth: number;
  };
}
