import { AutoMovieGuidePass } from "../../cinematics/AutoMovieGuidePass";

/**
 * One asset-review view descriptor with an optional captured-frame path.
 *
 * Production's IAutoMovieAssetReviewView omits frame and its factory returns the fixed rest or rigged descriptor population. The former turntable-capture producer has been removed; this record itself creates or verifies no image.
 *
 * @evidence contracts/common.md#principled-implementation Stable view id, degree angles, pose and pass form the descriptor consumed through Production's frame-omitting review type. The nullable path preserves the retained result contract without claiming an active captured-row producer.
 * @evidence contracts/common.md#clear-and-simple-design Descriptor fields are shared with the current review-view factory; image paths remain separate from full receipt and byte provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A path or descriptor population is not visual approval or verified pixels. Rigged view selection is an explicit factory input, and this type performs no compiled-rig lookup or refusal recovery.
 * @evidence contracts/common.md#meaningful-documentation Defines view identity, degree units, pose, pass, nullable path, live descriptor consumption and absent turntable-capture production.
 * @author Samchon
 */
export interface IAutoMovieAssetTurntableView {
  /** Stable view id the asset review inventories, such as `turntable-front`. */
  id: string;

  /** Turntable azimuth in degrees. */
  angleDeg: number;

  /** Camera elevation in degrees. */
  elevationDeg: number;

  /** Rig pose the view was opened in. */
  pose: "rest" | "rom-extremes";

  /** Render pass the view was captured in. */
  pass: AutoMovieGuidePass;

  /**
   * Intended project-relative PNG path, or null when no captured frame is supplied.
   *
   * Neither a nonnull path nor a null value carries an independent byte, receipt or diagnostic verification.
   */
  frame: string | null;
}
