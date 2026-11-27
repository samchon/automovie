/**
 * A lance couched at the gallop and lowered to a skill-at-arms target: the
 * right hand holds the lance by its grip under the right arm, level along the
 * travel, and the left holds both reins; before the target the arm lowers the
 * point onto its line, the point meets the target's own position at the strike,
 * and the target rides the lance's point from then on as the lance is brought
 * back up, as a tent peg is lifted and a tilting ring is carried off.
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

  /**
   * Seconds the point takes to come from the couch onto the target's line
   * before the strike, and back up after it; positive.
   */
  lower: number;

  /** How long the act lasts, seconds. */
  duration: number;
}
export namespace IAutoMovieMotionHumanLanceCouch {
  /**
   * The target a lance's point takes: a prop and the affordance the point
   * meets.
   */
  export interface ITarget {
    /**
     * The target's subject id: a tent peg in the ground, a ring hung on a
     * stand.
     */
    prop: string;

    /** The target's affordance the point meets. */
    point: string;
  }
}
