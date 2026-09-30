import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * How many triangles of a ribbon face against the skin they join, and the
 * longest edge any of them has.
 *
 * `points[i]` and `normals[i]` (flat XYZ, three numbers per point) are the
 * ribbon's local vertex `i` and the unit normal of the skin surface that owns
 * that vertex. A triangle is folded when its own normal, from its winding,
 * points against the normal at any of its three corners: a ribbon that runs
 * along a smooth skin agrees with every corner's normal, and one that has
 * turned over, or that joins two surfaces facing opposite ways, opposes some.
 * A triangle whose area is too small to have a direction (its doubled area
 * under one square micrometre) carries no sign and is not counted. The
 * widest gap is the longest triangle edge, which is how far apart the two
 * skins stand where the ribbon is widest.
 *
 * @evidence contracts/common.md#principled-implementation A triangle's normal is the cross product of two edges and its agreement with a vertex normal is the sign of their dot product, so a triangle wound against the skin it lies on is exactly one whose dot with a corner normal is negative; the area floor stops a numerically zero normal from casting a random vote.
 * @evidence contracts/common.md#clear-and-simple-design One loop over the triangles with the two measurements it needs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No triangle is skipped except by the stated area floor, and the floor is a numerical one that no scenario tunes.
 * @evidence contracts/common.md#meaningful-documentation The comment states the rule, the input layout and the floor.
 * @evidence contracts/modeling.md#spatial-conventions Positions in metres, one frame; normals are unit vectors in the same frame.
 * @evidence contracts/modeling.md#shared-boundaries The count and the widest gap are the checks that a ribbon between two skins is a join without a fold or a gap wider than the ribbon's own edge.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function measures a ribbon and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no input a caller shapes a human form with.
 */
export function countHumanRibbonFolds(
  ribbon: readonly number[],
  points: readonly IAutoMovieVector3[],
  normals: readonly number[],
): { folded: number; widestGap: number } {
  let folded = 0;
  let widestGap = 0;
  for (let corner = 0; corner < ribbon.length; corner += 3) {
    const ids = [ribbon[corner], ribbon[corner + 1], ribbon[corner + 2]];
    const [a, b, c] = ids.map((id) => points[id]);
    for (const [p, q] of [
      [a, b],
      [b, c],
      [c, a],
    ])
      widestGap = Math.max(
        widestGap,
        Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z),
      );
    const u = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
    const v = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
    const normal = [
      u.y * v.z - u.z * v.y,
      u.z * v.x - u.x * v.z,
      u.x * v.y - u.y * v.x,
    ];
    if (Math.hypot(normal[0], normal[1], normal[2]) < 1e-12) continue;
    const opposed = ids.some(
      (id) =>
        normal[0] * normals[id * 3] +
          normal[1] * normals[id * 3 + 1] +
          normal[2] * normals[id * 3 + 2] <
        0,
    );
    if (opposed) folded++;
  }
  return { folded, widestGap };
}
