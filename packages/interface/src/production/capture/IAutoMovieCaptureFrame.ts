import { AutoMovieCaptureTarget } from "./AutoMovieCaptureTarget";
import { AutoMovieGuidePass } from "../../cinematics/AutoMovieGuidePass";
import { AutoMovieContentDigest } from "../AutoMovieContentDigest";
import { IAutoMovieDiagnostic } from "../IAutoMovieDiagnostic";
import { IAutoMovieReviewTarget } from "../IAutoMovieReviewTarget";
import { IAutoMovieCaptureReceipt } from "./IAutoMovieCaptureReceipt";

/**
 * Result of producing one actual current evidence frame.
 *
 * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence Exposes `IAutoMovieCaptureFrame` as the portable data boundary for the agent host evidence requirement.
 * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types `IAutoMovieCaptureFrame` for the spec authoring host evidence output system contract.
 */
export interface IAutoMovieCaptureFrame {
  /**
   * True only after decoded pixels and their receipt are atomically committed.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence Exposes `captured` as the portable data boundary for the agent host evidence requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types `captured` for the spec authoring host evidence output system contract.
   */
  captured: boolean;

  /**
   * Production namespace used for the attempt.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence Exposes `productionId` as the portable data boundary for the agent host evidence requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types `productionId` for the spec authoring host evidence output system contract.
   */
  productionId: string;

  /**
   * Review surface whose current evidence changed, when captured.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence Exposes `reviewTarget` as the portable data boundary for the agent host evidence requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types `reviewTarget` for the spec authoring host evidence output system contract.
   */
  reviewTarget: IAutoMovieReviewTarget | null;

  /**
   * Verified receipt, or null on refusal.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence Exposes `receipt` as the portable data boundary for the agent host evidence requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types `receipt` for the spec authoring host evidence output system contract.
   */
  receipt: IAutoMovieCaptureReceipt | null;

  /**
   * Verified current PNG, or null on refusal.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence Exposes `frame` as the portable data boundary for the agent host evidence requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types `frame` for the spec authoring host evidence output system contract.
   */
  frame: {
    /** Snapped frame index. */
    index: number;

    /** Snapped time in seconds. */
    time: number;

    /** Captured pass. */
    pass: AutoMovieGuidePass;

    /** Project-relative PNG path. */
    path: string;

    /** Exact PNG digest. */
    digest: AutoMovieContentDigest;

    /** Decoded pixel width. */
    width: number;

    /** Decoded pixel height. */
    height: number;
  } | null;

  /**
   * Exact refusal diagnostics, empty on success.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence Exposes `diagnostics` as the portable data boundary for the agent host evidence requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types `diagnostics` for the spec authoring host evidence output system contract.
   */
  diagnostics: IAutoMovieDiagnostic[];
}

/**
 * Result of producing one actual current evidence frame.
 *
 * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence Exposes `IAutoMovieCaptureFrame` as the portable data boundary for the agent host evidence requirement.
 * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types `IAutoMovieCaptureFrame` for the spec authoring host evidence output system contract.
 */
export namespace IAutoMovieCaptureFrame {
  /**
   * One actual evidence-frame request.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence Exposes `IProps` as the portable data boundary for the agent host evidence requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types `IProps` for the spec authoring host evidence output system contract.
   */
  export interface IProps {
    /**
     * Compiler-registry target and its frame identity.
     *
     * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence Exposes `target` as the portable data boundary for the agent host evidence requirement.
     * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types `target` for the spec authoring host evidence output system contract.
     */
    target: AutoMovieCaptureTarget;

    /**
     * Optional positive integer width no larger than production width.
     *
     * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence Exposes `width` as the portable data boundary for the agent host evidence requirement.
     * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types `width` for the spec authoring host evidence output system contract.
     */
    width?: number;

    /**
     * Optional positive integer height no larger than production height.
     *
     * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence Exposes `height` as the portable data boundary for the agent host evidence requirement.
     * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types `height` for the spec authoring host evidence output system contract.
     */
    height?: number;
  }
}
