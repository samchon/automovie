/**
 * Three fully resolved angular coordinates of one joint, in degrees.
 *
 * All values are numbers: unlike an authored joint pose, none is an omitted
 * axis and this result carries no bone identity. Quaternion decomposition
 * obtains rest-relative coordinates and lifts them through the caller's
 * optional clinical rest frame. The conversion owner determines which frame
 * the numbers use; this record does not declare physiological capacity.
 *
 * @evidence requirements/asset-authoring/rig-and-state.md#asset-rig-basis-controls Carries the three numeric coordinates obtained by decomposing a solved joint rotation.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Preserves fully resolved flexion, abduction and twist through rest-frame conversion without adding nullable authoring semantics.
 * @author Samchon
 */
export interface IAutoMovieResolvedJointAngles {
  /**
   * Resolved flexion/extension coordinate, degrees in the conversion owner's declared frame.
   *
   * @evidence requirements/asset-authoring/rig-and-state.md#asset-rig-basis-controls Carries the numeric flexion coordinate recovered from the solved rotation.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Preserves flexion across the decomposition owner's optional clinical rest-frame lift.
   */
  flexion: number;

  /**
   * Resolved abduction/adduction coordinate, degrees in the same frame.
   *
   * @evidence requirements/asset-authoring/rig-and-state.md#asset-rig-basis-controls Carries the numeric abduction coordinate recovered from the solved rotation.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Preserves abduction across the decomposition owner's optional clinical rest-frame lift.
   */
  abduction: number;

  /**
   * Resolved axial twist coordinate, degrees in the same frame.
   *
   * @evidence requirements/asset-authoring/rig-and-state.md#asset-rig-basis-controls Carries the numeric axial coordinate recovered from the solved rotation.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Preserves twist across the decomposition owner's optional clinical rest-frame lift.
   */
  twist: number;
}
