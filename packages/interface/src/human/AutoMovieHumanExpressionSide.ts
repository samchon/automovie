/** Closed expression side choices; serialized values are unchanged.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Closed expression side choices; serialized values are unchanged.
 * @evidence contracts/development/design.md#principled-representation both/left/right select bilateral or unilateral activation in the person's anatomical frame, independently of camera orientation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns the vocabulary. ActionUnitActivation owns action-unit intensity and reads this side selector.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The single selector excludes contradictory left/right/bilateral flag combinations.
 */
export type AutoMovieHumanExpressionSide =
  /** Apply this action unit to both anatomical sides. */
  | "both"
  /** Apply this action unit to the person's anatomical left side. */
  | "left"
  /** Apply this action unit to the person's anatomical right side. */
  | "right";
