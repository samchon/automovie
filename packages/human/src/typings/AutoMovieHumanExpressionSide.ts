import type { AutoMovieHumanExpressionSide as AutoMovieHumanExpressionSideContract } from "@automovie/interface";

/** Closed expression side choices; serialized values are unchanged. */
export namespace AutoMovieHumanExpressionSide {
  /** Apply this action unit to both anatomical sides. */
  export const Both: "both" = "both" satisfies
    AutoMovieHumanExpressionSideContract;
  /** Apply this action unit to the person's anatomical left side. */
  export const Left: "left" = "left" satisfies
    AutoMovieHumanExpressionSideContract;
  /** Apply this action unit to the person's anatomical right side. */
  export const Right: "right" = "right" satisfies
    AutoMovieHumanExpressionSideContract;
}
