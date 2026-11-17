import type { IAutoMovieHumanHandScales } from "./IAutoMovieHumanHandScales";
import type { IAutoMovieHumanHandWrist } from "./IAutoMovieHumanHandWrist";

/**
 * Knuckle skin breadth and girth targets and the arm constructor used to measure them. Runtime construction and admission remain with AutoMovieHumanHandSkinTargets in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes knuckle skin breadth and girth targets and the arm constructor used to measure them; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Knuckle skin breadth and girth targets and the arm constructor used to measure them. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanHandSkinTargets; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing HandSkinTargets contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanHandSkinTargets {
  /**
   * Construct the candidate arm/wrist for the supplied hand scales so skinTargets can measure the resulting knuckle skin. The callback must use those trial scales; the caller owns the repeated measurement and target adjustment.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Construct the candidate arm/wrist for the supplied hand scales so skinTargets can measure the resulting knuckle skin. The callback must use those trial scales; the caller owns the repeated measurement and target adjustment.
   * @evidence contracts/development/design.md#principled-representation Construct the candidate arm/wrist for the supplied hand scales so skinTargets can measure the resulting knuckle skin. The callback must use those trial scales; the caller owns the repeated measurement and target adjustment.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHandSkinTargets.SkinTargetsMakeArm is the canonical exchange used by AutoMovieHumanHandSkinTargets.skinTargets.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias retains the existing AutoMovieHumanHandSkinTargets input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
   */
  export type SkinTargetsMakeArm = (
    measures: IAutoMovieHumanHandScales,
  ) => IAutoMovieHumanHandWrist;

  /**
   * Knuckle section breadth and girth targets in millimetres for the hand solve. These include the correction measured on the actual palm and web skin, in the canonical left frame shared by reflected sides.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Knuckle section breadth and girth targets in millimetres for the hand solve. These include the correction measured on the actual palm and web skin, in the canonical left frame shared by reflected sides.
   * @evidence contracts/development/design.md#principled-representation Knuckle section breadth and girth targets in millimetres for the hand solve. These include the correction measured on the actual palm and web skin, in the canonical left frame shared by reflected sides.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHandSkinTargets.ISkinTargetsResult is the canonical exchange used by AutoMovieHumanHandSkinTargets.skinTargets, AutoMovieHumanHandSolve.solve.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias retains the existing AutoMovieHumanHandSkinTargets input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
   */
  export type ISkinTargetsResult = {
    /** Target skin breadth over the knuckles, millimetres. */
    breadth: number;
    /** Target skin tape around the knuckles, millimetres. */
    girth: number;
  };
}
