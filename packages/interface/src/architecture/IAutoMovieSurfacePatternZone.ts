import type { AutoMovieSurfacePatternGenerator } from "./AutoMovieSurfacePatternGenerator";
import type { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";

/**
 * One area of the host face filled by one module program.
 *
 * Every module the generator returns is clipped to {@link region}, so a zone
 * owns exactly the pieces inside it, and a neighbouring zone meets it along a
 * shared border that the neighbour scan measures across. An occurrence of this
 * zone is identified as `<zone id>/<module id>`.
 */
export interface IAutoMovieSurfacePatternZone {
  /** Stable, non-blank zone id, unique inside one pattern. */
  id: string;

  /**
   * Convex-position face-local point set with at least three non-collinear
   * points and no interior/duplicate points. The run canonicalizes hull order
   * rather than preserving the authored ring and refuses overlap above its area
   * tolerance.
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
   * {@link IAutoMovieMaterial} id this zone's modules carry, or `null` when its
   * placements name no material.
   */
  material: string | null;

  /** The author's pure module program for this zone. */
  generate: AutoMovieSurfacePatternGenerator;
}
