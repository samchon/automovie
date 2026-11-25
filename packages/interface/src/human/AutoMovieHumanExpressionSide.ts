/** Closed expression side choices; serialized values are unchanged. */
export type AutoMovieHumanExpressionSide =
  /** Apply this action unit to both anatomical sides. */
  | "both"
  /** Apply this action unit to the person's anatomical left side. */
  | "left"
  /** Apply this action unit to the person's anatomical right side. */
  | "right";
