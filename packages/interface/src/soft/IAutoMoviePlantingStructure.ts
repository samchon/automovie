import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMoviePlantingChild } from "./IAutoMoviePlantingChild";

/** The recursive branching law, free of any species classification. */
export interface IAutoMoviePlantingStructure {
  /** Recursion depth; an integer of at least 1. Level `0` is the trunk. */
  levels: number;

  /**
   * Growth direction of the trunk in world space; non-zero, need not be unit.
   */
  axis: IAutoMovieVector3;

  /** Trunk length in metres at full growth; strictly positive. */
  length: number;

  /** Trunk radius in metres at its base; strictly positive. */
  radius: number;

  /** Child length divided by parent length; in `(0, 1]`. */
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
   * Seeded perturbation of each child's direction, in `[0, 1]`. `0` grows a
   * perfectly regular lattice of a plant; `1` fully randomizes the offset
   * before the direction is renormalized.
   */
  directionJitter: number;

  /** Seeded relative perturbation of each child's length, in `[0, 1)`. */
  lengthJitter: number;

  /**
   * Bias of every child direction toward world vertical, in `[-1, 1]`. Positive
   * droops toward `-y` (a weeping habit, a hanging basket); negative lifts
   * toward `+y` (a columnar habit); `0` follows the authored direction
   * exactly.
   */
  gravitropism: number;
}
