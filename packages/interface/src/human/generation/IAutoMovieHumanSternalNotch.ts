/**
 * The height-to-forward-position profile callback supplied to notch-frame construction. Runtime construction and admission remain with AutoMovieHumanSternalNotch in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the height-to-forward-position profile callback supplied to notch-frame construction; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation The height-to-forward-position profile callback supplied to notch-frame construction. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanSternalNotch; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing SternalNotch contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanSternalNotch {
  /**
   * Front-midline forward coordinate at world height y, both in millimetres in the trunk frame. The notch-frame constructor reads this profile beneath the neck ring.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Front-midline forward coordinate at world height y, both in millimetres in the trunk frame. The notch-frame constructor reads this profile beneath the neck ring.
   * @evidence contracts/development/design.md#principled-representation Front-midline forward coordinate at world height y, both in millimetres in the trunk frame. The notch-frame constructor reads this profile beneath the neck ring.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanSternalNotch.FrameFront is the canonical exchange used by AutoMovieHumanSternalNotch.frame.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias retains the existing AutoMovieHumanSternalNotch input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
   */
  export type FrameFront = (y: number) => number;
}
