import type { AutoMovieHumanExpressionSide as AutoMovieHumanExpressionSideContract } from "@automovie/interface";

/** Closed expression side choices; serialized values are unchanged. */
export const AutoMovieHumanExpressionSide = {
  /** Apply this action unit to both anatomical sides. */
  Both: "both",
  /** Apply this action unit to the person's anatomical left side. */
  Left: "left",
  /** Apply this action unit to the person's anatomical right side. */
  Right: "right",
} as const satisfies Readonly<
  Record<string, AutoMovieHumanExpressionSideContract>
>;
