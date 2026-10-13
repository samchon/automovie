import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Axis-aligned world-space bounds of regenerated slot positions, in meters; model extents and instantaneous motion are not included.
 *
 * @evidence contracts/common.md#principled-implementation Component-wise minima and maxima summarize the exact positions regenerated for a formation or instance range; these are position bounds, not a measured mesh envelope.
 * @evidence contracts/common.md#clear-and-simple-design Two vector corners serve both compact population kinds without coupling the bound to a prototype or viewer representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No radius or body size is inferred from these corners; a one-slot range legitimately has equal minimum and maximum positions.
 * @evidence contracts/common.md#meaningful-documentation Gives world-meter units, corner meaning and the exclusion of model extents and instantaneous motion.
 * @author Samchon
 */
export interface IAutoMovieFormationBounds {
  /** Minimum world-space corner. */
  min: IAutoMovieVector3;

  /** Maximum world-space corner. */
  max: IAutoMovieVector3;
}
