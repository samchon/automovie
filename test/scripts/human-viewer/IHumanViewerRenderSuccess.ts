/**
 * A current frame with the authority reported by its render response.
 * These headers identify the observation, not the correctness of its appearance.
 * @author Samchon
 */
export interface IHumanViewerRenderSuccess {
  /** Successful current-frame discriminator. */
  ok: true;

  /** PNG response bytes owned by this result; recording and writing only read them. */
  bytes: Buffer;

  /** Unmasked device string reported by this response, without a health fallback. */
  renderer: string;

  /** Actual response source digest from X-Human-Revision, not a Git commit marker. */
  revision: string;
}
