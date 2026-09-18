import { IAutoMovieAxisFrame } from "./IAutoMovieAxisFrame";

/**
 * A bone's per-axis rest frame; an omitted axis is the identity (sign 1, 0).
 *
 * @evidence requirements/asset-authoring/rig-and-state.md#asset-rig-basis-controls Groups the semantic control conversions owned by one bone rest frame.
 * @evidence specifications/asset-and-representation/rig-deformation-and-state.md#asset-spec-rig-inputs Represents the optional rest-basis mapping supplied with rig input.
 */
export interface IAutoMovieRestFrame {
  /**
   * Rest-frame mapping for the flexion axis.
   *
   * @evidence requirements/asset-authoring/rig-and-state.md#asset-rig-basis-controls Reconciles the named flexion control with its rest-relative rig value.
   * @evidence specifications/asset-and-representation/rig-deformation-and-state.md#asset-spec-rig-inputs Carries the optional flexion rest-basis conversion.
   */
  flexion?: IAutoMovieAxisFrame;
  /**
   * Rest-frame mapping for the abduction axis.
   *
   * @evidence requirements/asset-authoring/rig-and-state.md#asset-rig-basis-controls Reconciles the named abduction control with its rest-relative rig value.
   * @evidence specifications/asset-and-representation/rig-deformation-and-state.md#asset-spec-rig-inputs Carries the optional abduction rest-basis conversion.
   */
  abduction?: IAutoMovieAxisFrame;
  /**
   * Rest-frame mapping for the twist axis.
   *
   * @evidence requirements/asset-authoring/rig-and-state.md#asset-rig-basis-controls Reconciles the named twist control with its rest-relative rig value.
   * @evidence specifications/asset-and-representation/rig-deformation-and-state.md#asset-spec-rig-inputs Carries the optional twist rest-basis conversion.
   */
  twist?: IAutoMovieAxisFrame;
}
