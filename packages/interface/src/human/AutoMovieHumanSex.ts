/**
 * Sex category associated with requested reference statistics.
 *
 * This category distinguishes female and male population statistics. It does not specify detailed body measurements or the continuous masculine/feminine shape coordinate.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Sex category associated with requested reference statistics.
 * @evidence contracts/development/design.md#principled-representation Closed female/male categories select reference statistics; they supply neither measured dimensions nor the continuous shape coordinate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns the vocabulary. BodyAnatomy.sexOf selects the category; survey laws index female/male coefficients from it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Two categories express the existing survey datasets, not a restriction on independently authored body measurements.
 */
export type AutoMovieHumanSex =
  /** Female population statistics. */
  | "female"
  /** Male population statistics. */
  | "male";
