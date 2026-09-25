/**
 * A surface closed for hair contact: its current positions with one centre
 * vertex appended per loop, and its triangles followed by a fan from each
 * centre over its loop's directed rim edges.
 *
 * The centre is the loop's current vertex centroid, and each fan triangle
 * keeps the direction its rim edge had in the authored closure, so the cap
 * is wound as the closure was. A fan from the centre stays embedded as long
 * as the rim stays star-shaped about it, which a shape bending the rim out of
 * its plane preserves where a fixed triangulation of the flat rim may fold;
 * a fan triangle facing against the rim's own area vector means the rim is
 * not, and it refuses rather than return a folded cap. Pure: returns new
 * arrays.
 *
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Keeps the closed hair contact surface embedded under any admitted deformation of its opening.
 */
export function closeHumanFaceHairContact(
  positions: readonly number[],
  indices: readonly number[],
  loops: readonly (readonly [number, number][])[],
): { positions: number[]; indices: number[] } {
  const out = [...positions];
  const triangles = [...indices];
  const at = (v: number) => [0, 1, 2].map((k) => out[3 * v + k]!);
  for (const loop of loops) {
    const centre = out.length / 3;
    const sum = [0, 0, 0];
    for (const [a] of loop)
      for (let k = 0; k < 3; ++k) sum[k]! += positions[3 * a + k]!;
    out.push(...sum.map((value) => value / loop.length));
    // The rim's own area vector (Newell) is the cap's side; every fan
    // triangle must face it, which is the rim being star-shaped about its
    // centre. A rim bent past that has no embedded fan, and a folded cap
    // would read empty space as inside, so it refuses by name.
    const area = [0, 0, 0];
    for (const [a, b] of loop) {
      const p = at(a);
      const q = at(b);
      area[0]! += (p[1]! - q[1]!) * (p[2]! + q[2]!);
      area[1]! += (p[2]! - q[2]!) * (p[0]! + q[0]!);
      area[2]! += (p[0]! - q[0]!) * (p[1]! + q[1]!);
    }
    const c = at(centre);
    for (const [a, b] of loop) {
      const p = at(a);
      const q = at(b);
      const u = [0, 1, 2].map((k) => q[k]! - p[k]!);
      const w = [0, 1, 2].map((k) => c[k]! - p[k]!);
      const n = [
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
