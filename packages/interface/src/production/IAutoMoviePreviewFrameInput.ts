import { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass";

/**
 * Request one actual current preview frame.
 *
 * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Exposes `IAutoMoviePreviewFrameInput` as the portable data boundary for the agent contract guidance requirement.
 * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Types `IAutoMoviePreviewFrameInput` for the spec authoring knowledge request output system contract.
 */
export interface IAutoMoviePreviewFrameInput {
  /**
   * Exact shot or isolated compiled-model target.
   *
   * Whole-film and sequence review compose current shot frames. Asset review
   * supplies the server-required turntable view so the capture receipt proves
   * which angle and pose was inspected.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Exposes `target` as the portable data boundary for the agent contract guidance requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Types `target` for the spec authoring knowledge request output system contract.
   */
  target:
    | {
        /** Shot target. */
        kind: "shot";
        /** Shot id. */
        id: string;
      }
    | {
        /** Isolated compiled model turntable target. */
        kind: "asset";
        /** Model-recipe id. */
        id: string;
        /** Finite turntable azimuth in degrees. */
        angleDeg: number;
        /** Finite camera elevation in degrees. */
        elevationDeg: number;
        /** Rest or required extreme-range rig pose. */
        pose: "rest" | "rom-extremes";
        /**
         * Compiled part id to frame instead of the whole model, when given.
         *
         * The turntable then fits that one part, which is how a mullion, a
         * hinge, or a hand is looked at without exporting a separate model for
         * it. A framed part is a diagnostic view: the asset review's required
         * turntable is of the whole model and no part view discharges it.
         */
        part?: string;
      };
  /**
   * Finite non-negative shot-local time no later than shot duration. The oracle
   * snaps it to the nearest current production frame. Asset targets derive the
   * canonical turntable time from `angleDeg`, so this field is ignored there.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Exposes `time` as the portable data boundary for the agent contract guidance requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Types `time` for the spec authoring knowledge request output system contract.
   */
  time: number;
  /**
   * Requested render pass, beauty by default.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Exposes `pass` as the portable data boundary for the agent contract guidance requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Types `pass` for the spec authoring knowledge request output system contract.
   */
  pass?: AutoMovieGuidePass;
  /**
   * Optional positive integer width, no larger than production width. Width
   * times height may not exceed 16,777,216 pixels.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Exposes `width` as the portable data boundary for the agent contract guidance requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Types `width` for the spec authoring knowledge request output system contract.
   */
  width?: number;
  /**
   * Optional positive integer height, no larger than production height. Width
   * times height may not exceed 16,777,216 pixels.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Exposes `height` as the portable data boundary for the agent contract guidance requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Types `height` for the spec authoring knowledge request output system contract.
   */
  height?: number;
}
