import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanColliders,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The placed colliders a forearm is read against (`HumanColliders`) on real
 * bodies in the quiet stance, split from
 * `test_human_motion_posture_arm_clearance`.
 *
 * The colliders are the profile's: a segment's distance never exceeds the
 * least distance of points sampled along it, nor falls below that least less
 * half the sampling step (a signed distance moves no faster than the point);
 * the stance stands on the floor within the skin's 10 mm; lifting the root
 * lifts the lowest point and every placed segment by as much.
 *
 * Scenarios, per body of `motionHumanBody.EXTREMES`:
 * 1. `distance` is the zero-length `distanceToSegment`; a point 1 m above the
 *    crown is at least 0.9 m off and the hips' frame lies inside.
 * 2. A segment's distance is bracketed by its samples.
 * 3. The stance's `lowest` point is within 10 mm of the floor.
 * 4. Lifting the root by 0.25 m lifts `lowest` and every `placed` position by
 *    0.25 m and leaves every rotation, one placed segment per profile
 *    segment.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places real bodies and calls each public collider function; a misplaced collider, a distance that is not the segment's or a lift that moves a rotation fails with its body.
 * @evidence contracts/development/testing.md#independent-expectations Every expected value follows from the documented rule: the segment's samples, the floor and the lift.
 * @evidence contracts/development/testing.md#distinguishing-cases Four bodies; a point above the crown, the hips' frame, a segment through the trunk, the stance and a lifted root.
 * @evidence contracts/development/testing.md#execution-ownership In memory on in-process bodies. The test program discovers every `test_` function under `features`, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 4 scenarios with their bounds.
 */
export function test_human_motion_posture_colliders(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const name of motionHumanBody.EXTREMES) {
    const body: IHumanBody = motionHumanBody(name);
    const posture: IHumanPosture = stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
    const pose: IAutoMoviePose = resolveHumanPosture(body, posture);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      pose,
    );
    const placed: HumanColliders.IPlaced[] = HumanColliders.placed(body, bones);
    const toward = (
      from: IAutoMovieVector3,
      x: number,
      y: number,
      z: number,
    ): IAutoMovieVector3 => ({ x: from.x + x, y: from.y + y, z: from.z + z });

    // 8. The colliders.
    const crown: IAutoMovieVector3 = toward(
      bones.get("head")!.worldPosition,
      0,
      1.3,
      0,
    );
    complaints.check(
      `${name}: distance is the zero-length segment's`,
      HumanColliders.distance(body, bones, crown).distance ===
        HumanColliders.distanceToSegment(body, bones, crown, crown).distance,
    );
    complaints.check(
      `${name}: a point a metre above the crown is ${HumanColliders.distance(body, bones, crown).distance.toFixed(3)} m off`,
      HumanColliders.distance(body, bones, crown).distance >= 0.9,
    );
    const hips: HumanColliders.IPlaced = placed.find((s) => s.bone === "hips")!;
    complaints.check(
      `${name}: the hips' frame lies inside`,
      HumanColliders.distance(body, bones, hips.pose.position).distance < 0,
    );
    const a: IAutoMovieVector3 = toward(hips.pose.position, 0.5, 0.1, 0.3);
    const b: IAutoMovieVector3 = toward(hips.pose.position, -0.5, 0.3, 0.1);
    let least: number = Infinity;
    const SAMPLES: number = 40;
    for (let i: number = 0; i <= SAMPLES; i++) {
      const s: number = i / SAMPLES;
      least = Math.min(
        least,
        HumanColliders.distance(body, bones, {
          x: a.x + (b.x - a.x) * s,
          y: a.y + (b.y - a.y) * s,
          z: a.z + (b.z - a.z) * s,
        }).distance,
      );
    }
    const step: number = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) / SAMPLES;
    const segment: number = HumanColliders.distanceToSegment(
      body,
      bones,
      a,
      b,
    ).distance;
    complaints.check(
      `${name}: a segment's distance ${segment.toFixed(4)} is bracketed by its samples' least ${least.toFixed(4)} and half a step ${(step / 2).toFixed(4)} under it`,
      segment <= least + 1e-9 && segment >= least - step / 2 - 1e-9,
    );
    const lowest: number = HumanColliders.lowest(body, bones);
    complaints.check(
      `${name}: the stance's lowest point is ${(lowest * 1000).toFixed(2)} mm off the floor`,
      Math.abs(lowest) <= 0.01,
    );
    const lifted: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(
        body,
        resolveHumanPosture(body, {
          ...posture,
          root: toward(posture.root, 0, 0.25, 0),
          limbs: {},
        }),
      );
    const flat: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      resolveHumanPosture(body, { ...posture, limbs: {} }),
    );
    complaints.check(
      `${name}: lifting the root lifts the lowest point by 0.25 m`,
      Math.abs(
        HumanColliders.lowest(body, lifted) -
          HumanColliders.lowest(body, flat) -
          0.25,
      ) <= 1e-9,
    );
    const up: HumanColliders.IPlaced[] = HumanColliders.placed(body, lifted);
    const down: HumanColliders.IPlaced[] = HumanColliders.placed(body, flat);
    complaints.check(
      `${name}: one placed segment per profile segment`,
      down.length === body.profile.segments.length && up.length === down.length,
    );
    complaints.check(
      `${name}: lifting the root lifts every placed segment and keeps its rotation`,
      up.every((s: HumanColliders.IPlaced, i: number): boolean => {
        const d: HumanColliders.IPlaced = down[i]!;
        return (
          Math.abs(s.pose.position.x - d.pose.position.x) <= 1e-9 &&
          Math.abs(s.pose.position.y - d.pose.position.y - 0.25) <= 1e-9 &&
          Math.abs(s.pose.position.z - d.pose.position.z) <= 1e-9 &&
          Math.abs(s.pose.rotation.x - d.pose.rotation.x) <= 1e-9 &&
          Math.abs(s.pose.rotation.y - d.pose.rotation.y) <= 1e-9 &&
          Math.abs(s.pose.rotation.z - d.pose.rotation.z) <= 1e-9 &&
          Math.abs(s.pose.rotation.w - d.pose.rotation.w) <= 1e-9
        );
      }),
    );
  }
  complaints.assert("every collider is placed and read as documented");
}
