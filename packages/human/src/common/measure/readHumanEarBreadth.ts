import type { IAutoMovieVector3 } from "@automovie/interface";

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
 *
 * @evidence contracts/common.md#principled-implementation The +Z and -Z extremes of one admitted rest-ear region supply preaurale/postaurale, and their Euclidean distance reports breadth. Rest orientation approximates source-study positioning rather than proving clinical landmark identity.
 * @evidence contracts/common.md#clear-and-simple-design humanHeadRegionVertices owns region validity; this reader owns the two extrema, distance and named marker points.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source-study average or expected auricle width replaces the mesh-derived reading; missing or invalid registration refuses.
 * @evidence contracts/common.md#meaningful-documentation The comment defines the ear roles, anterior/posterior convention, rest-orientation approximation, metre units and source refusal.
 * @evidence contracts/performance.md#efficient-algorithms For R ear memberships, admission and a single two-extreme scan cost O(R) time with O(R) gathered membership storage and fixed vector output.
 * @evidence contracts/performance.md#reuse-equivalent-work Both extremes share one complete region scan, and the source lookup policy is reused; no cached breadth assumes a head shape stayed unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The gathered list is local and two coordinate markers plus a scalar transfer to the caller; no mesh buffer, native handle or running work is acquired.
 */
export function readHumanEarBreadth(
  head: IAutoMovieHumanHeadSkin,
  region: string,
): IAutoMovieHumanHeadReading {
  const vertices: number[] = humanHeadRegionVertices(head, [region]);
  const p: number[] = head.positions;
  let front: number = vertices[0];
  let back: number = vertices[0];
  for (const v of vertices) {
    if (p[v * 3 + 2] > p[front * 3 + 2]) front = v;
    if (p[v * 3 + 2] < p[back * 3 + 2]) back = v;
  }
  const at: (v: number) => IAutoMovieVector3 = (
    v: number,
  ): IAutoMovieVector3 => ({ x: p[v * 3], y: p[v * 3 + 1], z: p[v * 3 + 2] });
  const a: IAutoMovieVector3 = at(front);
  const b: IAutoMovieVector3 = at(back);
  return {
    metres: Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z),
    points: { preaurale: a, postaurale: b },
  };
}
