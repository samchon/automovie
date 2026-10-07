import type { IHumanFaceHairContactSurface } from "./IHumanFaceHairContactSurface";

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
 * @evidence contracts/common.md#principled-implementation A cap is a fan from
 *   the loop's vertex centroid over its directed rim edges, each triangle
 *   winding as the authored closure wound that edge. The fan is embedded when
 *   the rim is star-shaped about the centre, and every fan triangle is required
 *   to face the same way as the rim's area vector, computed by the Newell
 *   formula. That is exactly the test that no fan triangle folds against the
 *   rim's mean plane, and it refuses otherwise. It does not prove that the cap
 *   misses the rest of the surface; the shared source and deformation still own
 *   embeddedness, as the signed query's contract says.
 * @evidence contracts/common.md#clear-and-simple-design A pure function from
 *   positions, indices and loops to new arrays; the loops are found once
 *   elsewhere and the cap is rebuilt for each current shape because the authored
 *   triangulation of the flat rim can fold when the rim bends.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special
 *   case for a subject or shape: a rim that is not star-shaped refuses and no
 *   repair is applied.
 * @evidence contracts/common.md#meaningful-documentation The comment states
 *   the construction, the winding, the star-shape condition, the refusal and
 *   purity.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The
 *   function computes a value and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function
 *   defines no channel and reads the hairstyle document's fields without varying
 *   a form; the document type owns their meaning.
 * @evidence contracts/modeling.md#emitted-geometry One appended vertex per
 *   loop and one triangle per rim edge, so the cap grows with the opening's rim
 *   length and with nothing a hairstyle authors.
 * @evidence contracts/modeling.md#spatial-conventions Positions are the
 *   resident surface's metres in the head frame and the centre is their mean, so
 *   no conversion happens.
 * @evidence contracts/modeling.md#shared-boundaries The cap reuses the rim's
 *   own vertex ids, so it meets the skin at the identical vertices with neither
 *   gap nor overlap, whatever the current shape moves them to. The join opens,
 *   and the function refuses, when the current rim is no longer star-shaped
 *   about its centroid.
 * @evidenceExclude contracts/modeling.md#rendered-observation The cap is a
 *   collision surface only: the result feeds the signed contact query and is
 *   never given to the viewer, so nothing here is displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries
 *   no anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The refusal of a rim
 *   that is not star-shaped is a geometric condition on the cap and not an
 *   anatomical admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input
 *   shapes a human form through this function; it reads quantities the hairstyle
 *   document already names and admits.
 */
export function closeHumanFaceHairContact(
  positions: readonly number[],
  indices: readonly number[],
  loops: readonly (readonly [number, number][])[],
): IHumanFaceHairContactSurface {
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
