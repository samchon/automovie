import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";

/**
 * One immutable state of the authored design source.
 *
 * The digest is authored: validation checks its `sha256:` form, and nothing
 * hashes the source to confirm it. Several revisions may have a null parent,
 * and a revision names at most one parent, so a merge of two revisions is not
 * representable.
 *
 * @author Samchon
 */
export interface IAutoMovieDesignRevision {
  /** Stable revision identity within the lineage. */
  id: string;

  /** Revision this one supersedes, or null for the first. */
  parent: string | null;

  /** SHA-256 over the authored source this revision names. */
  digest: AutoMovieContentDigest;
}
