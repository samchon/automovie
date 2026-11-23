import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import type { HumanArmShapes as S } from "./HumanArmShapes";

/**
 * The shapes each audit part of a placed arm may come within a reach of: the
 * part's probes' own bounding sphere (their centroid and the farthest of them,
 * each probe's radius included) against each shape's sphere, over the shapes
 * its segment's screen (`HumanArmShapes.screen`) holds. A hand's segment sphere
 * holds the palm and every finger, so one finger near a surface put every probe
 * of the hand against every shape the hand's sphere touched; a part's sphere
 * leaves a probe only the shapes its own part can reach, the broad phase of a
 * bounding-volume hierarchy one level deeper (Ericson 2005, "Real-Time
 * Collision Detection", chapter 6).
 *
 * @param at The frame.
 * @param placed The arm placed, with its collider probes.
 * @param reach The reach, metres.
 * @param screened The placement's segment screen.
 * @returns For each part a collider probe belongs to, the screen its probes
 *   read, every segment's list that part's own.
 * @evidence contracts/development/common.md#meaningful-documentation States what is screened, why, the source and the result.
 * @evidence contracts/development/implementation.md#principled-implementation A sphere bounding a part's probes lies no nearer a shape than any of them, so a shape beyond the part's sphere by the reach is beyond every probe of it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Group the probes by part, bound each group, filter its segment's screen.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only shapes surely out of reach are left out; every probe's own sphere screen and exact distance stay the caller's.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the probes, then parts times screened shapes, where the probes times screened shapes the segment screen left were read before.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of one placement.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh lists and retains nothing.
 */
export function HumanArmPartScreen(
  at: IAutoMovieMotionHumanArmGeometry.IFrame,
  placed: IAutoMovieMotionHumanArmGeometry.IPlaced,
  reach: number,
  screened: S.IScreen,
): Map<number, S.IScreen> {
  const members: Map<number, number[]> = new Map();
  for (let probe: number = G.SURFACE; probe < placed.probes.length; ++probe) {
    const part: number = at.segments[probe - G.SURFACE]!;
    let list: number[] | undefined = members.get(part);
    if (list === undefined) members.set(part, (list = []));
    list.push(probe);
  }
  const out: Map<number, S.IScreen> = new Map();
  for (const [part, probes] of members) {
    let centre: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const probe of probes)
      centre = Vector3.add(
        centre,
        Vector3.scale(placed.probes[probe]![0], 1 / probes.length),
      );
    let radius: number = 0;
    for (const probe of probes) {
      const [p, r]: readonly [IAutoMovieVector3, number] =
        placed.probes[probe]!;
      radius = Math.max(radius, Vector3.distance(p, centre) + r);
    }
    const owner: "upper" | "lower" | "hand" =
      at.owners[probes[0]! - G.SURFACE]!;
    const shapes: number[] = screened[owner].filter(
      (i: number): boolean =>
        Vector3.distance(centre, at.shapes[i]!.centre) - at.shapes[i]!.radius <
        radius + reach,
    );
    out.set(part, { upper: shapes, lower: shapes, hand: shapes });
  }
  return out;
}
