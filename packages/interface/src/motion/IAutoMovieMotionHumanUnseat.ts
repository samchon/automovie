import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/**
 * A rider leaving a moving saddle against their will: released at an authored
 * instant or on a hit, carrying the saddle's own velocity, then thrown backward
 * over the croup, sideways over the shoulder, forward over the neck or pulled
 * down from the ground, landing on the floor; dragged by a foot held in a
 * stirrup until a breakaway stirrup lets go; stepping clear on the high side as
 * the horse goes down; or slumped over the neck, wounded or unconscious,
 * staying on or sliding off.
 */
export interface IAutoMovieMotionHumanUnseat {
  /** The carrier's subject id. */
  on: string;

  /** The carrier contact the rider sits on, read for its moving frame. */
  frame: string;

  /** How the rider leaves. */
  fall: IAutoMovieMotionHumanUnseat.Fall;

  /**
   * The side the rider falls, is dragged, steps clear or slides to; the left,
   * the near side, when absent.
   */
  side?: AutoMovieHumanSide;

  /** Seconds into the act the saddle lets go; at once when absent. */
  release?: number;

  /**
   * A cue track whose first instant inside the act is the release, as a shot or
   * a lance strike; `release` when absent.
   */
  cue?: string;

  /**
   * The rider's speed away from the saddle the fall adds, metres per second;
   * the fall's own when absent.
   */
  push?: number;

  /** For a drag: the stirrup contact the foot on `side` stays bound to. */
  stirrup?: string;

  /**
   * For a drag: seconds after the release the breakaway stirrup lets the foot
   * go; held to the end when absent.
   */
  free?: number;

  /** For a slump: the mane contact the hand on the other side holds. */
  mane?: string;

  /**
   * For a slump: whether the rider stays on, held by the saddle and the hand in
   * the mane; slides off to `side` when false.
   */
  stays?: boolean;

  /** Seconds lying after the landing; one when absent. */
  lie?: number;
}
export namespace IAutoMovieMotionHumanUnseat {
  /**
   * How a rider leaves the saddle:
   *
   * - `back`: thrown backward over the croup, landing on the back behind the
   *   saddle;
   * - `side`: thrown sideways over the shoulder to `side`;
   * - `forward`: thrown forward over the neck;
   * - `pullDown`: pulled down to `side` from the ground, by infantry or a lasso;
   * - `drag`: the foot on `side` stays in its stirrup and the body slides on the
   *   floor behind;
   * - `clear`: steps clear on the high side, `side`, landing on the feet as the
   *   horse goes down;
   * - `slump`: loses voluntary control and slumps over the neck, staying on or
   *   sliding off to `side`.
   */
  export type Fall =
    | "back"
    | "side"
    | "forward"
    | "pullDown"
    | "drag"
    | "clear"
    | "slump";
}
