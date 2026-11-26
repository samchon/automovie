import type { IAutoMoviePlanarPoint } from "@automovie/interface";

import { AutoMovieEnginePlanarArea } from "../geometry/AutoMovieEnginePlanarArea";

/**
 * Twice the signed area of a closed polygon, positive when counter-clockwise.
 *
 * The ring closes from last to first in its planar frame; units are squared
 * polygon units and counter-clockwise uses x right, y up. Empty input returns
 * zero. Self-crossings contribute their net wound area. The calculation
 * subtracts the first corner from each point to reduce cancellation from large
 * offsets.
 *
 * @param polygon Closed ring of corners, the last joined back to the first.
 * @returns The shoelace sum, twice the signed enclosed area.
 */
export const polygonDoubleArea: (
  polygon: readonly IAutoMoviePlanarPoint[],
) => number = (polygon: readonly IAutoMoviePlanarPoint[]): number =>
  AutoMovieEnginePlanarArea.measureDoubled(polygon);
