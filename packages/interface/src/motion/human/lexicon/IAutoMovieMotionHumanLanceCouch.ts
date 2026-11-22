/**
 * A lance couched at the gallop and lowered to a skill-at-arms target (#3956): the right hand holds the lance by its grip under the right arm, level along the travel, and the left holds both reins; before the target the arm lowers the point onto its line, the point meets the target's own position at the strike, and the target rides the lance's point from then on as the lance is brought back up, as a tent peg is lifted and a tilting ring is carried off.
 *
 * @evidence contracts/development/common.md#meaningful-documentation on: The horse's subject id. frame: Its seat contact. prop: The lance's subject id. target: The target's prop and point. lower: Seconds the point takes to come onto the target's line, and to come back up after the strike. duration: How long the act lasts.
 * @evidence contracts/development/design.md#principled-representation Subject and affordance ids and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parameters `HumanLanceCouch` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The strike's instant is the course's own, where the lowered point first reaches the target; nothing is cued.
 */
export interface IAutoMovieMotionHumanLanceCouch {
  /** The horse's subject id. */
  on: string;

  /** The horse's seat contact the rider sits on; `seat` when absent. */
  frame?: string;

  /** The lance's subject id, already held in the right hand by its grip. */
  prop: string;

  /** The target the point meets and carries off. */
  target: IAutoMovieMotionHumanLanceCouch.ITarget;

  /** Seconds the point takes to come from the couch onto the target's line before the strike, and back up after it; positive. */
  lower: number;

  /** How long the act lasts, seconds. */
  duration: number;
}
export namespace IAutoMovieMotionHumanLanceCouch {
  /**
   * The target a lance's point takes: a prop and the affordance the point meets.
   *
   * @evidence contracts/development/common.md#meaningful-documentation prop: The target's subject id. point: Its affordance the point meets.
   * @evidence contracts/development/design.md#principled-representation Two ids.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `HumanLanceCouch`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ITarget {
    /** The target's subject id: a tent peg in the ground, a ring hung on a stand. */
    prop: string;

    /** The target's affordance the point meets. */
    point: string;
  }
}
