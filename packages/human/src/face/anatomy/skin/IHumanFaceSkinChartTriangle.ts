import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";
import type { IHumanFaceSkinChartCoordinate } from "./IHumanFaceSkinChartCoordinate";

/**
 * One native triangle in a publisher-registered source material disk.
 * Exact material coordinates and determinant define its affine inverse; the
 * three neighbor lists follow the edges opposite its barycentric corners.
 * A zero or reversed determinant is unsupported by this local chart.
 *
 * @evidence contracts/common.md#principled-implementation An oriented nonzero planar determinant defines barycentric coordinates on a native triangle.
 * @evidence contracts/common.md#clear-and-simple-design Couples one native triangle's chart geometry to its actual edge adjacency.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native indices define neighbors without a tolerance weld.
 * @evidence contracts/common.md#meaningful-documentation States determinant meaning and opposite-edge ordering.
 * @evidence contracts/modeling.md#spatial-conventions Chart coordinates and barycentric weights are dimensionless.
 * @evidence contracts/modeling.md#shared-boundaries Shared native vertices inherit the one chart's coordinate definition.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries a cell on an existing part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authoring control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no new native triangle.
 * @evidenceExclude contracts/modeling.md#rendered-observation The brow consumer owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries geometric correspondence rather than clinical data.
 * @evidenceExclude contracts/anatomy.md#permitted-range The chart owner admits supported source cells.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal sculpting input.
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
