/**
 * One component of a channel value that exceeded its bound and was clamped.
 *
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-joint-range-constraints Makes each applied channel-range correction visible instead of silently accepting it.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Defines the per-component result emitted when the constraint pass clamps a channel.
 * @author Samchon
 */
export interface IAutoMovieClampViolation {
  /**
   * Index of the offending component within the channel value vector.
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-joint-range-constraints Identifies the exact constrained degree of freedom that crossed its range.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Locates the corrected component in the channel constraint result.
   */
  component: number;

  /**
   * Which bound was crossed.
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-joint-range-constraints Distinguishes a lower-range breach from an upper-range breach.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Reports which side of the declared ROM constrained the value.
   */
  bound: "min" | "max";

  /**
   * The bound value the component was clamped to.
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-joint-range-constraints Preserves the declared numeric limit that resolved the invalid component.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Emits the applied constraint boundary beside the correction.
   */
  limit: number;

  /**
   * The component's value before clamping.
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-joint-range-constraints Keeps the requested out-of-range value available for diagnosis.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Records the requested component value before correction.
   */
  actual: number;
}
