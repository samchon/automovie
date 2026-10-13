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
 * Clip admitted source triangles against a captured vertex-sampled scalar cut: positive margins are removed and zero is retained. Strict intersections use the cut's undirected-edge registration once, while source-corner stencils remain region-local for independent atlas attributes. Input rows, finite margins and crossing registrations must match this unchanged cut; this gatherer does not revalidate the entire table.
 *
 * The boundary is piecewise-linear in sampled margins, not the analytic angular profile. Each convex clipped triangle emits at most two triangles; repeated exact endpoint identities are omitted without an area tolerance. Local incidence/winding preservation does not establish global embeddedness or physical source lineage for newly inserted vertices.
 *
 * @evidence contracts/common.md#principled-implementation Actual sampled sign transitions and existing edge registrations determine retained corner identity and interpolation stencils.
 * @evidence contracts/common.md#clear-and-simple-design The shared cutter owns source topology; region mesh consumers gather their own attributes from region-local corner indices.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero keeps the original endpoint, repeated identity removal uses no metric epsilon, and analytic boundary/global geometry or registered new lineage is not invented.
 * @evidence contracts/common.md#meaningful-documentation Prose states cut consistency premises, retained sign convention, local chart coordinates and exact endpoint/global boundaries.
 * @evidence contracts/performance.md#efficient-algorithms One edge map is built from I registered crossings and T source triangles perform fixed-size polygon filtering/fan emission, giving O(I+T) work under admitted tables.
 * @evidence contracts/performance.md#reuse-equivalent-work All region triangles reuse the cut's existing shared intersection identities through one per-call map, with no recomputation of crossing fractions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned corner records scale with clipped triangle output; edge/polygon workspace is local and no source evaluator or render resource is retained.
 */
export function clipHumanPersonTriangles(
  sources: readonly number[],
  cut: NonNullable<IAutoMovieHumanPersonSeam["cut"]>,
): IClippedCorner[] {
  const edges: Map<string, { vertex: number; t: number }> = new Map(
    cut.intersections.map(({ a, b, t }: (typeof cut.intersections)[number], index: number): [string, { vertex: number; t: number }] => [
      `${a}/${b}`,
      { vertex: cut.margins.length + index, t },
    ]),
  );
  const result: IClippedCorner[] = [];
  for (let offset: number = 0; offset < sources.length; offset += 3) {
    const polygon: typeof result = [];
    for (let corner: number = 0; corner < 3; corner++) {
      const previous: number = (corner + 2) % 3;
      const a: number = sources[offset + previous];
      const b: number = sources[offset + corner];
      const insideA: boolean = cut.margins[a] <= 0;
      const insideB: boolean = cut.margins[b] <= 0;
      if (insideA !== insideB) {
        const low: number = Math.min(a, b);
        const high: number = Math.max(a, b);
        const endpoint: number = cut.margins[low] === 0 ? low : high;
        const hit: { vertex: number; t: number } =
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
    const uniqueCorners: IClippedCorner[] = polygon.filter(
      (one: IClippedCorner, at: number): boolean =>
        polygon.findIndex((other: IClippedCorner): boolean => other.vertex === one.vertex) === at,
    );
    for (let corner: number = 1; corner + 1 < uniqueCorners.length; corner++)
      result.push(
        uniqueCorners[0],
        uniqueCorners[corner],
        uniqueCorners[corner + 1],
      );
  }
  return result;
}
