import type { AutoMovieVector2Tuple } from "@automovie/interface";

import { orientSolidChart } from "./orientSolidChart";

/* Closed bounds and exact collinearity decide membership of an admitted point. */
export function isOnSolidChartSegment(
  a: Readonly<AutoMovieVector2Tuple>,
  b: Readonly<AutoMovieVector2Tuple>,
  point: Readonly<AutoMovieVector2Tuple>,
): boolean {
  return (
    point[0] >= Math.min(a[0], b[0]) &&
    point[0] <= Math.max(a[0], b[0]) &&
    point[1] >= Math.min(a[1], b[1]) &&
    point[1] <= Math.max(a[1], b[1]) &&
    orientSolidChart(a, b, point) === 0
  );
}
