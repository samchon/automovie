import { AutoMovieGuidePass } from "../../cinematics/AutoMovieGuidePass";

/**
 * One view an asset review must be able to see before it can complete.
 *
 * The review contract supplies the required view set; the caller cannot reduce coverage by choosing convenient angles.
 *
 * @evidence contracts/common.md#principled-implementation captureAutoMovieProductionTurntable derives the exact rig-dependent review views and captures each through the same current-frame and receipt-reopen path, retaining a null frame for any refused view.
 * @evidence contracts/common.md#clear-and-simple-design View identity and camera/pass parameters sit beside the resulting PNG path, exposing complete required coverage without copying the full receipt into each summary row.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A refused view cannot be replaced by another angle, and extreme-range views are chosen from the actual compiled rig rather than treating an unreadable model as unrigged.
 * @evidence contracts/common.md#meaningful-documentation Defines required view identity, degree angles, rig pose, render pass and refusal-null path with view-specific correction diagnostics.
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
   * Project-relative PNG path, or null when this view was refused.
   *
   * A null path is not a gap the caller may fill by choosing another angle. The diagnostic naming this view states what to correct.
   */
  frame: string | null;
}
