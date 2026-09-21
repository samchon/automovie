import { IAutoMovieGroupPayload } from "./IAutoMovieGroupPayload";
import { IAutoMovieScriptNodeBase } from "./IAutoMovieScriptNodeBase";

/**
 * A grouping of siblings (a montage, an exchange).
 *
 * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-focus-distance Exposes `IAutoMovieScriptGroupNode` as the portable data boundary for the camera focus distance requirement.
 * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `IAutoMovieScriptGroupNode` for the clv focus intent appearance boundary system contract.
 */
export interface IAutoMovieScriptGroupNode extends IAutoMovieScriptNodeBase {
  /**
   * Discriminator.
   *
   * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-focus-distance Exposes `kind` as the portable data boundary for the camera focus distance requirement.
   * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `kind` for the clv focus intent appearance boundary system contract.
   */
  kind: "group";

  /**
   * What this level of thought carries.
   *
   * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-focus-distance Exposes `payload` as the portable data boundary for the camera focus distance requirement.
   * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `payload` for the clv focus intent appearance boundary system contract.
   */
  payload: IAutoMovieGroupPayload;
}
