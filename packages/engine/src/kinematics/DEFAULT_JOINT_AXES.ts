import { IAutoMovieJointAxes } from "./IAutoMovieJointAxes";

/**
 * The default clinical basis: flexion→X, abduction→Z, twist→Y.
 *
 * @evidence requirements/asset-authoring/rig-and-state.md#asset-rig-basis-controls Supplies a stable fallback basis for rigs without per-bone overrides.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Keeps semantic controls deterministic when a rig omits an axis table.
 */
export const DEFAULT_JOINT_AXES: IAutoMovieJointAxes = {
  flexion: { x: 1, y: 0, z: 0 },
  abduction: { x: 0, y: 0, z: 1 },
  twist: { x: 0, y: 1, z: 0 },
};
