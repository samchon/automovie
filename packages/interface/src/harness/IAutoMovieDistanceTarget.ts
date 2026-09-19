import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * A scene-only distance endpoint: no rig or relative direction required.
 *
 * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-focus-distance Exposes `IAutoMovieDistanceTarget` as the portable data boundary for the camera focus distance requirement.
 * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `IAutoMovieDistanceTarget` for the clv focus intent appearance boundary system contract.
 */
export type IAutoMovieDistanceTarget = Extract<
  IAutoMovieActionTarget,
  { kind: "node" | "point" | "group" }
>;
