import { IAutoMovieChannel } from "./IAutoMovieChannel";

/**
 * One named control a profile exposes: the abstract handle an LLM or an editor
 * UI drives, mapped onto a concrete channel.
 *
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rig-control-drivers Exposes `IAutoMovieProfileControl` as the portable data boundary for the actor rig control drivers requirement.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Types `IAutoMovieProfileControl` for the performance rig ROM control driver graph system contract.
 */
export interface IAutoMovieProfileControl {
  /**
   * Semantic control name, e.g. `"leftElbow.flexion"` or `"body.waistWidth"`.
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rig-control-drivers Exposes `name` as the portable data boundary for the actor rig control drivers requirement.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Types `name` for the performance rig ROM control driver graph system contract.
   */
  name: string;

  /**
   * The channel this control writes.
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rig-control-drivers Exposes `channel` as the portable data boundary for the actor rig control drivers requirement.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Types `channel` for the performance rig ROM control driver graph system contract.
   */
  channel: IAutoMovieChannel;

  /**
   * Default value, one element per channel component.
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rig-control-drivers Exposes `default` as the portable data boundary for the actor rig control drivers requirement.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Types `default` for the performance rig ROM control driver graph system contract.
   */
  default: number[];

  /**
   * Category this control belongs to (e.g. `"face"`, `"legs"`), or `null`. Lets
   * an editor group controls and reveal detail progressively (beginner mode vs
   * per-part panels) rather than showing hundreds of sliders at once.
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rig-control-drivers Exposes `group` as the portable data boundary for the actor rig control drivers requirement.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Types `group` for the performance rig ROM control driver graph system contract.
   */
  group: string | null;
}
