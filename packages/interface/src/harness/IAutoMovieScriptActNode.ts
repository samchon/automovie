import { IAutoMovieActPayload } from "./IAutoMovieActPayload";
import { IAutoMovieScriptNodeBase } from "./IAutoMovieScriptNodeBase";

/**
 * A dramatic act.
 *
 * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-focus-distance Exposes `IAutoMovieScriptActNode` as the portable data boundary for the camera focus distance requirement.
 * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `IAutoMovieScriptActNode` for the clv focus intent appearance boundary system contract.
 */
export interface IAutoMovieScriptActNode extends IAutoMovieScriptNodeBase {
  /**
   * Discriminator.
   *
   * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-focus-distance Exposes `kind` as the portable data boundary for the camera focus distance requirement.
   * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `kind` for the clv focus intent appearance boundary system contract.
   */
  kind: "act";

  /**
   * What this level of thought carries.
   *
   * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-focus-distance Exposes `payload` as the portable data boundary for the camera focus distance requirement.
   * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `payload` for the clv focus intent appearance boundary system contract.
   */
  payload: IAutoMovieActPayload;
}
