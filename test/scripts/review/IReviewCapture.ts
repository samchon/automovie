/**
 * One actual frame identified without storing its pixels in the record.
 * Digests identify observations and do not certify correct appearance.
 * @author Samchon
 */
export interface IReviewCapture {
  /** Applied document state, including any body isolation suffix. */
  state: string;

  /** Named camera view used for this frame. */
  view: string;

  /** Rendering pass used for this frame. */
  pass: string;

  /** PNG filename relative to the run's selected output directory. */
  file: string;

  /** Lowercase SHA-256 computed from the actual PNG bytes by the record builder. */
  sha256: string;

  /** Source digest reported by this frame's render response, not a Git marker. */
  revision: string;

  /** Unmasked device string reported by this same render response. */
  renderer: string;
}
