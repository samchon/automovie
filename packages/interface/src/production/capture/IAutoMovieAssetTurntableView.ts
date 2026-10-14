import { AutoMovieGuidePass } from "../../cinematics/AutoMovieGuidePass";

/**
 * One asset-review view descriptor with an optional captured-frame path.
 *
 * The former review-view factory and turntable-capture producer have been removed; this record itself creates or verifies no image.
 *
 * @evidence contracts/common.md#principled-implementation Stable view id, degree angles, pose and pass describe one intended view. The nullable path preserves the retained turntable result contract without claiming an active captured-row producer.
 * @evidence contracts/common.md#clear-and-simple-design View descriptors and optional image paths remain separate from full receipt and byte provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A path or descriptor population is not visual approval or verified pixels; this type performs no view selection, compiled-rig lookup or refusal recovery.
 * @evidence contracts/common.md#meaningful-documentation Defines view identity, degree units, pose, pass and nullable path, and states that the former producers are absent.
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
