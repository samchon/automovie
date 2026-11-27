import type { AutoMovieHumanUpperUnderwear as AutoMovieHumanUpperUnderwearContract } from "@automovie/interface";

/** Closed upper underwear choices; serialized values are unchanged. */
export namespace AutoMovieHumanUpperUnderwear {
  /** No upper undergarment requested. */
  export const None: "none" = "none" satisfies
    AutoMovieHumanUpperUnderwearContract;
  /** Bra covering requested; sizing and material are separate appearance concerns. */
  export const Bra: "bra" = "bra" satisfies
    AutoMovieHumanUpperUnderwearContract;
}
