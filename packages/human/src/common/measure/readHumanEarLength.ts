import type { IAutoMovieVector3 } from "@automovie/interface";

import { humanHeadRegionVertices } from "./humanHeadRegionVertices";
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
 * misplaced, empty or nonfinite resident area refuses through the shared region reader.
 *
 * @evidence contracts/common.md#principled-implementation Admitted nonempty finite ear-region vertices supply highest/lowest rest Y points, and their straight distance follows the declared long-axis convention. Canonical region admission refuses missing, misplaced, empty or nonfinite source areas.
 * @evidence contracts/common.md#clear-and-simple-design The existing region owner now supplies the same membership validity used by other auricle instruments; this reader owns extrema and distance only.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source extrema replace no study average, and invalid regions no longer silently produce a NaN measurement through a duplicate weaker lookup.
 * @evidence contracts/common.md#meaningful-documentation The prose gives metre units, highest/lowest roles, long-axis convention and canonical source-region refusal rather than claiming recovered clinical endpoints.
 * @evidence contracts/performance.md#efficient-algorithms For R registered ear vertices, shared admission plus one top/bottom scan costs O(R) time and O(R) gathered indices, with constant result storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Both extrema share one admitted list and one scan; the canonical region helper replaces duplicate lookup/admission logic without a cached anatomical reading.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The temporary vertex list becomes unreachable after output construction, while two fresh marker vectors and the scalar transfer to the caller without skin-buffer or task retention.
 */
export function readHumanEarLength(
  head: IAutoMovieHumanHeadSkin,
  region: string,
): IAutoMovieHumanHeadReading {
  const vertices: number[] = humanHeadRegionVertices(head, [region]);
  const p: number[] = head.positions;
  let top: number = vertices[0];
  let bottom: number = vertices[0];
  for (const v of vertices) {
    if (p[v * 3 + 1] > p[top * 3 + 1]) top = v;
    if (p[v * 3 + 1] < p[bottom * 3 + 1]) bottom = v;
  }
  const at: (v: number) => IAutoMovieVector3 = (v: number): IAutoMovieVector3 => ({ x: p[v * 3], y: p[v * 3 + 1], z: p[v * 3 + 2] });
  const a: IAutoMovieVector3 = at(top);
  const b: IAutoMovieVector3 = at(bottom);
  return {
    metres: Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z),
    points: { superaurale: a, subaurale: b },
  };
}
