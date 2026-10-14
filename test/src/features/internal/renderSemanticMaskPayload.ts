import { IAutoMovieSemanticMask } from "@automovie/interface";
/** Project the declared mask fields while borrowing entries and gaps and omitting its self digest; no validation, canonicalization or copy of nested records occurs. */
export const renderSemanticMaskPayload: (mask: IAutoMovieSemanticMask) => Omit<IAutoMovieSemanticMask, "digest"> = (
  mask: IAutoMovieSemanticMask,
): Omit<IAutoMovieSemanticMask, "digest"> => ({
  version: mask.version,
  protocol: mask.protocol,
  background: mask.background,
  entries: mask.entries,
  unaddressed: mask.unaddressed,
});
