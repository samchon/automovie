import { AutoMovieGuidePass } from "../../cinematics/AutoMovieGuidePass";

/**
 * One view an asset review must be able to see before it can complete.
 *
 * The set is declared by the review contract rather than by the caller, so a
 * turntable request cannot under-cover the asset by choosing convenient angles.
 *
 * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence Exposes `IAutoMovieAssetTurntableView` as the portable data boundary for the host evidence one asset review view carries.
 * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types the per-view host evidence result the tool boundary returns.
 * @author Samchon
 */
export interface IAutoMovieAssetTurntableView {
  /**
   * Stable view id the asset review inventories, such as `turntable-front`.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence Names which required view this host evidence answers for.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types the view identity the evidence output carries.
   */
  id: string;

  /**
   * Turntable azimuth in degrees.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence States the azimuth the host actually opened this view from.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types the azimuth the evidence output carries.
   */
  angleDeg: number;

  /**
   * Camera elevation in degrees.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence States the elevation the host actually opened this view from.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types the elevation the evidence output carries.
   */
  elevationDeg: number;

  /**
   * Rig pose the view was opened in.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence States which rig pose this host evidence shows.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types the pose the evidence output carries.
   */
  pose: "rest" | "rom-extremes";

  /**
   * Render pass the view was captured in.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence States which render pass this host evidence shows.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types the pass the evidence output carries.
   */
  pass: AutoMovieGuidePass;

  /**
   * Project-relative PNG path, or null when this view was refused.
   *
   * A null path is not a gap the caller may fill by choosing another angle. The
   * diagnostic naming this view states what to correct.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence Points at the verified host pixels, or states that this view produced none.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types the committed evidence path the tool boundary returns.
   */
  frame: string | null;
}
