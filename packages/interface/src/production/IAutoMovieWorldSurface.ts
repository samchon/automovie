import type { IAutoMovieHeightRule } from "../geometry/IAutoMovieHeightRule";

/**
 * Bounded world-XZ polygon with a deterministic terrain height law and explicit
 * traversability.
 */
export interface IAutoMovieWorldSurface {
  /** Stable surface id. */
  id: string;

  /**
   * At least three distinct finite XZ vertices forming a simple,
   * non-self-intersecting polygon with non-zero area.
   */
  polygon: Array<{
    /** World X in meters. */
    x: number;

    /** World Z in meters. */
    z: number;
  }>;

  /** Surface height function. */
  height: IAutoMovieHeightRule;

  /** Whether performers may traverse the surface. */
  walkable: boolean;
}
