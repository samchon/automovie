import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";

/**
 * A cavalry sabre carried on the march and brought to the charge from the
 * saddle: the right hand closes on the sabre's grip and the left holds both
 * reins as one bridle hand; at the slope the blade rests upright against the
 * right shoulder, and at the engage the arm reaches straight forward with the
 * blade level along the travel, point leading and edge down, the thrusting
 * pattern of 1908. A trumpet's charge cue brings the slope to the engage after
 * the rider's warned reaction, within one gallop stride.
 */
export interface IAutoMovieMotionHumanSabre {
  /** The horse's subject id. */
  on: string;

  /** The horse's seat contact the rider sits on; `seat` when absent. */
  frame?: string;

  /** The sabre's subject id, already held in the right hand by its grip. */
  prop: string;

  /** The carriage the act begins in. */
  carry: IAutoMovieMotionHumanSabre.Carry;

  /**
   * The cue track whose first instant inside the act is the trumpet's charge;
   * with it a slope is brought to the engage.
   */
  cue?: string;

  /**
   * The cue track of the horse ride's own gait changes, its instants named as
   * the ride publishes them (`gait:canter-gallop`); required with `cue`, which
   * must fall on the gallop.
   */
  gaits?: string;

  /**
   * What the engage points at; straight ahead along the seat's forward when
   * absent.
   */
  target?: IAutoMovieMotionTarget;

  /**
   * Seconds the slope takes to reach the engage after the charge cue, more than
   * none and at most 0.5 s, one gallop stride (`HumanSabre` `STRIDE`,
   * provisional: about two strides a second); a minimum-jerk path in the seat
   * frame. The arms take 0.5 s from the entry to the bridle and the carriage.
   */
  transition: number;

  /**
   * How long the act lasts, seconds; positive. The charge cue must fall inside
   * it.
   */
  duration: number;
}
export namespace IAutoMovieMotionHumanSabre {
  /**
   * A sabre carriage: `slope`, upright against the right shoulder, or `engage`,
   * level forward at the charge.
   */
  export type Carry = "slope" | "engage";
}
