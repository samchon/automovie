/**
 * One authored identity for a recorded design-source state.
 *
 * The digest is authored: validation checks its `sha256:` form, and nothing
 * hashes the source to confirm it. Several revisions may have a null parent,
 * and a revision names at most one parent, so a merge of two revisions is not
 * representable.
 */
export interface IAutoMovieDesignRevision {
  /** Stable, non-blank revision identity, unique within the lineage. */
  id: string;

  /**
   * Revision this one supersedes, or null for a first one; the parent chain
   * must not loop.
   */
  parent: string | null;

  /** SHA-256 over the authored source this revision names. */
  digest: string;
}
