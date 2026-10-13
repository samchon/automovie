import { IAutoMovieHeightRule } from "../geometry/IAutoMovieHeightRule";

/** A bounded horizontal polygon with a deterministic height function. */
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
