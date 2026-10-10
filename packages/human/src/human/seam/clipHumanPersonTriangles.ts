import type { IAutoMovieHumanPersonSeam } from "../structures/IAutoMovieHumanPersonSeam";

/**
 * A clipped vertex identity with its region-local corner interpolation stencil.
 *
 * @author Samchon
 */
interface IClippedCorner {
  /** Original or appended shared vertex index. */
  vertex: number;

  /** First source-corner index within the region's packed triangles. */
  a: number;

  /** Second source-corner index within the same packed triangles. */
  b: number;

  /** Dimensionless fraction from a towards b. */
  t: number;
}

/**
 * Clip source triangles against a frozen vertex-sampled scalar cut.
 * The seam and its region consumer share this topology owner. Positive margins
 * are removed; zero belongs to the retained side. Intersections are registered
 * once by undirected source edge, while corner stencils remain region-local so
 * an atlas seam never borrows its neighbour's UVs. Input arrays are read only.
 * This is a piecewise-linear scalar boundary, not the analytic angular profile.
 * Convex clipped triangles need at most two triangles; repeated corners at an
 * exact endpoint are omitted without an area tolerance.
 */
export function clipHumanPersonTriangles(
  sources: readonly number[],
  cut: NonNullable<IAutoMovieHumanPersonSeam["cut"]>,
): IClippedCorner[] {
  const edges = new Map(
    cut.intersections.map(({ a, b, t }, index) => [
      `${a}/${b}`,
      { vertex: cut.margins.length + index, t },
    ]),
  );
  const result: IClippedCorner[] = [];
  for (let offset = 0; offset < sources.length; offset += 3) {
    const polygon: typeof result = [];
    for (let corner = 0; corner < 3; corner++) {
      const previous = (corner + 2) % 3;
      const a = sources[offset + previous];
      const b = sources[offset + corner];
      const insideA = cut.margins[a] <= 0;
      const insideB = cut.margins[b] <= 0;
      if (insideA !== insideB) {
        const low = Math.min(a, b);
        const high = Math.max(a, b);
        const endpoint = cut.margins[low] === 0 ? low : high;
        const hit =
          cut.margins[endpoint] === 0
            ? { vertex: endpoint, t: endpoint === low ? 0 : 1 }
            : edges.get(`${low}/${high}`)!;
        polygon.push({
          vertex: hit.vertex,
          a: offset + (a === low ? previous : corner),
          b: offset + (a === low ? corner : previous),
          t: hit.t,
        });
      }
      if (insideB)
        polygon.push({
          vertex: b,
          a: offset + corner,
          b: offset + corner,
          t: 0,
        });
    }
    const uniqueCorners = polygon.filter(
      (one, at) =>
        polygon.findIndex((other) => other.vertex === one.vertex) === at,
    );
    for (let corner = 1; corner + 1 < uniqueCorners.length; corner++)
      result.push(
        uniqueCorners[0],
        uniqueCorners[corner],
        uniqueCorners[corner + 1],
      );
  }
  return result;
}
