import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePlantingChild } from "./IAutoMoviePlantingChild";

/** Recursive branching parameters in the recipe frame. */
export interface IAutoMoviePlantingStructure {
  /** Recursion depth; an integer of at least 1. Level `0` is the trunk. */
  levels: number;

  /** Trunk direction in the recipe frame; non-zero and need not be unit. */
  axis: IAutoMovieVector3;

  /**
   * Baseline full-growth trunk length in metres before seeded length jitter;
   * strictly positive.
   */
  length: number;

  /** Trunk radius in metres at its base; strictly positive. */
  radius: number;

  /**
   * Baseline child full-growth length factor applied to the parent's full
   * length before the child's own jitter; in `(0, 1]`.
   */
  lengthRatio: number;

  /** Child radius divided by parent radius; in `(0, 1]`. */
  radiusRatio: number;

  /**
   * The children every branch bears, in authored order. At least one, so the
   * recursion has something to do; the branching pattern of a whole plant is
   * this short list applied at every level.
   */
  children: IAutoMoviePlantingChild[];

  /**
   * Seeded additive perturbation of each child direction component, in `[0,
   * 1]`. Each component receives this amount times a sample in `[-1, 1)` before
   * renormalization; it is not a uniform angular distribution. `0` adds no
   * directional jitter.
   */
  directionJitter: number;

  /**
   * Seeded relative length perturbation of the trunk and each child, in `[0,
   * 1)`.
   */
  lengthJitter: number;

  /**
   * Bias of every child direction toward recipe-frame vertical, in `[-1, 1]`.
   * Positive pulls toward `-y`; negative pulls toward `+y`. `0` leaves the
   * transformed authored direction unchanged before directional jitter. This
   * does not bias the trunk axis.
   */
  gravitropism: number;
}
