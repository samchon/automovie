/**
 * Opening a door by its handle and holding it: the hand reaches the handle,
 * closes on it and goes with it while the leaf swings, the person standing, and
 * walking round with the leaf when the arm alone would lose the handle.
 * Register `HumanTravelLeaf.openDoor` to use it.
 *
 * The leaf's swing is the scene's: the door is a prop whose handle moves within
 * it (`IAutoMovieMotionHumanProp.point`, as `AutoMovieMotionHumanObject.prop` gives an
 * archetype's articulated contact), and the hand follows the handle at every
 * instant. The hand turns to the handle's frame and closes on the door's own
 * colliders (`HumanMountRider.hold`, `HumanMountRider.closed`), reaching it
 * over `TAKE` seconds on the minimum-jerk profile (Flash and Hogan 1985). A
 * handle the standing arm does not reach as the hand takes it, such as a car
 * door's below the shoulder, is taken leaning toward it, the body lowered as a
 * pick up lowers it. While the arm's own fit keeps the wrist within `HOLD` of
 * the hold from where the person stands the feet stay there; otherwise the
 * person walks with the leaf, backward and round it, facing it, keeping the
 * place relative to it the handle was taken from, at the handle's pace
 * (`HumanTravelLeafWalk`). A swing the hand still loses, faster or farther than
 * the person can walk with it, is refused as a `reach` refusal on `handle`
 * naming the largest swing followed. First pass: the closure is the one at the
 * instant the hand arrives.
 */
export namespace IAutoMovieMotionHumanTravelLeaf {
  /** Parameters of opening a door. */
  export interface IParams {
    /** The door: its prop's subject id in the performance. */
    door: string;

    /**
     * The handle taken: one of the prop's points, such as a door's `pull` or
     * `push`.
     */
    handle: string;

    /**
     * Seconds the hand holds the handle, from the start of the reach; more than
     * the reach's 0.6 s (`HumanTravelLeaf.TAKE`).
     */
    duration: number;

    /** The hand; the right when absent. */
    hand?: "left" | "right";
  }
}
