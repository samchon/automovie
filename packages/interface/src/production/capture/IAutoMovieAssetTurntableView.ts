import { AutoMovieGuidePass } from "../../cinematics/AutoMovieGuidePass";

/**
 * One view an asset review must be able to see before it can complete.
 *
 * The set is declared by the review contract rather than by the caller, so a
 * turntable request cannot under-cover the asset by choosing convenient angles.
 *
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
   * A null path is not a gap the caller may fill by choosing another angle. The
   * diagnostic naming this view states what to correct.
   */
  frame: string | null;
}
