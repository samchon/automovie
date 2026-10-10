import { humanSkinRegion } from "../basis/humanSkinRegion";
import type { IAutoMovieHumanHeadReading } from "./IAutoMovieHumanHeadReading";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";

/**
 * Read an auricle's length, in metres: ANSUR II 6.4.32 (Hotzman et al. 2011,
 * p. 108), "the length of the right ear from its highest to lowest points on a
 * line parallel to the long axis of the ear". The highest and lowest points of
 * the named ear area (superaurale and subaurale; Farkas's sa and sba are named
 * only as the corresponding points) are found on each skin, and the reading is
 * the straight distance between them, which takes the long axis as the line
 * through those two points (a stated convention for the axis). A missing or
 * misplaced area refuses by name.
 */
export function readHumanEarLength(
  head: IAutoMovieHumanHeadSkin,
  region: string,
): IAutoMovieHumanHeadReading {
  const area = humanSkinRegion(head, region);
  if (area.surface !== head.surface)
    throw new Error(
      `The skin region ${region} of ${head.id} is not on the head view skin the rules read.`,
    );
  const p = head.positions;
  let top = area.vertices[0];
  let bottom = area.vertices[0];
  for (const v of area.vertices) {
    if (p[v * 3 + 1] > p[top * 3 + 1]) top = v;
    if (p[v * 3 + 1] < p[bottom * 3 + 1]) bottom = v;
  }
  const at = (v: number) => ({ x: p[v * 3], y: p[v * 3 + 1], z: p[v * 3 + 2] });
  const a = at(top);
  const b = at(bottom);
  return {
    metres: Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z),
    points: { superaurale: a, subaurale: b },
  };
}
