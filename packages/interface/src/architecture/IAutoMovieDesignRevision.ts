import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";

/** One immutable state of the authored design source. */
export interface IAutoMovieDesignRevision {
  /** Stable revision identity within the lineage. */
  id: string;

  /** Revision this one supersedes, or null for the first. */
  parent: string | null;

  /** SHA-256 over the authored source this revision names. */
  digest: AutoMovieContentDigest;
}
