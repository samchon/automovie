import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanFootFrame } from "./IAutoMovieHumanFootFrame";

/**
 * The foot fan's shared origin, yaw/turn axes and station levers, together with
 * its crest-height reader.
 *
 * The interface package owns these declarations; AutoMovieHumanFootWebLine in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanFootWebLine {
  /** The fan's axes, levers and stations. */
  export interface IWebLine {
    /** The shared point: on the vertical yaw axis and the horizontal turn axis. */
    origin: AutoMovieVector3Tuple;

    /** Horizontal, across the foot toward its lateral side: the turn axis. */
    lateral: AutoMovieVector3Tuple;

    /** Horizontal, along the foot toward the heel. */
    back: AutoMovieVector3Tuple;

    /** The web ring's yaw from the square plane, radians. */
    yaw: number;

    /** Station at the square plane. */
    square: number;

    /** Station per radian of the yaw fan. */
    yawLever: number;

    /** Station per radian of the turn fan. */
    turnLever: number;

    /** Station at the ankle ring. */
    end: number;
  }

  /** What the web line reads besides the frame. */
  export interface IInput {
    /** The foot's frame. */
    frame: IAutoMovieHumanFootFrame.IFrame;

    /**
     * The forefoot crest's height over the floor at a place along the foot,
     * foot lengths.
     */
    depth: (a: number) => number;
  }
}
