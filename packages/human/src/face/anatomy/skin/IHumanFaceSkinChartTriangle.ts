import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";
import type { IHumanFaceSkinChartCoordinate } from "./IHumanFaceSkinChartCoordinate";

/**
 * One native triangle in a publisher-registered source material disk.
 * Exact material coordinates and determinant define its affine inverse; the
 * three neighbor lists follow the edges opposite its barycentric corners.
 * A zero or reversed determinant is unsupported by this local chart.
 *
 * @evidence contracts/common.md#principled-implementation createHumanFaceSkinChart records native winding, exact material corners and a positive determinant; walkHumanFaceSkinChart uses opposite-edge neighbors to continue one affine chord without reseating geometry.
 * @evidence contracts/common.md#clear-and-simple-design The record keeps one facet's inverse data and adjacency together; current physical positions remain with the host frame reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native ordinal and corners identify actual source incidence, not fixture-specific triangles; nonpositive chart facets refuse at creation.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish native winding, fixed material coordinates, determinant orientation and opposite-edge neighbor order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This facet interface declares data; chart compilation and chord walking own its construction and traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The facet type schedules no work; createHumanFaceSkinChart owns the immutable cell population shared by its walks.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This type acquires no resource; the chart closure owns facet and adjacency retention.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinChartTriangle {
  /** Actual native triangle ordinal in the host winding. */
  ordinal: number;

  /** Actual native vertices in that triangle's winding order. */
  vertices: readonly [number, number, number];

  /** The three native vertices' fixed material coordinates. */
  corners: readonly [
    IHumanFaceSkinChartCoordinate,
    IHumanFaceSkinChartCoordinate,
    IHumanFaceSkinChartCoordinate,
  ];

  /** Oriented material-coordinate determinant, positive on an admitted disk. */
  determinant: IHumanExactFraction;

  /** Native neighboring triangles across each opposite edge. */
  neighbors: readonly (readonly number[])[];
}
