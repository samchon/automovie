import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * One stable rendered observation in a named revision snapshot.
 *
 * The record deliberately carries only the identity needed to join the same
 * view across revisions and the digest a producer already verified. It is not
 * review evidence and does not prescribe how a camera or subject is produced.
 *
 * @author Samchon
 */
export interface IAutoMovieVisualRevisionView {
  /**
   * Stable namespaced subject identity, such as a shot or compiled subject id.
   */
  subject: string;

  /**
   * Stable catalog-local view identity. A different viewpoint, time, pass, or
   * presentation basis requires a different identity.
   */
  view: string;

  /** Exact digest of the already-produced image bytes. */
  digest: AutoMovieContentDigest;
}
