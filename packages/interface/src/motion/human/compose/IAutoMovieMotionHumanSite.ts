/**
 * Where on a target a contact is made, chosen among the places the target
 * allows: a place drawn by the seed among weighted allowed places, and the
 * place along a vertical handle that leaves the hand comfortable at the end of
 * the move (end-state comfort).
 *
 * End-state comfort: people grasp an object so that the posture at the end of
 * the move is comfortable, so the grasp height on a vertical cylinder falls as
 * the height it is moved to rises (Cohen and Rosenbaum 2004, "Where grasps are
 * made reveals how grasps are planned", Exp Brain Res 157:486; Rosenbaum,
 * Halloran and Cohen 2006). The rule here takes the comfortable end height of
 * the hand as the elbow's height with the upper arm hanging, the forearm level
 * (the body's shoulder height less its upper arm), and grasps where the hand
 * lands there, as far as the handle allows: the grasp falls one for one with
 * the target's height inside the handle and stays at its end beyond it. The
 * slope of one is the rule's, not a measured one: the studies report the
 * inverse relation, and its measured slope is to be read before it becomes a
 * constant (research list).
 */
export namespace IAutoMovieMotionHumanSite {
  /** An allowed place and how often it is drawn. */
  export interface IWeighted {
    /** The place's id among the target's places. */
    id: string;

    /** Its relative weight, positive. */
    weight: number;
  }

  /** A band along a handle's axis, metres from its base. */
  export interface IBand {
    /** The lowest place a hand may hold, metres from the handle's base. */
    low: number;

    /** The highest, metres from the handle's base; at least `low`. */
    high: number;
  }
}
