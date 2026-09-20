import { IAutoMovieChannelLimit, IAutoMovieDriver } from "@automovie/interface";

/**
 * A profile's declared limits/drivers, resolved onto concrete node ids.
 *
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rig-control-drivers Carries the executable profile produced by semantic binding.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Defines the concrete graph output consumed by frame resolution.
 * @author Samchon
 */
export interface IAutoMovieBoundProfile {
  /**
   * The profile's limits with every node reference made concrete.
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-joint-range-constraints Materializes every profile limit on its bound concrete node channel.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Supplies the bound ROM constraints for the frame constraint pass.
   */
  limits: IAutoMovieChannelLimit[];

  /**
   * The profile's drivers with every node reference made concrete.
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rig-control-drivers Materializes every declared driver edge on concrete node channels.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Supplies the bound deterministic driver graph for evaluation.
   */
  drivers: IAutoMovieDriver[];
}
