import type { AutoMovieHumanExpressionSide as AutoMovieHumanExpressionSideContract } from "@automovie/interface";

/**
 * Side labels for one facial action unit activation.
 *
 * Use the person's own right and left. Each activation supplies its intensity
 * and side explicitly.
 */
export namespace AutoMovieHumanExpressionSide {
  /** Use the activation intensity on both anatomical sides. */
  export const Both: "both" = "both" satisfies
    AutoMovieHumanExpressionSideContract;
  /** Use the activation intensity on the person's left side. */
  export const Left: "left" = "left" satisfies
    AutoMovieHumanExpressionSideContract;
  /** Use the activation intensity on the person's right side. */
  export const Right: "right" = "right" satisfies
    AutoMovieHumanExpressionSideContract;
}
