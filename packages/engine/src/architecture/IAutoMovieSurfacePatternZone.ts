import { AutoMovieSurfacePatternGenerator } from "./AutoMovieSurfacePatternGenerator";
import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";

/**
 * One area of the host face filled by one module program.
 *
 * Every module the generator returns is clipped to {@link region}, so a zone
 * owns exactly the pieces inside it, and a neighbouring zone meets it along a
 * shared border that the neighbour scan measures across.
 *
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
