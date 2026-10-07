/**
 * Flip the free edges of a planar lining triangulation toward the Delaunay
 * condition, and return the triangle indices.
 *
 * The region kernel ear-clips, which leaves long fans radiating from single
 * points, and midpoint refinement keeps their direction. A free edge shared
 * by two counter-clockwise triangles is flipped when the vertex opposite it
 * in one triangle lies strictly inside the circumcircle of the other. That
 * follows Lawson's flip using a relative approximate in-circle predicate;
 * it does not establish exact Delaunay convergence or a minimum-angle optimum.
 * Near-circle determinants within 1e-12 of the computed scale are left alone.
 * A pair whose quadrilateral is not strictly convex is left as
 * it is, because flipping it would fold or flatten a triangle. A triangle
 * with no area, which ear clipping leaves between three collinear outline
 * points, has no circumcircle; its free edge is flipped whenever that gives
 * two triangles with area, so no flat triangle survives where one can be
 * removed. Edges named in `fixed` (keys `"<lower index>:<higher
 * index>"`) and edges on the region's outline are never flipped, so the
 * cervical rings and the outer rim keep their exact edges. No point is
 * added, moved or removed and the covered region is unchanged.
 *
 * The 64-pass cap is a computation bound. It can leave flat or poor cells,
 * and the caller's final source/Float32 rank and collar-sampling gates report
 * those unresolved conditions. Connectivity remains conforming; quality is
 * not established by this function's return.
 *
 * @evidence contracts/common.md#principled-implementation Lawson-style flips improve locally selected diagonals under relative approximate predicates; near-zero sign reliability and the pass cap limit that inference, while final generated rank and sampling admission remain separate.
 * @evidence contracts/common.md#clear-and-simple-design One owner improves triangle shape separately from sampling density and from the height field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Changes connectivity only; no coordinate, boundary edge or tolerance is adjusted to hide a sliver.
 * @evidence contracts/common.md#meaningful-documentation States the flip rule, what is preserved and what the pass bound means.
 * @evidence contracts/modeling.md#emitted-geometry Keeps the point and triangle counts exactly; only the diagonals of triangle pairs change.
 * @evidence contracts/modeling.md#shared-boundaries Fixed and outline edges are untouched, so neighbours sharing them keep identical vertices and edges.
 * @evidence contracts/modeling.md#spatial-conventions Arch-frame plane metres; triangles in and out are counter-clockwise.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Retriangulates one region.
 * @evidenceExclude contracts/modeling.md#parameter-channels Consumes no channel.
 * @evidenceExclude contracts/modeling.md#rendered-observation The oral assembly observes the lining.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Supplies no biological value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Bounds nothing anatomical.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no authoring input.
 */
export function relaxHumanFaceOralLining(
  points: readonly number[][],
  indices: readonly number[],
  fixed: ReadonlySet<string>,
  collar: ReadonlySet<number> = new Set(),
): number[] {
  const current = [...indices];
  const inside = (a: number, b: number, c: number, d: number): boolean => {
    const ax = points[a][0] - points[d][0];
    const ay = points[a][1] - points[d][1];
    const bx = points[b][0] - points[d][0];
    const by = points[b][1] - points[d][1];
    const cx = points[c][0] - points[d][0];
    const cy = points[c][1] - points[d][1];
    const determinant =
      (ax * ax + ay * ay) * (bx * cy - cx * by) -
      (bx * bx + by * by) * (ax * cy - cx * ay) +
      (cx * cx + cy * cy) * (ax * by - bx * ay);
    const scale =
      (ax * ax + ay * ay + bx * bx + by * by + cx * cx + cy * cy) ** 2;
    return determinant > 1e-12 * scale;
  };
  const area = (a: number, b: number, c: number): number =>
    (points[b][0] - points[a][0]) * (points[c][1] - points[a][1]) -
    (points[b][1] - points[a][1]) * (points[c][0] - points[a][0]);
  for (let pass = 0; pass < 64; pass++) {
    // Directed edge "a:b" names the triangle that owns it and its opposite corner.
    const owner = new Map<string, number>();
    for (let at = 0; at < current.length; at += 3)
      for (let k = 0; k < 3; k++)
        owner.set(
          current[at + k] + ":" + current[at + ((k + 1) % 3)],
          at + ((k + 2) % 3),
        );
    const touched = new Set<number>();
    let flips = 0;
    for (const [key, cornerAt] of owner) {
      const [a, b] = key.split(":").map(Number);
      if (a > b || fixed.has(a + ":" + b)) continue;
      const twinAt = owner.get(b + ":" + a);
      if (twinAt === undefined) continue;
      const first = cornerAt - (cornerAt % 3);
      const second = twinAt - (twinAt % 3);
      if (touched.has(first) || touched.has(second)) continue;
      const c = current[cornerAt];
      const d = current[twinAt];
      // A chord between cervical ports needs a field sample. Never recreate
      // that unsampled chord after the refinement owner has split it.
      if (collar.has(c) && collar.has(d)) continue;
      // A flip must leave two properly wound triangles; a quad that is not strictly convex keeps its diagonal.
      const span =
        (points[b][0] - points[a][0]) ** 2 + (points[b][1] - points[a][1]) ** 2;
      const flat =
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
