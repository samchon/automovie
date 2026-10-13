import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { AutoMovieVisualChangeStatus } from "./AutoMovieVisualChangeStatus";

/**
 * One deterministic subject-view comparison result.
 *
 * @author Samchon
 */
export interface IAutoMovieVisualChange {
  /** Stable subject identity shared with the snapshot records. */
  subject: string;

  /** Stable view identity shared with the snapshot records. */
  view: string;

  /** Exactly one of the four visual change states. */
  status: AutoMovieVisualChangeStatus;

  /** Earlier digest, or null when this view is new. */
  before: AutoMovieContentDigest | null;

  /** Later digest, or null when this view is gone. */
  after: AutoMovieContentDigest | null;
}
