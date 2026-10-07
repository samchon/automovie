import type { IAutoMovieHumanPersonSeam } from "../structures/IAutoMovieHumanPersonSeam";

/**
 * Clip source triangles against a frozen vertex-sampled scalar cut.
 * The seam and its region consumer share this topology owner. Positive margins
 * are removed; zero belongs to the retained side. Intersections are registered
 * once by undirected source edge, while corner stencils remain region-local so
 * an atlas seam never borrows its neighbour's UVs. Input arrays are read only.
 * This is a piecewise-linear scalar boundary, not the analytic angular profile.
 * Convex clipped triangles need at most two triangles; repeated corners at an
 * exact endpoint are omitted without an area tolerance.
 *
 * @evidence contracts/common.md#principled-implementation Sutherland-Hodgman clipping of a triangle by its affine scalar field produces a convex polygon; a fan preserves its winding. Each crossing uses the cut's canonical edge identity and fraction.
 * @evidence contracts/common.md#clear-and-simple-design One polygon walk supplies both source topology and corner interpolation stencils to the seam and mesh consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact endpoint identity removes repeated corners; no subject, tolerance or triangle identifier changes the rule.
 * @evidence contracts/common.md#meaningful-documentation States scalar meaning, shared-edge ownership, corner attributes, mutation and approximation.
 * @evidence contracts/modeling.md#emitted-geometry Each original triangle emits zero, one or two triangles from its retained convex polygon.
 * @evidence contracts/modeling.md#shared-boundaries Adjacent triangles use the identical crossing source vertex and frozen fraction, including across UV charts.
 * @evidence contracts/modeling.md#spatial-conventions Fractions and indices are dimensionless; margins retain their caller's common unit.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Clips existing triangles and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Consumes internal scalar samples and no authored channel.
 * @evidenceExclude contracts/modeling.md#rendered-observation Owns no displayed part; the assembled seam owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Defines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits no anatomical input.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no user input.
 */
export function clipHumanPersonTriangles(
  sources: readonly number[],
  cut: NonNullable<IAutoMovieHumanPersonSeam["cut"]>,
): { vertex: number; a: number; b: number; t: number }[] {
  const edges = new Map(
    cut.intersections.map(({ a, b, t }, index) => [
      `${a}/${b}`,
      { vertex: cut.margins.length + index, t },
    ]),
  );
  const result: { vertex: number; a: number; b: number; t: number }[] = [];
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
    const unique = polygon.filter(
      (one, at) =>
        polygon.findIndex((other) => other.vertex === one.vertex) === at,
    );
    for (let corner = 1; corner + 1 < unique.length; corner++)
      result.push(unique[0], unique[corner], unique[corner + 1]);
  }
  return result;
}
