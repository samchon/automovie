import type { IAutoMovieMotionHumanSword } from "./IAutoMovieMotionHumanSword";

/**
 * The guards of blade work: the blade taken from where the hand holds it to a
 * named guard and kept there.
 *
 * A guard is named by where the hilt is held, the tradition-neutral names of
 * the swordplay campaign (decision 8). Its pose is a row of `GUARDS`: the
 * hilt's place from the blade hand's shoulder in arm lengths, the way the blade
 * points and the way its true edge faces, so one row fits every body and every
 * blade. The action ends in the guard: what follows is entered from it.
 */
export namespace IAutoMovieMotionHumanSwordGuard {
  /** A guard, named by where the hilt is held. */
  export type Guard =
    | "high"
    | "shoulder"
    | "middle"
    | "low"
    | "ox"
    | "hanging"
    | "tail";

  /** Parameters of a guard. */
  export interface IParams extends IAutoMovieMotionHumanSword.IWield {
    /** The guard; `middle` when absent. */
    guard?: IAutoMovieMotionHumanSwordGuard.Guard;

    /**
     * Seconds, at least the 0.5 s (provisional) the guard takes to set; 1 when
     * absent.
     */
    duration?: number;
  }
}
