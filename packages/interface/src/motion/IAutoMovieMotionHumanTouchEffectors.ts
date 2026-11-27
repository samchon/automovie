/**
 * A touch while standing: one hand, or both, laid on a region of a partner or
 * of the performer's own body and moved on it by a kind of social touch (Jung
 * et al. 2017): a tap, a pat, a stroke, a rub, a press, a squeeze, a hold or a
 * scratch. It is the one law of the affectionate and social touch family (a pat
 * on the head, a tap on the shoulder, a hand on the arm) and of the
 * self-directed family (a belly pat, a nape rub, a forearm scratch, a self hug,
 * hands over the ears), each item a row of `(effector, region, kind, timing)`.
 *
 * The hand reaches the region in the free-space transport time of the distance
 * (`AutoMovieMotionHumanTiming.transport`), repeats the kind's stroke `count`
 * times (`AutoMovieMotionHumanTouchForm.FORMS`), dwells for the hold and goes
 * back in the reach's time; the manner's tempo scales every span and its extent
 * the lift and the travel. The feet stay planted and the body keeps the entry
 * posture. A region of the performer's limbs is read on the entry pose, so it
 * must ride a limb the touch does not move, except a region on the other arm: a
 * person scratching or patting their own forearm first brings it up, so that
 * arm is carried on the same envelope to its forearm held across the front of
 * the waist, palm down, and the region is read on the arm held there
 * (`present`). A region above the shoulder that the standing arm does not reach
 * (a taller person's cheek) is risen to on the toes, and a region beyond the
 * standing arm (a thigh slapped while standing) is leaned into, each as far as
 * the hand needs (`AutoMovieMotionHumanTouchStance`), a leg's region then read
 * on the legs as the lean leaves them; one still out of reach at the lean's
 * limit is refused. A seated or carried body does not rise.
 *
 * Events: the phrase instants (`ready` on the region, `strokeStart` to
 * `strokeEnd` the repetitions, `relax` leaving). A touch may be cut before it
 * arrives or from `relax` on, into standing, a walk, a gesture or another
 * touch, the declined handshake's rule.
 */
export namespace IAutoMovieMotionHumanTouchEffectors {
  /** Which part of the hand touches. */
  export type With =
    | "palm"
    | "fingertips"
    | "forefinger"
    | "handBack"
    | "fist"
    | "handEdge"
    | "heel";
}
