import type { IAutoMovieHumanHeadReading } from "./IAutoMovieHumanHeadReading";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { humanHeadRegionVertices } from "./humanHeadRegionVertices";

/**
 * Read an auricle's breadth, in metres: "Width of the auricle (Pa-Pra):
 * Distance between post-aurale and pre aurale", with post-aurale "The most
 * dorsal point of the ear" and preaurale "the Most ventral point of the ear"
 * (Meleti Venkata Sowmya et al., J Oral Biol Craniofac Res 2023,
 * PMC10432210, landmarks 3 and 6 and study variable 9). Their cross-sectional
 * study scanned 400 selected people in a northern Indian tertiary-care OPD
 * with VECTRA H2 stereophotogrammetry; its averages are not this skin's values.
 * The most anterior (+Z) and most posterior vertices of the named
 * ear area are found on each skin, and the reading is the straight distance
 * between them. The rest head orientation stands in for the study's Frankfurt
 * positioning, as for every head rule. A missing or misplaced area refuses by
 * name.
 */
export function readHumanEarBreadth(
  head: IAutoMovieHumanHeadSkin,
  region: string,
): IAutoMovieHumanHeadReading {
  const vertices = humanHeadRegionVertices(head, [region]);
  const p = head.positions;
  let front = vertices[0];
  let back = vertices[0];
  for (const v of vertices) {
    if (p[v * 3 + 2] > p[front * 3 + 2]) front = v;
    if (p[v * 3 + 2] < p[back * 3 + 2]) back = v;
  }
  const at = (v: number) => ({ x: p[v * 3], y: p[v * 3 + 1], z: p[v * 3 + 2] });
  const a = at(front);
  const b = at(back);
  return {
    metres: Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z),
    points: { preaurale: a, postaurale: b },
  };
}
