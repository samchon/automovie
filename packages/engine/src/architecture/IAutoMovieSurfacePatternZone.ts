import { AutoMovieSurfacePatternGenerator } from "./AutoMovieSurfacePatternGenerator";
import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";

/**
 * One area of the host face filled by one module program.
 *
 * Every module the generator returns is clipped to {@link region}, so a zone
 * owns exactly the pieces inside it, and a neighbouring zone meets it along a
 * shared border that the neighbour scan measures across. An occurrence of this
 * zone is identified as `<zone id>/<module id>`.
 *
 * @evidence contracts/common.md#principled-implementation A zone is a convex clip region plus a lattice whose enumeration is widened by the declared reach, so every cell whose modules could touch the region is visited and the generator's output is clipped rather than trusted to stay inside.
 * @evidence contracts/common.md#clear-and-simple-design Holds only what is per zone: id, region, lattice origin and pitch, reach, material and generator; joint and neighbour rules are pattern-wide and live on the pattern.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A module beyond its declared reach is refused with a throw rather than silently clipped away, and the lattice cell cap is a contract constant that applies to every zone.
 * @evidence contracts/common.md#meaningful-documentation States what clipping to the region means for ownership, the occurrence id form, the convexity and overlap rules of the region, the metre units, why the reach must be stated, the refusals, the cell cap, and the null material.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A declaration without behavior; the lattice enumeration it drives is answered on `generateAutoMovieSurfacePattern`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure input record; the generator is called once per lattice cell per run and nothing is cached between runs.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owns its region points and a reference to the author's generator; the pattern owns the zone, and each run visits at most `AUTOMOVIE_MAX_PATTERN_CELLS` cells.
 * @author Samchon
 */
export interface IAutoMovieSurfacePatternZone {
  /** Stable, non-blank zone id, unique inside one pattern. */
  id: string;

  /**
   * Convex face-local polygon of at least three non-collinear points, with no
   * interior or repeated point, overlapping no other zone's region.
   */
  region: IAutoMoviePatternPoint[];

  /** Face-local metre position of lattice cell `(0, 0)`. */
  origin: IAutoMoviePatternPoint;

  /**
   * Lattice pitch in metres; the generator runs once per cell, over at most
   * `AUTOMOVIE_MAX_PATTERN_CELLS` cells.
   */
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
   * the reach. A module with a corner beyond it is refused with a throw rather
   * than silently dropped at the region's edge.
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

  /** The author's pure module program for this zone. */
  generate: AutoMovieSurfacePatternGenerator;
}
