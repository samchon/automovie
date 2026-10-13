import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMoviePlantingChild } from "./IAutoMoviePlantingChild";

/**
 * Recursive branching parameters in the recipe frame.
 *
 * @evidence contracts/common.md#principled-implementation growPlanting applies the child list recursively, rescales lengths and radii, builds a perpendicular parent frame and normalizes seeded directional perturbations; growth and pruning control which segments survive.
 * @evidence contracts/common.md#clear-and-simple-design Geometry parameters express the branching law directly; species labels do not select a hidden template.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Validation requires nonzero axes and bounded ratios/jitter. The derivation's zero-direction fallback retains the parent axis instead of introducing a species exception.
 * @evidence contracts/common.md#meaningful-documentation Members state depth indexing, metre lengths, dimensionless ratios and recipe-frame vertical bias before placement transforms.
 * @author Samchon
 */
export interface IAutoMoviePlantingStructure {
  /** Recursion depth; an integer of at least 1. Level `0` is the trunk. */
  levels: number;

  /**
   * Trunk direction in the recipe frame; non-zero and need not be unit.
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
   * The children every branch bears, in authored order. At least one, so the recursion has something to do; the branching pattern of a whole plant is this short list applied at every level.
   */
  children: IAutoMoviePlantingChild[];

  /**
   * Seeded perturbation of each child's direction, in `[0, 1]`. `0` grows a perfectly regular lattice of a plant; `1` fully randomizes the offset before the direction is renormalized.
   */
  directionJitter: number;

  /** Seeded relative perturbation of each child's length, in `[0, 1)`. */
  lengthJitter: number;

  /**
   * Bias of every child direction toward recipe-frame vertical, in `[-1, 1]`. Positive droops toward `-y` (a weeping habit, a hanging basket); negative lifts toward `+y` (a columnar habit); `0` follows the authored direction exactly.
   */
  gravitropism: number;
}
