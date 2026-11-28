import type { IAutoMovieSurfaceCage } from "./IAutoMovieSurfaceCage";
import type { IAutoMovieSurfaceCoordinate } from "./IAutoMovieSurfaceCoordinate";

/** Tier cage and network chart inputs for incident-face lookup. */
export namespace IAutoMovieLocateSurfaceCoordinate {
  /**
   * Sampled cage layout and a patch coordinate to resolve to an incident face
   * and quad-local coordinates.
   *
   * The chosen face uses the subdivision quad convention: u advances from
   * corner 0 toward 1 and v advances from corner 0 toward 3. A regular grid's
   * terminal row or column owns its upper edge. Transition inversion is
   * numerical and depends on valid bilinear charts.
   */
  export type IProps = {
    /**
     * Sampled tier with valid patch grids and quad corner charts. Supply
     * nondegenerate transition charts that give a reliable bilinear inverse.
     */
    cage: IAutoMovieSurfaceCage;

    /**
     * Existing patch ordinal with finite s and t in [0, 1]. Grid endpoints at
     * one use the last face in that dimension.
     */
    coordinate: IAutoMovieSurfaceCoordinate;
  };
}
