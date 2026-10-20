/**
 * One authored identity for a recorded design-source state.
 *
 * The digest is authored: validation checks its `sha256:` form, and nothing hashes the source to confirm it. Several revisions may have a null parent, and a revision names at most one parent, so a merge of two revisions is not representable.
 *
 * @evidence contracts/common.md#principled-implementation `validateDesignLineage` requires unique non-blank ids, a parent that resolves, a lowercase `sha256:` hex digest, and an acyclic parent chain found by depth-first search; staleness compares a derived artifact's stamp with the lineage head by id.
 * @evidence contracts/common.md#clear-and-simple-design A revision is an id, one optional parent, and a digest, enough to name a state and its predecessor without carrying the source text or a version-control model.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Digest spelling does not authenticate source bytes or enforce immutable records; callers own preserving a revision's meaning. Multiple roots and a head with recorded descendants are allowed, and one parent cannot express a merge. The gate does not prove the head is a unique newest leaf or that every revision reaches it.
 * @evidence contracts/common.md#meaningful-documentation States that the digest is authored and unverified, that several roots are allowed, that merges are unrepresentable, and what a null parent means.
 */
export interface IAutoMovieDesignRevision {
  /** Stable, non-blank revision identity, unique within the lineage. */
  id: string;

  /**
   * Revision this one supersedes, or null for a first one; the parent chain must not loop.
   */
  parent: string | null;

  /** SHA-256 over the authored source this revision names. */
  digest: string;
}
