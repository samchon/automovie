import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";

/**
 * Find the opisthocranion on a head view at rest: the point of the
 * midsagittal edge crossing farthest from the glabella, among the represented
 * triangle-edge crossings at or above a floor height.
 *
 * The midsagittal section is the head view cut by the plane through the
 * glabella normal to +X. Each triangle edge whose ends lie on opposite sides
 * contributes its crossing point; a vertex on the plane counts as the positive
 * side, so it is reached as the crossing at its own end. ANSUR II 6.4.48 moves
 * the caliper tip "up and down on the back of the head in the midsagittal
 * plane until the maximum measurement is obtained". The open head view also
 * runs down the neck, whose points can lie farther from the glabella than the
 * occiput, so the search is held to the vault above the Frankfurt plane: the
 * caller passes the tragion height, which stands in for that plane at the
 * back of the head in the rest frame (named approximation). A first maximum
 * along the section would need no floor, but on a flattened occiput the
 * distance from glabella is nearly constant and small undulations of the skin
 * stop such a walk early; a floor does not. A head view with no section point
 * above the floor refuses by name.
 *
 * @evidence contracts/common.md#principled-implementation Opposite-side triangle edges are linearly intersected with the glabella's +X-normal plane, and the farthest crossing above the supplied floor is selected. The tragion-height floor approximates the posterior Frankfurt bound rather than certifying a clinical plane.
 * @evidence contracts/common.md#clear-and-simple-design The reader owns one section-extremum operation while length/circumference callers own glabella and floor choice.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts On-plane points count positive and the floor is an explicit source-search approximation; no first local peak or target head length substitutes the actual maximum.
 * @evidence contracts/common.md#meaningful-documentation The prose states midsagittal intersection, floor rationale, rest-frame approximation and refusal without a crossing above it.
 * @evidence contracts/performance.md#efficient-algorithms For T triangles, three edges each are scanned in O(T) time with O(1) retained candidates; a full search is needed to find the farthest admitted crossing.
 * @evidence contracts/performance.md#reuse-equivalent-work Each crossing's distance is computed once and compared to the current best; mutable head geometry or a changed floor does not share a cached maximum.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary crossing records are replaced as needed, and the selected point transfers on return; no edge graph, head buffer, handle or task is retained.
 */
export function findHumanOpisthocranion(
  head: IAutoMovieHumanHeadSkin,
  glabella: IAutoMovieVector3,
  floor: number,
): IAutoMovieVector3 {
  const p: number[] = head.positions;
  let best: IAutoMovieVector3 | undefined;
  let bestDistance: number = -Infinity;
  for (let t: number = 0; t < head.indices.length; t += 3)
    for (let k: number = 0; k < 3; k++) {
      const a: number = head.indices[t + k];
      const b: number = head.indices[t + ((k + 1) % 3)];
      const da: number = p[a * 3] - glabella.x;
      const db: number = p[b * 3] - glabella.x;
      if (da >= 0 === db >= 0) continue;
      const s: number = da / (da - db);
      const point: IAutoMovieVector3 = {
        x: p[a * 3] + s * (p[b * 3] - p[a * 3]),
        y: p[a * 3 + 1] + s * (p[b * 3 + 1] - p[a * 3 + 1]),
        z: p[a * 3 + 2] + s * (p[b * 3 + 2] - p[a * 3 + 2]),
      };
      if (point.y < floor) continue;
      const distance: number = Math.hypot(
        point.x - glabella.x,
        point.y - glabella.y,
        point.z - glabella.z,
      );
      if (distance > bestDistance) {
        bestDistance = distance;
        best = point;
      }
    }
  if (best === undefined)
    throw new Error(
      `The head view of ${head.id} has no midsagittal point above the opisthocranion floor.`,
    );
  return best;
}
