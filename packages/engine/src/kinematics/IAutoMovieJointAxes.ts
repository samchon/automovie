import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The bone-local axes the three clinical angles rotate about. Lets a rig whose
 * bone frames are not aligned to the default clinical planes (e.g. a T-pose arm
 * pointing along its local X) declare which local axis flexion / abduction /
 * twist each swing, so "flexion" stays anatomically sagittal instead of rolling
 * the bone along its length.
 *
 * @evidence requirements/asset-authoring/rig-and-state.md#asset-rig-basis-controls Represents the local basis behind the rig's named articulation controls.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Defines how semantic controls enter the rig's rotation graph.
 */
export interface IAutoMovieJointAxes {
  /**
   * Axis `flexion` rotates about (sagittal).
   *
   * @evidence requirements/asset-authoring/rig-and-state.md#asset-rig-basis-controls Names the local axis assigned to the flexion control.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Binds flexion input to its bone-local rotation axis.
   */
  flexion: IAutoMovieVector3;
  /**
   * Axis `abduction` rotates about (frontal).
   *
   * @evidence requirements/asset-authoring/rig-and-state.md#asset-rig-basis-controls Names the local axis assigned to the abduction control.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Binds abduction input to its bone-local rotation axis.
   */
  abduction: IAutoMovieVector3;
  /**
   * Axis `twist` rotates about (the bone's long axis).
   *
   * @evidence requirements/asset-authoring/rig-and-state.md#asset-rig-basis-controls Names the local axis assigned to the twist control.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Binds twist input to its bone-local rotation axis.
   */
  twist: IAutoMovieVector3;
}
