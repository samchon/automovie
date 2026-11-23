import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanPushPullLean } from "./IAutoMovieMotionHumanPushPullLean";

/**
 * A heavy load that is not carried moved by its two handles: a crate, a
 * wardrobe or a car pushed ahead walking forward, pulled toward the body
 * walking backward, or a sack dragged behind walking forward; or pushed and
 * pulled at and not moved at all, the scene where force is shown and nothing
 * moves.
 *
 * The hold is the sled push's (`pushSled`): the hands reach the handles where
 * the load stands, close on them and are carried with the chest, so the gripped
 * load goes where the hands go; the push's grasp search, its sink onto bent
 * knees and its refusal of a handle out of reach are its own. What the haul
 * sets is the way and the trunk's lean:
 *
 * - `push`: the walk goes forward to `to`, the trunk leaning into the load.
 * - `pull`: the walk goes backward to `to`, the body keeping the heading it
 *   enters with, so it faces the load it draws, the trunk leaning back.
 * - `drag`: the walk goes forward to `to` with the handles behind the body, the
 *   trunk leaning forward.
 *
 * The lean is the measured one for the declared load at the handles' height
 * (`pushPullLean`, Lett and McGill 2006), so a heavier load leans the trunk
 * further. The walk is the walk's `slow` pace, about 0.82 m/s at the reference
 * hip ({@link IAutoMovieMotionHumanWalkParams.pace}), whatever the load, its
 * steps shorter than a free walk's; the load's friction does not slow it (not
 * yet modelled). A load that does not move (`moves: false`) is pressed for
 * `seconds` standing in place, the hands bearing on its handles without
 * gripping, so it stays where it stands.
 *
 * First pass, not yet: walking a tall load corner by corner (the load's own
 * pivot on the floor is not modelled), the breakaway and per-step events, the
 * step-to-step pauses a seed draws under heavy loads, and the load's friction
 * slowing the walk.
 */
export namespace IAutoMovieMotionHumanPushPull {
  /** Parameters. */
  export interface IParams {
    /** The moved prop's subject id. */
    prop: string;

    /** How the load is moved. */
    way: IAutoMovieMotionHumanPushPull.Way;

    /**
     * Where the walk goes, world metres; required unless the load does not
     * move.
     */
    to?: IAutoMovieVector3;

    /** The handle the left hand takes, an affordance id; `left` when absent. */
    left?: string;

    /** The handle the right hand takes, an affordance id; `right` when absent. */
    right?: string;

    /**
     * The load's declared level (`IAutoMovieMotionHumanPushPullLean.Load`);
     * `moderate` when absent. It sets the trunk's lean only, not the speed. For
     * a push (the pull's are in `pushPullLean.ANGLES`, a drag's read as a
     * push's): `light` 45.5 N leans about 7 degrees at the handles' height,
     * `moderate` 222.5 N about 14 to 17 degrees and `heavy` 400.5 N about 19 to
     * 25 degrees (Lett and McGill 2006, `pushPullLean.ANGLES`).
     */
    load?: IAutoMovieMotionHumanPushPullLean.Load;

    /**
     * Whether the load moves; `false` presses it standing in place for
     * `seconds`; `true` when absent.
     */
    moves?: boolean;

    /**
     * Seconds the hands press a load that does not move; required then, and
     * read only then. The author sets it: no natural duration is defined
     * (provisional: no study of a held push).
     */
    duration?: number;
  }

  /** How the load is moved. */
  export type Way = "push" | "pull" | "drag";
}
