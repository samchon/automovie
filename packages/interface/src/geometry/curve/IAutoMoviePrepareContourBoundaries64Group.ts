

/**
 * Shared slab-group view used by source interaction refinement and slit preparation.
 * The same group object keys the preparation result's interaction map.
 *
 * @evidence contracts/development/design.md#principled-representation Lower and upper side-local ring ordinals remain separate; an optional reason preserves local omission without removing the group.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepareAutoMovieContourBoundaries64 needs only side selections and a mutable reason while preserving richer caller group data through its generic subtype.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unsupported source rings propagate their reason and skip the group rather than being substituted or rematched.
 * @evidence contracts/development/common.md#meaningful-documentation States index domains, shared object identity and mutation of local refusal reasons.
 */
export interface IAutoMoviePrepareContourBoundaries64Group {
  /** Local ring indices in the lower section rings[k-1]; an empty side is permitted for declared terminal incidence. */
  a: number[];
  /** Local ring indices in the upper section rings[k]; preserves the declared group correspondence. */
  b: number[];
  /** Mutable local omission reason. Preparation fills it from the first unsupported incident ring when no prior reason exists, then skips this group. */
  unsupported?: string;
}
