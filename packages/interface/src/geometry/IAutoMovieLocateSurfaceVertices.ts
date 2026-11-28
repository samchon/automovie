import type { IAutoMovieSubdivisionParameter } from "./IAutoMovieSubdivisionParameter";
import type { IAutoMovieSurfaceCage } from "./IAutoMovieSurfaceCage";
import type { IAutoMovieSurfaceNetwork } from "./IAutoMovieSurfaceNetwork";

/** Incident-face addresses to resolve into stable network chart coordinates. */
export namespace IAutoMovieLocateSurfaceVertices {
  /**
   * One sampled network cage and its incident-face queries in requested vertex
   * order.
   *
   * Each requested vertex keeps its supplied incident face. A shared edge can
   * carry two different patch addresses, so a field defined over both patches
   * must agree where continuity is required.
   */
  export type IProps = {
    /**
     * Borrowed network whose patch count and ordered names must match the
     * sampled cage. Its patches supply sweep domain ranges.
     */
    network: IAutoMovieSurfaceNetwork;

    /**
     * Borrowed cage with valid chart coordinates at every addressed quad
     * corner. The lookup reads chart data independently of geometry positions.
     */
    cage: IAutoMovieSurfaceCage;

    /**
     * Dense incident-face address sequence in output order, with an existing
     * quad, null corner and finite u and v in [0, 1] for each point.
     *
     * An empty sequence yields no locations.
     */
    parameters: readonly IAutoMovieSubdivisionParameter[];
  };
}
