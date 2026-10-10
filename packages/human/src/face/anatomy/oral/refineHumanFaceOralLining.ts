/**
 * Refine a planar lining triangulation until no free edge is longer than the
 * target length, and return the refined triangle indices.
 *
 * Each pass splits every free edge longer than `maxEdgeMetres` at its
 * midpoint and retriangulates the cells that own it. A free edge whose two
 * ends are both collar points (indices in `collar`, the lining's first ring
 * around each crown) is split whatever its length: a straight chord between
 * two crowns' collars carries no sample of the lining between them, and
 * between two crowns whose rings sit at different heights it would pass
 * under the taller one. Its midpoint is a free point, so the rule applies to an edge once. A cell with one, two or
 * three split edges uses the matching conforming template, and neighbours
 * share the one midpoint of their common edge, so no T-junction appears and
 * the parent orientation is kept. Edges named in `fixed` (keys
 * `"<lower index>:<higher index>"`) are never split: they are the collar
 * rings shared with the strips that join the crowns and the outer rim shared with the vestibular
 * wall. New points are appended to `points`, which the caller owns; existing
 * points are neither moved nor removed.
 *
 * The emitted population therefore follows from the region's area and the
 * target length and from no fixed pass count. Midpoint splitting halves an
 * edge each time it is split and creates no edge longer than the cell's
 * longest, so the passes terminate. Reaching the pass bound returns the last
 * pass, a valid conforming triangulation that still holds over-long edges;
 * the lining builder counts those edges and reports them, so a refinement
 * that fell short is a reported fact of the assembly and never an aborted
 * construction.
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
  let current = [...indices];
  for (let pass = 0; pass < 64; pass++) {
    const midpoint = new Map<string, number>();
    const split = (a: number, b: number): number => {
      const key = Math.min(a, b) + ":" + Math.max(a, b);
      if (fixed.has(key)) return -1;
      const known = midpoint.get(key);
      if (known !== undefined) return known;
      const pa = points[a];
      const pb = points[b];
      if (
        !(collar.has(a) && collar.has(b)) &&
        !(Math.hypot(pa[0] - pb[0], pa[1] - pb[1]) > maxEdgeMetres)
      )
        return -1;
      const at = points.length;
      points.push([(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2]);
      midpoint.set(key, at);
      return at;
    };
    const next: number[] = [];
    for (let at = 0; at < current.length; at += 3) {
      const vertices = current.slice(at, at + 3);
      const midpoints = vertices.map((a, k) => split(a, vertices[(k + 1) % 3]));
      const count = midpoints.filter((vertex) => vertex !== -1).length;
      if (count === 0) {
        next.push(...vertices);
        continue;
      }
      if (count === 3) {
        const [a, b, c] = vertices;
        const [ab, bc, ca] = midpoints;
        next.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
        continue;
      }
      // Rotate a one-split cell to AB, or a two-split cell to AB and BC.
      const start =
        count === 1
          ? midpoints.findIndex((vertex) => vertex !== -1)
          : (midpoints.indexOf(-1) + 1) % 3;
      const [a, b, c] = [0, 1, 2].map((k) => vertices[(start + k) % 3]);
      const [ab, bc] = [0, 1].map((k) => midpoints[(start + k) % 3]);
      if (count === 1) next.push(a, ab, c, ab, b, c);
      else next.push(b, bc, ab, a, ab, c, ab, bc, c);
    }
    current = next;
    if (midpoint.size === 0) return current;
  }
  return current;
}
