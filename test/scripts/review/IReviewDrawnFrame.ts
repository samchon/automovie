/**
 * A rendered frame's pixels and the exact response authority that produced
 * them. Record builders hash these bytes rather than accepting a supplied hash.
 * @author Samchon
 */
export interface IReviewDrawnFrame {
  /** Applied document state, including the isolation suffix for a body frame. */
  state: string;

  /** Named camera view requested from the viewer. */
  view: string;

  /** Requested rendering pass; its visual limitations remain with the pass owner. */
  pass: string;

  /** Frame filename relative to the caller's selected output directory. */
  file: string;

  /** PNG bytes owned by this result; hashing and writing read without mutation. */
  bytes: Uint8Array;

  /** Actual response's unmasked graphics device string. */
  renderer: string;

  /** Source digest returned for this PNG, independent of a Git commit or dirty marker. */
  revision: string;
}
