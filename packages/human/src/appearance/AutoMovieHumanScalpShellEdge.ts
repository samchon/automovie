import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import { AutoMovieHumanScalpBoundary } from "./AutoMovieHumanScalpBoundary";

/**
 * The scalp shell's edge, centred on the scalp boundary: for each azimuth
 * the lowest elevation from which the skin, all the way up to the vertex,
 * lies above the boundary, so the shell ends on the hairline itself and
 * never shows as a line. Marches down from the vertex in quarter-cell steps
 * until the skin falls below the boundary or leaves the chart, then bisects
 * the last step twenty times.
 */
export namespace AutoMovieHumanScalpShellEdge {
  /**
   * Elevation of the edge at one azimuth.
   *
   * @param field Head chart
   * @param boundary The head's scalp boundary
   * @param alpha Azimuth, radians
   * @returns Elevation, radians
   */
  export function elevation(
    field: AutoMovieHumanHeadField.IField,
    boundary: AutoMovieHumanScalpBoundary.IBoundary,
    alpha: number,
  ): number {
    const limit: number = AutoMovieHumanScalpBoundary.height(boundary, alpha);
    const bears: (beta: number) => boolean = (beta: number): boolean => {
      const u: [number, number, number] = AutoMovieHumanHeadField.direction(
        alpha,
        beta,
      );
      const r: number = AutoMovieHumanHeadField.radius(field, u);
      return (
        AutoMovieHumanHeadField.covered(field, u) &&
        field.centre[1] + u[1] * r - field.eyeLevel >= limit
      );
    };
    const delta: number = Math.PI / AutoMovieHumanHeadField.elevationCells / 4;
    let high: number = Math.PI / 2;
    while (high - delta > -Math.PI / 2 && bears(high - delta)) high -= delta;
    let low: number = Math.max(-Math.PI / 2, high - delta);
    for (let k: number = 0; k < 20; ++k) {
      const mid: number = (low + high) / 2;
      if (bears(mid)) high = mid;
      else low = mid;
    }
    return high;
  }

  /**
   * The edge's elevation at every column of the shell: one per chart azimuth
   * cell plus a closing column at u = 1.
   *
   * @param field Head chart
   * @param boundary The head's scalp boundary
   * @returns Elevations, radians, `azimuthCells + 1` of them
   */
  export function elevations(
    field: AutoMovieHumanHeadField.IField,
    boundary: AutoMovieHumanScalpBoundary.IBoundary,
  ): number[] {
    const NA: number = AutoMovieHumanHeadField.azimuthCells;
    const edges: number[] = [];
    for (let i: number = 0; i <= NA; ++i)
      edges.push(elevation(field, boundary, ((i % NA) / NA) * 2 * Math.PI));
    return edges;
  }
}
