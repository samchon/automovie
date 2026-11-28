import type { AutoMovieHumanLowerUnderwear as AutoMovieHumanLowerUnderwearContract } from "@automovie/interface";

/**
 * Lower garment labels for the underwear record.
 *
 * Set `bottom` explicitly. The same record supplies `top` and the garment
 * color.
 */
export namespace AutoMovieHumanLowerUnderwear {
  /** Request no lower garment. */
  export const None: "none" = "none" satisfies
    AutoMovieHumanLowerUnderwearContract;
  /** Request a brief-style lower garment. */
  export const Briefs: "briefs" = "briefs" satisfies
    AutoMovieHumanLowerUnderwearContract;
  /** Request a boxer-brief lower garment. */
  export const BoxerBriefs: "boxerBriefs" = "boxerBriefs" satisfies
    AutoMovieHumanLowerUnderwearContract;
}
