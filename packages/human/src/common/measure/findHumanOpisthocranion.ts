import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";

/**
 * Find the opisthocranion on a head view at rest: the point of the
 * midsagittal section farthest from the glabella, among the section points at
 * or above a floor height.
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
 */
export function findHumanOpisthocranion(
  head: IAutoMovieHumanHeadSkin,
  glabella: IAutoMovieVector3,
  floor: number,
): IAutoMovieVector3 {
  const p = head.positions;
  let best: IAutoMovieVector3 | undefined;
  let bestDistance = -Infinity;
  for (let t = 0; t < head.indices.length; t += 3)
    for (let k = 0; k < 3; k++) {
      const a = head.indices[t + k];
      const b = head.indices[t + ((k + 1) % 3)];
      const da = p[a * 3] - glabella.x;
      const db = p[b * 3] - glabella.x;
      if (da >= 0 === db >= 0) continue;
      const s = da / (da - db);
      const point = {
        x: p[a * 3] + s * (p[b * 3] - p[a * 3]),
        y: p[a * 3 + 1] + s * (p[b * 3 + 1] - p[a * 3 + 1]),
        z: p[a * 3 + 2] + s * (p[b * 3 + 2] - p[a * 3 + 2]),
      };
      if (point.y < floor) continue;
      const distance = Math.hypot(
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
