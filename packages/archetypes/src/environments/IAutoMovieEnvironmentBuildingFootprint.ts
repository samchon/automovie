import type { IAutoMovieDiscriminated } from "@automovie/interface";

import type { IAutoMovieEnvironmentBuildingPoint } from "./IAutoMovieEnvironmentBuildingPoint";

/**
 * A rectangular or polygonal building footprint.
 *
 * Polygon vertex and hole order is preserved as authored; rings omit a repeated
 * closing point.
 */
export type IAutoMovieEnvironmentBuildingFootprint =
  | IAutoMovieDiscriminated<"rectangle", IRectangleFootprint>
  | IAutoMovieDiscriminated<"polygon", IPolygonFootprint>;

interface IRectangleFootprint {
  /** Local X coordinate of the lower-left plan corner, in metres. */
  readonly x: number;

  /** Local Z coordinate of the lower-left plan corner, in metres. */
  readonly z: number;

  /** Footprint width along local +X, in metres. */
  readonly width: number;

  /** Footprint depth along local +Z, in metres. */
  readonly depth: number;
}

interface IPolygonFootprint {
  /** Ordered outer contour in local XZ metres; do not repeat the first point. */
  readonly vertices: readonly IAutoMovieEnvironmentBuildingPoint[];

  /** Ordered interior contours, each strictly within the outer contour. */
  readonly holes?: readonly (readonly IAutoMovieEnvironmentBuildingPoint[])[];
}