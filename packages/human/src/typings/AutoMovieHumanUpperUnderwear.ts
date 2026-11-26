import type { AutoMovieHumanUpperUnderwear as AutoMovieHumanUpperUnderwearContract } from "@automovie/interface";

/** Closed upper underwear choices; serialized values are unchanged. */
export const AutoMovieHumanUpperUnderwear = {
  /** No upper undergarment requested. */
  None: "none",
  /** Bra covering requested; sizing and material are separate appearance concerns. */
  Bra: "bra",
} as const satisfies Readonly<
  Record<string, AutoMovieHumanUpperUnderwearContract>
>;
