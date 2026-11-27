import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/**
 * A held object moved within or with the hand that holds it, without being put
 * down: turned about one of its own axes (a key in a lock, a cap), shifted to
 * another of its grips (a pen turned into a writing grip, a phone from a carry
 * grip to a texting grip), or rolled across the fingers (a coin). Rows name
 * each kind (`HumanRegrasp`).
 *
 * `twist`: the wrist does the turn and the grip holds. The hand, and the object
 * riding it with the offset stored at closure, rotate together about the
 * object's axis line, an affordance whose translation lies on the axis and
 * whose `+X` is its direction, so the object turns about its own axis only; the
 * angle is counter-clockwise looking down the axis.
 *
 * `regrip`: the object moves in the still hand from the grip it is held by to
 * the grip a named affordance takes (`HumanGrasp.hand`, the grip a pick-up of
 * that affordance would close), as the grip window's in-hand motion
 * (`IAutoMovieMotionHumanContactWindow.inHand`): its origin on a straight line
 * in the hand and its rotation along the shortest arc, both on one minimum-jerk
 * profile.
 *
 * `roll`: the object rolls without slipping from the forefinger's pad to the
 * little finger's across the relaxed hand, turning about the palm's normal by
 * the distance over its radius (the affordance `axis`'s `radius`).
 *
 * This is the first pass the in-hand manipulation issue states for when the
 * literature gives no deterministic finger-gaiting rule that fits: the digits
 * keep the hand's shape while the object moves, so no digit lifts and replaces;
 * a schedule of digit contacts waits on that rule. A turn beyond the forearm's
 * range would need such regrips between turns.
 *
 * Every kind follows a minimum-jerk profile (Flash and Hogan 1985). Its
 * duration is 0.6 s for a quarter turn, a grip change or a roll across the hand
 * (provisional: a search for measured key-turning and in-hand manipulation
 * times found none), a twist's in proportion to its angle. The hand must hold
 * the object at entry, or the act is refused. Event `done` at the end; the hand
 * keeps the object after.
 */
export namespace IAutoMovieMotionHumanRegrasp {
  /** Parameters. */
  export interface IParams {
    /** What is done with the held object. */
    kind: "twist" | "regrip" | "roll";

    /** The held object. */
    prop: string;

    /** The hand that holds it. */
    hand: AutoMovieHumanSide;

    /**
     * A twist's axis, or a roll's object: an affordance whose translation lies
     * on the axis and whose `+X` is its direction; a roll reads its `radius`.
     */
    axis?: string;

    /** A twist's turn, degrees, counter-clockwise looking down the axis. */
    angle?: number;

    /** A regrip's new grip: the affordance the hand takes the object by. */
    to?: string;
  }
}
