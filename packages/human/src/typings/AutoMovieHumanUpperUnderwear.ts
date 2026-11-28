import type { AutoMovieHumanUpperUnderwear as AutoMovieHumanUpperUnderwearContract } from "@automovie/interface";

/**
 * Upper garment labels for the underwear record.
 *
 * Set `top` explicitly. The same record supplies `bottom` and the garment
 * color.
 */
export namespace AutoMovieHumanUpperUnderwear {
  /** Request no upper garment. */
  export const None: "none" = "none" satisfies
    AutoMovieHumanUpperUnderwearContract;
  /** Request a bra as the upper garment. */
  export const Bra: "bra" = "bra" satisfies
    AutoMovieHumanUpperUnderwearContract;
}
