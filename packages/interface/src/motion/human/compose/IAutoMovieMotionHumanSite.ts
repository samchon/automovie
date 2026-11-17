/**
 * Where on a target a contact is made, chosen among the places the target
 * allows (#3357): a place drawn by the seed among weighted allowed places,
 * and the place along a vertical handle that leaves the hand comfortable at
 * the end of the move (end-state comfort).
 *
 * End-state comfort: people grasp an object so that the posture at the end
 * of the move is comfortable, so the grasp height on a vertical cylinder
 * falls as the height it is moved to rises (Cohen and Rosenbaum 2004,
 * "Where grasps are made reveals how grasps are planned", Exp Brain Res
 * 157:486; Rosenbaum, Halloran and Cohen 2006). The rule here takes the
 * comfortable end height of the hand as the elbow's height with the upper
 * arm hanging, the forearm level (the body's shoulder height less its upper
 * arm), and grasps where the hand lands there, as far as the handle allows:
 * the grasp falls one for one with the target's height inside the handle
 * and stays at its end beyond it. The slope of one is the rule's, not a
 * measured one: the studies report the inverse relation, and its measured
 * slope is to be read before it becomes a constant (#3357's research list).
 *
 * @evidence contracts/development/common.md#meaningful-documentation weight: Its relative weight, positive. low: The lowest place a hand may hold, metres from the handle's base. high: The highest, metres from the handle's base; at least `low`.
 * @evidence contracts/development/design.md#principled-representation weight: Its relative weight, positive. low: The lowest place a hand may hold, metres from the handle's base. high: The highest, metres from the handle's base; at least `low`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanSite.ts (AutoMovieMotionHumanSite.draw, sites); compose/AutoMovieMotionHumanSite.ts (AutoMovieMotionHumanSite.draw, s); compose/AutoMovieMotionHumanSite.ts (AutoMovieMotionHumanSite.draw.total, s); compose/AutoMovieMotionHumanSite.ts (AutoMovieMotionHumanSite.grasp, band).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in AutoMovieMotionHumanSite.draw.
 */
export namespace IAutoMovieMotionHumanSite {
  /**
   * An allowed place and how often it is drawn.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and range.
   * @evidence contracts/development/design.md#principled-representation An id and a positive weight, a categorical distribution's entry.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read by `draw`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The weight is relative; no total is stored.
   */
  export interface IWeighted {
    /** The place's id among the target's places. */
    id: string;

    /** Its relative weight, positive. */
    weight: number;
  }

  /**
   * A band along a handle's axis, metres from its base.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The two ends of the part of a handle a hand may hold.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read by `grasp`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The band is the affordance's; nothing is assumed of its length.
   */
  export interface IBand {
    /** The lowest place a hand may hold, metres from the handle's base. */
    low: number;

    /** The highest, metres from the handle's base; at least `low`. */
    high: number;
  }
}
