import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * A reach-query target the geometry context can resolve successfully.
 *
 * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-target-refusal Exposes `IAutoMovieReachTarget` as the portable data boundary for the camera target refusal requirement.
 * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-diagnostics-refusal Types `IAutoMovieReachTarget` for the clv focus diagnostics refusal system contract.
 */
export type IAutoMovieReachTarget = Extract<
  IAutoMovieActionTarget,
  { kind: "node" | "bone" | "point" | "group" }
>;
