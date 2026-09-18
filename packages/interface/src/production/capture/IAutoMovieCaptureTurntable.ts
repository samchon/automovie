/**
 * Result of capturing the complete review-required turntable of one asset.
 *
 * Every view carries the same proof one captured frame carries: current
 * compilation, decoded pixels, runtime identity, and a receipt the frame
 * reopens through. What this adds is completeness. The asset review requires an
 * exact view set, and reproducing it by hand is where a reviewer silently
 * skipped the angle that would have shown the defect.
 *
 * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence Exposes `IAutoMovieCaptureTurntable` as the portable data boundary for the agent host evidence requirement.
 * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types `IAutoMovieCaptureTurntable` for the spec authoring host evidence output system contract.
 * @author Samchon
 */
export namespace IAutoMovieCaptureTurntable {
  /**
   * One complete asset turntable request.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence Names the asset whose host evidence set is requested.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types the request the host evidence boundary accepts.
   * @author Samchon
   */
  export interface IProps {
    /**
     * Optional production namespace; required when the host has no default.
     *
     * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence Selects the production the host evidence is produced in.
     * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types the production scope of the request.
     */
    productionId?: string;

    /**
     * Registry-owned asset id.
     *
     * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence Names the registry target the host opens.
     * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types the requested evidence target.
     */
    asset: string;

    /**
     * Optional positive integer width no larger than production width.
     *
     * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence Bounds the raster the host renders each view at.
     * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types the requested raster width.
     */
    width?: number;

    /**
     * Optional positive integer height no larger than production height.
     *
     * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence Bounds the raster the host renders each view at.
     * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types the requested raster height.
     */
    height?: number;
  }
}
