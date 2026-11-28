import type {
  IAutoMovieRecoveryInput,
  IAutoMovieRecoverySavedSection,
  IAutoMovieRecoverySlabPair,
} from "..";

/**
 * Caller-attested section artifact and source request for exact slab
 * observation.
 */
export interface IAutoMovieRecoverySlabsInput extends Pick<
  IAutoMovieRecoveryInput,
  "verticesMm" | "triangles" | "axis" | "reference" | "exactCoordinateAliases"
> {
  /** Caller label for the new slab observation collection. */
  name: string;

  /** Caller-verified string identifying the registered source. */
  sourceIdentity: string;

  /**
   * Caller-verified string identifying the selected original source ordinal
   * space.
   */
  sourceSelectionIdentity: string;

  /**
   * Caller-bound saved section records providing exact contour lineage and
   * observed closure.
   */
  savedSections: readonly IAutoMovieRecoverySavedSection[];

  /** Requested increasing cut pairs referencing saved section coordinates. */
  slabPairs: readonly IAutoMovieRecoverySlabPair[];
}
