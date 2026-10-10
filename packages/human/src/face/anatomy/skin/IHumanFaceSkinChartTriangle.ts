import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";
import type { IHumanFaceSkinChartCoordinate } from "./IHumanFaceSkinChartCoordinate";

/**
 * One native triangle in a publisher-registered source material disk.
 * Exact material coordinates and determinant define its affine inverse; the
 * three neighbor lists follow the edges opposite its barycentric corners.
 * A zero or reversed determinant is unsupported by this local chart.
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
