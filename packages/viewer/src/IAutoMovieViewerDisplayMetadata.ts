/**
 * Facts from the owner of an actually completed interactive display.
 * Application identity and requested values remain separate from observations.
 * This transport record establishes no review acceptance.
 *
 * @author Samchon
 */
export interface IAutoMovieViewerDisplayMetadata {
  /** Actual loaded application source identity. */
  revision: string;

  /** Native device reported by the completed producer. */
  renderer: string;

  /** Application-owned displayed document, model, pass and view identity. */
  address: object;

  /** Actual camera pose and projection sampled at completion. */
  camera: object;
  /** Separately identified requests or other application-owned facts. */
  [key: string]: unknown;
}
