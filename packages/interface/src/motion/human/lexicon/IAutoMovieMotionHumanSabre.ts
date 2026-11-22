import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";

/**
 * A cavalry sabre carried on the march and brought to the charge from the saddle (#3949, #3957): the right hand closes on the sabre's grip and the left holds both reins as one bridle hand; at the slope the blade rests upright against the right shoulder, and at the engage the arm reaches straight forward with the blade level along the travel, point leading and edge down, the thrusting pattern of 1908. A trumpet's charge cue brings the slope to the engage after the rider's warned reaction, within one gallop stride.
 *
 * @evidence contracts/development/common.md#meaningful-documentation on: The horse's subject id. frame: Its seat contact. prop: The sabre's subject id. carry: The carriage the act begins in. cue: The charge cue's track. gaits: The ride's gait changes as a cue track. target: What the engage points at. transition: Seconds the slope takes to reach the engage. seconds: How long the act lasts.
 * @evidence contracts/development/design.md#principled-representation Subject and contact ids, a closed carriage literal, a cue track and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parameters `HumanSabre` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The cue is the author's; the reaction is the rider's own warned latency.
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

  /** The cue track whose first instant inside the act is the trumpet's charge; with it a slope is brought to the engage. */
  cue?: string;

  /** The cue track of the horse ride's own gait changes, its instants named as the ride publishes them (`gait:canter-gallop`); required with `cue`, which must fall on the gallop. */
  gaits?: string;

  /** What the engage points at; straight ahead along the seat's forward when absent. */
  target?: IAutoMovieMotionTarget;

  /** Seconds the slope takes to reach the engage, more than none and at most a gallop stride. */
  transition: number;

  /** How long the act lasts, seconds. */
  seconds: number;
}
export namespace IAutoMovieMotionHumanSabre {
  /** A sabre carriage: `slope`, upright against the right shoulder, or `engage`, level forward at the charge. */
  export type Carry = "slope" | "engage";
}
