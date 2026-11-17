import type { IAutoMovieSubdivisionParameter } from "../IAutoMovieSubdivisionParameter";
import type { IAutoMovieSurfaceCage } from "./IAutoMovieSurfaceCage";
import type { IAutoMovieSurfaceNetwork } from "./IAutoMovieSurfaceNetwork";

/** Incident-face addresses to convert into pose-independent network locations. */
export namespace IAutoMovieLocateSurfaceVertices {
  /**
   * Locate every vertex of a subdivided surface network in the network's own
   * terms, so a field declared over the network, such as a displacement, can be
   * evaluated at each vertex.
   *
   * A vertex's cage face and quad-local coordinates give its surface
   * coordinate, the bilinear blend of the face's corner coordinates, the same
   * chart `mapAutoMovieSurfaceTier` uses, so the coordinate is exact on a grid
   * patch and continuous across faces inside that patch. Different patch charts
   * can assign different addresses to a shared edge; compatible fields must
   * agree there. Each vertex keeps its supplied incident-face address. A sweep or transition patch
   * also gives the sweep's domain point, `u` and `v` carried from `t` and `s`
   * by the patch's ranges. The locations depend only on the network's layout
   * and the tier, never on a pose, so they are computed once per tier and level
   * and serve every pose.
   *
   * @evidence contracts/development/design.md#principled-representation Each quad-local subdivision address maps to dimensionless patch and optional sweep coordinates; locator admission checks face, corner discriminator and unit-interval coordinates.
   * @evidence contracts/development/design.md#minimal-and-owned-surface locateAutoMovieSurfaceVertices combines canonical network ranges, sampled cage charts and subdivision parameters for per-vertex surface fields without storing pose geometry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One supplied incident face determines each vertex address; seam consistency remains the field author's responsibility rather than being hidden by projection.
   * @evidence contracts/development/common.md#meaningful-documentation States ordering, empty results, borrowed inputs, actual network matching and the chart-to-display distinction.
   */
  export type IProps = {
    /** Source network providing patch names and sweep-domain ranges. Patch count and ordered names must match cage; the locator checks these, not full network identity. */
    network: IAutoMovieSurfaceNetwork;

    /** Borrowed cage containing a patch chart at every quad corner. Its spatial positions play no role in the lookup. */
    cage: IAutoMovieSurfaceCage;

    /** One incident cage-face address per requested vertex, in output order. The locator requires an existing face, corner=null and u/v in [0,1]; an empty array produces no locations. */
    parameters: readonly IAutoMovieSubdivisionParameter[];
  };
}
