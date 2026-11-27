import type {
  IAutoMovieRecoveryInput,
  IAutoMovieRecoverySavedSection,
  IAutoMovieRecoverySlabPair,
} from "..";

/**
 * Reobserve source slabs while referring to existing coefficient publications.
 * Every supplied saved plane is recut once without fitting, and all requested
 * slab components remain present. Source identities are caller assertions: the
 * caller verifies original bytes, registration and selection before this call.
 * Raw-cut equality cannot establish a named curve's geometric correctness.
 */
export interface IAutoMovieRecoverySlabsInput extends Pick<
  IAutoMovieRecoveryInput,
  "verticesMm" | "triangles" | "axis" | "reference" | "exactCoordinateAliases"
> {
  /**
   * Identity of this new acquisition-only observation, not a replacement curve
   * collection.
   */
  name: string;

  /**
   * Caller-verified original source identity, compared with every saved
   * section.
   */
  sourceIdentity: string;

  /** Caller-verified registration/selection/original-ordinal identity. */
  sourceSelectionIdentity: string;

  /**
   * Distinct finite saved planes in their preserved section-index order; every
   * supplied plane is recut, including empty and unsupported contours.
   */
  savedSections: readonly IAutoMovieRecoverySavedSection[];

  /**
   * Nonempty finite increasing pairs whose endpoints both name supplied saved
   * sections.
   */
  slabPairs: readonly IAutoMovieRecoverySlabPair[];
}
