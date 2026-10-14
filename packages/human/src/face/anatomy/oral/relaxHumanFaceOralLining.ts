/**
 * Flip the free edges of a planar lining triangulation toward the Delaunay condition, and return the triangle indices.
 *
 * The region kernel ear-clips, which leaves long fans radiating from single points, and midpoint refinement keeps their direction. A free edge shared by two counter-clockwise triangles is flipped when the vertex opposite it in one triangle lies strictly inside the circumcircle of the other. That follows Lawson's flip using a relative approximate in-circle predicate; it does not establish exact Delaunay convergence or a minimum-angle optimum. Near-circle determinants within 1e-12 of the computed scale are left alone. A pair whose quadrilateral is not strictly convex is left as it is, because flipping it would fold or flatten a triangle. A triangle with no area, which ear clipping leaves between three collinear outline points, has no circumcircle; its free edge is flipped whenever that gives two triangles with area, so no flat triangle survives where one can be removed. Edges named in `fixed` (keys `"<lower index>:<higher index>"`) and edges on the region's outline are never flipped, so the cervical rings and the outer rim keep their exact edges. No point is added, moved or removed and the covered region is unchanged.
 *
 * The 64-pass cap is a computation bound. It can leave flat or poor cells, and the caller's final source/Float32 rank and collar-sampling gates report those unresolved conditions. Connectivity remains conforming; quality is not established by this function's return.
 *
 * @evidence contracts/common.md#principled-implementation Strictly convex free quadrilaterals flip under an approximate in-circle/flat-cell condition.
 * @evidence contracts/common.md#clear-and-simple-design Fixed boundaries and collar sampling constraints retain source ownership while points never move.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Relative predicates and the 64-pass cap do not prove exact Delaunay convergence or minimum-angle quality; final rank/sampling gates remain required.
 * @evidence contracts/common.md#meaningful-documentation Planar metre points remain borrowed and the result is copied triangle connectivity.
 * @evidence contracts/performance.md#efficient-algorithms Each of at most 64 passes rebuilds O(triangles) edge ownership and scans eligible pairs.
 * @evidence contracts/performance.md#reuse-equivalent-work One directed-edge map finds twin faces and touched-face membership prevents incompatible flips in the same pass.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The result owns copied indices while per-pass maps/sets expire; no persistent quality history is retained.
 */
export function relaxHumanFaceOralLining(
  points: readonly number[][],
  indices: readonly number[],
  fixed: ReadonlySet<string>,
  collar: ReadonlySet<number> = new Set(),
): number[] {
  const current: number[] = [...indices];
  const inside: (a: number, b: number, c: number, d: number) => boolean = (
    a: number,
    b: number,
    c: number,
    d: number,
  ): boolean => {
    const ax: number = points[a][0] - points[d][0];
    const ay: number = points[a][1] - points[d][1];
    const bx: number = points[b][0] - points[d][0];
    const by: number = points[b][1] - points[d][1];
    const cx: number = points[c][0] - points[d][0];
    const cy: number = points[c][1] - points[d][1];
    const determinant: number =
      (ax * ax + ay * ay) * (bx * cy - cx * by) -
      (bx * bx + by * by) * (ax * cy - cx * ay) +
      (cx * cx + cy * cy) * (ax * by - bx * ay);
    const scale: number =
      (ax * ax + ay * ay + bx * bx + by * by + cx * cx + cy * cy) ** 2;
    return determinant > 1e-12 * scale;
  };
  const area: (a: number, b: number, c: number) => number = (
    a: number,
    b: number,
    c: number,
  ): number =>
    (points[b][0] - points[a][0]) * (points[c][1] - points[a][1]) -
    (points[b][1] - points[a][1]) * (points[c][0] - points[a][0]);
  for (let pass: number = 0; pass < 64; pass++) {
    // Directed edge "a:b" names the triangle that owns it and its opposite corner.
    const owner: Map<string, number> = new Map<string, number>();
    for (let at: number = 0; at < current.length; at += 3)
      for (let k: number = 0; k < 3; k++)
        owner.set(
          current[at + k] + ":" + current[at + ((k + 1) % 3)],
          at + ((k + 2) % 3),
        );
    const touched: Set<number> = new Set<number>();
    let flips: number = 0;
    for (const [key, cornerAt] of owner) {
      const [a, b]: number[] = key.split(":").map(Number);
      if (a > b || fixed.has(a + ":" + b)) continue;
      const twinAt: number | undefined = owner.get(b + ":" + a);
      if (twinAt === undefined) continue;
      const first: number = cornerAt - (cornerAt % 3);
      const second: number = twinAt - (twinAt % 3);
      if (touched.has(first) || touched.has(second)) continue;
      const c: number = current[cornerAt];
      const d: number = current[twinAt];
      // A chord between cervical ports needs a field sample. Never recreate
      // that unsampled chord after the refinement owner has split it.
      if (collar.has(c) && collar.has(d)) continue;
      // A flip must leave two properly wound triangles; a quad that is not strictly convex keeps its diagonal.
      const span: number =
        (points[b][0] - points[a][0]) ** 2 + (points[b][1] - points[a][1]) ** 2;
      const flat: boolean =
        !(area(a, b, c) > 1e-9 * span) || !(area(b, a, d) > 1e-9 * span);
      if (
        !(area(a, d, c) > 1e-9 * span && area(d, b, c) > 1e-9 * span) ||
        !(flat || inside(a, b, c, d))
      )
        continue;
      current.splice(first, 3, a, d, c);
      current.splice(second, 3, d, b, c);
      touched.add(first);
      touched.add(second);
      flips++;
    }
    if (flips === 0) break;
  }
  return current;
}
