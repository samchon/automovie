import { AutoMovieSurfacePatternGenerator } from "./AutoMovieSurfacePatternGenerator";
import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";

/**
 * One area of the host face filled by one module program.
 *
 * Every module the generator returns is clipped to {@link region}, so a zone
 * owns exactly the pieces inside it, and a neighbouring zone meets it along a
 * shared border that the neighbour scan measures across.
 *
 * @evidence contracts/common.md#principled-implementation A zone is a lattice (origin and period) plus an author-stated reach, which lets the run enumerate exactly the cells whose modules can touch the convex region instead of guessing a margin.
 * @evidence contracts/common.md#clear-and-simple-design Region, lattice, reach, material and generator are the five inputs one module program needs; a second bond or a grain turn is another zone rather than an option on this one.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A module reaching past the stated reach is refused rather than dropped at the edge, a non-convex or overlapping region is refused by the run, and no zone id has special meaning.
 * @evidence contracts/common.md#meaningful-documentation States the face-local metre frame of region and origin, per-axis positivity of period and reach, why reach must be stated, id uniqueness, clipping to the region, and what a null material means.
 * @evidenceExclude contracts/performance.md#cost-and-resources Computes nothing itself; its period and reach set the run's enumeration size, the lattice cells over the region's box widened by reach and refused above `AUTOMOVIE_MAX_PATTERN_CELLS`, and it retains only its points and a reference to the generator closure.
 * @author Samchon
 */
export interface IAutoMovieSurfacePatternZone {
  /** Stable zone id, unique inside one pattern. */
  id: string;
  /**
   * Convex face-local polygon of at least three points, overlapping no other
   * zone's region.
   */
  region: IAutoMoviePatternPoint[];
  /** Face-local metre position of lattice cell `(0, 0)`. */
  origin: IAutoMoviePatternPoint;
  /** Lattice pitch in metres; the generator runs once per cell. */
  period: {
    /** Cell pitch along U, strictly above zero. */
    u: number;
    /** Cell pitch along V, strictly above zero. */
    v: number;
  };
  /**
   * How far in metres a generated module may reach from its cell origin.
   *
   * The lattice is enumerated wide enough that every cell whose modules could
   * touch the region is visited, which is only knowable if the author states
   * the reach. A module that exceeds it is refused rather than silently dropped
   * at the region's edge.
   */
  reach: {
    /** Greatest reach along U, strictly above zero. */
    u: number;
    /** Greatest reach along V, strictly above zero. */
    v: number;
  };
  /**
   * {@link IAutoMovieMaterial} id this zone's modules carry, or `null` when
   * its placements name no material.
   */
  material: string | null;
  /** The author's module program for this zone. */
  generate: AutoMovieSurfacePatternGenerator;
}
