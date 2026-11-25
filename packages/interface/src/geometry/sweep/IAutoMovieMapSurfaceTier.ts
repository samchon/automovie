import type { IAutoMovieSubdivisionParameter } from "../IAutoMovieSubdivisionParameter";
import type { IAutoMovieSurfaceCage } from "./IAutoMovieSurfaceCage";
import type { IAutoMovieSurfaceCoordinate } from "./IAutoMovieSurfaceCoordinate";

/**
 * Transfer of one quad address between sampled tiers through their common patch
 * chart.
 */
export namespace IAutoMovieMapSurfaceTier {
  /**
   * Inputs for carrying a point bound to one tier's cage onto another tier of
   * the same network.
   *
   * The point's face and local coordinates on the source tier give its surface
   * coordinate, the bilinear blend of the face's corner coordinates, which is
   * exact on a grid patch because every face spans an axis-aligned rectangle of
   * it, and on a transition band is the same bilinear map the locator inverts;
   * the target tier then locates that coordinate with
   * `locateAutoMovieSurfaceCoordinate`. Both tiers must come from the same
   * network, whose patch list is the shared chart.
   */
  export type IProps = {
    /**
     * Source tier's borrowed quad charts. The mapping reads face corners,
     * without measuring spatial positions.
     */
    from: IAutoMovieSurfaceCage;

    /**
     * Destination tier of the same network chart. Ordered patch names are
     * checked against from; matching names alone do not establish equivalent
     * authored ranges, which remain the caller's responsibility.
     */
    to: IAutoMovieSurfaceCage;

    /**
     * Existing source quad face and local u/v in [0,1]. Supply corner=null:
     * this operator always uses the quad bilinear map and does not inspect the
     * corner discriminator.
     */
    at: IAutoMovieSubdivisionParameter;
  };

  /**
   * Destination binding together with the network chart address through which
   * it was transferred. Both records are freshly allocated and retain no cage
   * storage.
   */
  export type IResult = {
    /**
     * Newly allocated destination quad address, with corner=null and local u/v
     * in [0,1], suitable for that cage's subdivision output.
     */
    at: IAutoMovieSubdivisionParameter;

    /**
     * Newly allocated dimensionless patch chart address shared by both tiers.
     * It is reconstructed from the source face, not from the displayed surface
     * position.
     */
    coordinate: IAutoMovieSurfaceCoordinate;
  };
}
