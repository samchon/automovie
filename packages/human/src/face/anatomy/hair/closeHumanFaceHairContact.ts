import type { IHumanFaceHairContactSurface } from "./IHumanFaceHairContactSurface";

/**
 * A surface closed for hair contact: its current positions with one centre vertex appended per loop, and its triangles followed by a fan from each centre over its loop's directed rim edges.
 *
 * The centre is the loop's current vertex centroid, and each fan triangle keeps the direction its rim edge had in the authored closure, so the cap is wound as the closure was. A fan from the centre stays embedded as long as the rim stays star-shaped about it, which a shape bending the rim out of its plane preserves where a fixed triangulation of the flat rim may fold; a fan triangle facing against the rim's own area vector means the rim is not, and it refuses rather than return a folded cap. Pure: returns new arrays.
 *
 * @evidence contracts/common.md#principled-implementation Current boundary-loop centroids add directed fan caps to the original surface triangles.
 * @evidence contracts/common.md#clear-and-simple-design Neutral rim identity selects closures while current coordinates determine every cap.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A nonpositive fan orientation refuses; star-shaped rim orientation is a premise and this check does not prove arbitrary global embeddedness.
 * @evidence contracts/common.md#meaningful-documentation Original positions/indices are preserved as prefixes and the result owns new arrays.
 * @evidence contracts/performance.md#efficient-algorithms Each rim contributes linear centroid, area-vector and triangle work.
 * @evidence contracts/performance.md#reuse-equivalent-work One computed centroid and Newell area vector serve all fan triangles of that loop.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only returned coordinate/incidence arrays persist; loop and original buffers stay caller-owned.
 */
export function closeHumanFaceHairContact(
  positions: readonly number[],
  indices: readonly number[],
  loops: readonly (readonly [number, number][])[],
): IHumanFaceHairContactSurface {
  const out: number[] = [...positions];
  const triangles: number[] = [...indices];
  const at: (v: number) => number[] = (v: number): number[] =>
    [0, 1, 2].map((k: number): number => out[3 * v + k]!);
  for (const loop of loops) {
    const centre: number = out.length / 3;
    const sum: number[] = [0, 0, 0];
    for (const [a] of loop)
      for (let k: number = 0; k < 3; ++k) sum[k]! += positions[3 * a + k]!;
    out.push(...sum.map((value: number): number => value / loop.length));
    // The rim's own area vector (Newell) is the cap's side; every fan
    // triangle must face it, which is the rim being star-shaped about its
    // centre. A rim bent past that has no embedded fan, and a folded cap
    // would read empty space as inside, so it refuses by name.
    const area: number[] = [0, 0, 0];
    for (const [a, b] of loop) {
      const p: number[] = at(a);
      const q: number[] = at(b);
      area[0]! += (p[1]! - q[1]!) * (p[2]! + q[2]!);
      area[1]! += (p[2]! - q[2]!) * (p[0]! + q[0]!);
      area[2]! += (p[0]! - q[0]!) * (p[1]! + q[1]!);
    }
    const c: number[] = at(centre);
    for (const [a, b] of loop) {
      const p: number[] = at(a);
      const q: number[] = at(b);
      const u: number[] = [0, 1, 2].map((k: number): number => q[k]! - p[k]!);
      const w: number[] = [0, 1, 2].map((k: number): number => c[k]! - p[k]!);
      const n: number[] = [
        u[1]! * w[2]! - u[2]! * w[1]!,
        u[2]! * w[0]! - u[0]! * w[2]!,
        u[0]! * w[1]! - u[1]! * w[0]!,
      ];
      if (!(n[0]! * area[0]! + n[1]! * area[1]! + n[2]! * area[2]! > 0))
        throw new Error(
          "The hair contact opening is not star-shaped about its centre, so no cap closes it embedded.",
        );
      triangles.push(a, b, centre);
    }
  }
  return { positions: out, indices: triangles };
}
