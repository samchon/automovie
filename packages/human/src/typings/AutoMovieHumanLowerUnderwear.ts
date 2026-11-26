import type { AutoMovieHumanLowerUnderwear as AutoMovieHumanLowerUnderwearContract } from "@automovie/interface";

/** Closed lower underwear choices; serialized values are unchanged. */
export const AutoMovieHumanLowerUnderwear = {
  /** No lower undergarment requested. */
  None: "none",
  /** Brief-style lower covering requested. */
  Briefs: "briefs",
  /** Boxer-brief lower covering requested, including upper-thigh coverage. */
  BoxerBriefs: "boxerBriefs",
} as const satisfies Readonly<
  Record<string, AutoMovieHumanLowerUnderwearContract>
>;
