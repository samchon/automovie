import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Select ascending source triangle ordinals for parallel section stations without changing source arrays or aliasing station lists. Admitted source incidence and a shared finite normal are caller premises; this candidate selector does not certify normal length, anatomical placement or the cutter's resulting metrics.
 *
 * Actual station points use exactly measureHumanSection's subtract-first signed-distance arithmetic, Float64 storage and nonnegative-side convention. A triangle is selected when its corner signs differ, with no padding or additional tolerance. Triangles that contribute cutter crossings retain full-walk source order; the cutter still owns crossing identities, closed-loop assembly and readings. The optional point count must match the original level count, and points locate planes while levels retain station count/order metadata.
 *
 * Legacy calls without points cannot reliably recover those subtract-first planes from absolute levels, so each station conservatively receives every source triangle. This preserves completeness at the cost of walking the full population. Neither path has runtime equivalence evidence from this change; the relationship follows the shared arithmetic in the two source implementations.
 *
 * @evidence contracts/common.md#principled-implementation Actual station points drive the same subtract-first distance and nonnegative sign classification as the cutter; ascending ordinals preserve crossing order. Legacy level-only input returns the complete population rather than relying on an unproven projection margin.
 * @evidence contracts/common.md#clear-and-simple-design This owner selects source ordinals and the cutter owns intersections and metrics; the measurement caller supplies actual shared-normal station points, with levels retained for compatible station identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No expected reading, specimen lookup, fixed padding or new tolerance selects triangles. Without points the conservative population avoids false negatives; normal validity and numerical reading quality remain caller/cutter premises.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes point-driven selection from compatible level-only fallback, gives the point-count refusal, input/list ownership and shared arithmetic, and separates source reasoning from unperformed runtime verification.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices, T triangles, L stations and K listed pairs, point-driven work is O(L(V+T)+K), replacing the former projection/sort shortcut to preserve cutter selection; legacy fallback is O(LT). Storage is O(V+L+K), with worst-case output O(LT).
 * @evidence contracts/performance.md#reuse-equivalent-work One call-local vertex distance buffer is overwritten per station and reused across that station's triangles; vertex arithmetic is performed once per station rather than once per triangle corner. Changed source/planes receive fresh work without a cross-call cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Distances are call-local and only independent station lists escape; their ordinals may occupy O(LT), with no persistent mesh handle, scheduler or resource cap claimed.
 */
export function indexHumanBodySectionTriangles(
  positions: number[],
  indices: number[],
  normal: IAutoMovieVector3,
  levels: number[],
  points?: readonly IAutoMovieVector3[],
): number[][] {
  if (points !== undefined && points.length !== levels.length)
    throw new Error("Section station points must match the level count.");
  const lists: number[][] = levels.map((): number[] => []);
  if (points === undefined) {
    for (const list of lists)
      for (let triangle: number = 0; triangle < indices.length / 3; triangle++)
        list.push(triangle);
    return lists;
  }
  if (points.length === 0) return lists;
  const distance: Float64Array<ArrayBuffer> = new Float64Array(positions.length / 3);
  for (let station: number = 0; station < points.length; station++) {
    const point: IAutoMovieVector3 = points[station];
    for (let vertex: number = 0; vertex < distance.length; vertex++)
      distance[vertex] =
        (positions[vertex * 3] - point.x) * normal.x +
        (positions[vertex * 3 + 1] - point.y) * normal.y +
        (positions[vertex * 3 + 2] - point.z) * normal.z;
    for (let triangle: number = 0; triangle < indices.length / 3; triangle++) {
      const a: boolean = distance[indices[triangle * 3]] >= 0;
      const b: boolean = distance[indices[triangle * 3 + 1]] >= 0;
      const c: boolean = distance[indices[triangle * 3 + 2]] >= 0;
      if (a !== b || a !== c) lists[station].push(triangle);
    }
  }
  return lists;
}
