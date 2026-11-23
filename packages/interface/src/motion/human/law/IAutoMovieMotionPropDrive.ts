/**
 * A planned prop articulation trajectory whose interval bounds are shares of
 * the action's duration. Its callback takes action-local seconds and returns
 * degrees for turning articulations or metres otherwise.
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
   * The articulation's travel at a second of the action, in its own unit
   * (degrees for a turning kind, metres otherwise). Pure.
   *
   * @param seconds Seconds since the action's start.
   * @returns The travel.
   */
  travel(seconds: number): number;
}
