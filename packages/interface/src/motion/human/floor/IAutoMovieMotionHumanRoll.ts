/**
 * A forward or backward roll on the floor: the body crouches into a tuck over
 * its feet, rolls once round over its back as a ball rolls, without flight, and
 * rises from the tuck on its feet where the roll has carried it.
 *
 * The tuck is a set of joint angles (`TUCK`, provisional: the trunk and the
 * neck flexed, the hips and the knees folded, the arms round the shins).
 * Crouching, the joints go from the entry's into the tuck while the ankles stay
 * where they stood. Rolling, the tucked body turns once about its lateral axis
 * (forward or back), its root placed each second so its lowest joint centre
 * lies on the floor at the ankles' standing height, and carried along by
 * rolling without slipping: the root advances by the turn times its height
 * above that lowest point, integrated at plan time. Rising, the crouch is
 * played back from where the roll ends.
 *
 * Contact windows: the feet plant through the crouch and the rise, the back
 * lies on the floor over the roll's middle and the seat at its end (a forward
 * roll) or start (a backward one).
 *
 * First pass: the hands do not plant on the floor at the start (the arms hold
 * the shins), the head is not kept off the floor by the hands in a backward
 * roll, and the floor's contact is read on joint centres, not the skin.
 */
export namespace IAutoMovieMotionHumanRoll {
  /** Parameters. */
  export interface IParams {
    /** Which way the body turns; `forward` when absent. */
    direction?: "forward" | "backward";
  }
}
