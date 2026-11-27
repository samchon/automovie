import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Root primitives: the whole body moved and turned on the floor, in the
 * performer's own frame (a weight shift to one side, a sink into the knees, a
 * step's advance, a turn toward a partner).
 *
 * The root is the first channel written, so the trunk, the head and the limbs
 * of the same second are placed on the moved body. Planted legs keep their
 * world goals and are solved again on the moved pelvis, which is what bends the
 * knees when the root sinks.
 */
export namespace IAutoMovieMotionHumanRoot {
  /** A displacement of the body from where its posture has it. */
  export interface IOffset {
    /**
     * The root's move in its own floor frame; `x` left, `y` up, `z` forward,
     * metres.
     */
    point: IAutoMovieVector3;

    /**
     * The heading's turn about +Y, degrees; positive toward the performer's
     * left.
     */
    yaw: number;
  }

  /** A displacement over a window. */
  export interface ITravel {
    /** Seconds since the action's start from which the root is written. */
    from: number;

    /** Seconds since the action's start until which the root is written. */
    to: number;

    /**
     * Where the body is from where the posture so far has it.
     *
     * @param seconds Seconds since the action's start.
     * @returns The displacement.
     */
    offset(seconds: number): IAutoMovieMotionHumanRoot.IOffset;
  }
}
