/**
 * A planned prop articulation trajectory whose interval bounds are shares of the action's duration. Its callback takes action-local seconds and returns degrees for turning articulations or metres otherwise.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A planned prop articulation trajectory whose interval bounds are shares of the action's duration. Its callback takes action-local seconds and returns degrees for turning articulations or metres otherwise.
 * @evidence contracts/development/design.md#principled-representation from: Share of this action from which it drives. to: Share of this action until which it drives. travel: The articulation's travel at a second of the action, in its own unit (degrees for a turning kind, metres otherwise). Pure.
 * @evidence contracts/development/design.md#minimal-and-owned-surface operateDrive and weapon-presentation actions produce articulation drives consumed by HumanPerformanceObject's writers; the articulation's geometry stays in the prop owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Interval endpoints remain normalized shares but travel takes action-local seconds. The articulation determines degree versus metre travel, and runtime prop state resolution owns admission.
 */
export interface IAutoMovieMotionPropDrive {
  /** The prop's subject id. */
  prop: string;

  /** The articulation affordance driven. */
  articulation: string;

  /** Share of this action from which it drives. */
  from: number;

  /** Share of this action until which it drives. */
  to: number;

  /**
   * The articulation's travel at a second of the action, in its own unit (degrees for a turning kind, metres otherwise). Pure.
   *
   * @param seconds Seconds since the action's start.
   * @returns The travel.
   */
  travel(seconds: number): number;
}
