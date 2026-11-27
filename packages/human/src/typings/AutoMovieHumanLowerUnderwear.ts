import type { AutoMovieHumanLowerUnderwear as AutoMovieHumanLowerUnderwearContract } from "@automovie/interface";

/** Closed lower underwear choices; serialized values are unchanged. */
export namespace AutoMovieHumanLowerUnderwear {
  /** No lower undergarment requested. */
  export const None: "none" = "none" satisfies
    AutoMovieHumanLowerUnderwearContract;
  /** Brief-style lower covering requested. */
  export const Briefs: "briefs" = "briefs" satisfies
    AutoMovieHumanLowerUnderwearContract;
  /** Boxer-brief lower covering requested, including upper-thigh coverage. */
  export const BoxerBriefs: "boxerBriefs" = "boxerBriefs" satisfies
    AutoMovieHumanLowerUnderwearContract;
}
