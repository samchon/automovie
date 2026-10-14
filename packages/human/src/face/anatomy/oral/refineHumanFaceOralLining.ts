/**
 * Refine a planar lining triangulation until no free edge is longer than the target length, and return the refined triangle indices.
 *
 * Each pass splits every free edge longer than `maxEdgeMetres` at its midpoint and retriangulates the cells that own it. A free edge whose two ends are both collar points (indices in `collar`, the lining's first ring around each crown) is split whatever its length: a straight chord between two crowns' collars carries no sample of the lining between them, and between two crowns whose rings sit at different heights it would pass under the taller one. Its midpoint is a free point, so the rule applies to an edge once. A cell with one, two or three split edges uses the matching conforming template, and neighbours share the one midpoint of their common edge, so no T-junction appears and the parent orientation is kept. Edges named in `fixed` (keys `"<lower index>:<higher index>"`) are never split: they are the collar rings shared with the strips that join the crowns and the outer rim shared with the vestibular wall. New points are appended to `points`, which the caller owns; existing points are neither moved nor removed.
 *
 * The emitted population therefore follows from the region's area and the target length and from no fixed pass count. Midpoint splitting halves an edge each time it is split and creates no edge longer than the cell's longest, so the passes terminate. Reaching the pass bound returns the last pass, a valid conforming triangulation that still holds over-long edges; the lining builder counts those edges and reports them, so a refinement that fell short is a reported fact of the assembly and never an aborted construction.
 *
 * @evidence contracts/common.md#principled-implementation Shared edge midpoints split overlong free edges and unsampled collar-to-collar chords with conforming one/two/three-edge templates.
 * @evidence contracts/common.md#clear-and-simple-design Fixed source cervical/outer boundary edges remain exact while only new field sample points are appended.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 64-pass cap can leave unresolved edges, which assembly reports for later refusal; no continuous sampling or quality proof follows from returning indices.
 * @evidence contracts/common.md#meaningful-documentation points mutate only by append, old indices/coordinates are retained and maxEdgeMetres is positive finite.
 * @evidence contracts/performance.md#efficient-algorithms Work follows summed triangles across up to 64 growing passes, with no separate global vertex/byte budget.
 * @evidence contracts/performance.md#reuse-equivalent-work One midpoint map per pass shares adjacent-cell split identities to avoid T-junctions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned incidence is owned and caller point arrays intentionally grow; pass maps are discarded each iteration.
 */
export function refineHumanFaceOralLining(
  points: number[][],
  indices: readonly number[],
  fixed: ReadonlySet<string>,
  collar: ReadonlySet<number>,
  maxEdgeMetres: number,
): number[] {
  if (!(maxEdgeMetres > 0) || !Number.isFinite(maxEdgeMetres))
    throw new Error(
      "Oral lining refinement needs a positive finite edge length.",
    );
  let current: number[] = [...indices];
  for (let pass: number = 0; pass < 64; pass++) {
    const midpoint: Map<string, number> = new Map<string, number>();
    const split: (a: number, b: number) => number = (
      a: number,
      b: number,
    ): number => {
      const key: string = Math.min(a, b) + ":" + Math.max(a, b);
      if (fixed.has(key)) return -1;
      const known: number | undefined = midpoint.get(key);
      if (known !== undefined) return known;
      const pa: number[] = points[a];
      const pb: number[] = points[b];
      if (
        !(collar.has(a) && collar.has(b)) &&
        !(Math.hypot(pa[0] - pb[0], pa[1] - pb[1]) > maxEdgeMetres)
      )
        return -1;
      const at: number = points.length;
      points.push([(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2]);
      midpoint.set(key, at);
      return at;
    };
    const next: number[] = [];
    for (let at: number = 0; at < current.length; at += 3) {
      const vertices: number[] = current.slice(at, at + 3);
      const midpoints: number[] = vertices.map((a: number, k: number): number =>
        split(a, vertices[(k + 1) % 3]),
      );
      const count: number = midpoints.filter(
        (vertex: number): boolean => vertex !== -1,
      ).length;
      if (count === 0) {
        next.push(...vertices);
        continue;
      }
      if (count === 3) {
        const [a, b, c]: number[] = vertices;
        const [ab, bc, ca]: number[] = midpoints;
        next.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
        continue;
      }
      // Rotate a one-split cell to AB, or a two-split cell to AB and BC.
      const start: number =
        count === 1
          ? midpoints.findIndex((vertex: number): boolean => vertex !== -1)
          : (midpoints.indexOf(-1) + 1) % 3;
      const [a, b, c]: number[] = [0, 1, 2].map(
        (k: number): number => vertices[(start + k) % 3],
      );
      const [ab, bc]: number[] = [0, 1].map(
        (k: number): number => midpoints[(start + k) % 3],
      );
      if (count === 1) next.push(a, ab, c, ab, b, c);
      else next.push(b, bc, ab, a, ab, c, ab, bc, c);
    }
    current = next;
    if (midpoint.size === 0) return current;
  }
  return current;
}
