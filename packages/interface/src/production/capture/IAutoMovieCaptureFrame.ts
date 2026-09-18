import { AutoMovieCaptureTarget } from "./AutoMovieCaptureTarget";

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
