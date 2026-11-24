import { segmentSegmentDistance } from "@automovie/engine";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import {
  HumanColliders,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { nclose } from "../../../../features/internal/nclose";
import { qclose } from "../../../../features/internal/qclose";
import { vclose } from "../../../../features/internal/vclose";

/**
 * Two crossing capsule axes determine clearance by subtracting their radii.
 *
 * Scenarios:
 * 1. Evaluate the operation at the interior and the limiting case.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Two crossing capsule axes determine clearance by subtracting their radii.
 * @evidence contracts/development/testing.md#independent-expectations The segment closest points both project onto the origin, so their distance is the height offset. The radii sum to a quarter metre.
 * @evidence contracts/development/testing.md#distinguishing-cases The boundary outcome distinguishes physical change from normalization.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_collision_observation(): void {
  const body = motionHumanBody("m-average");
  const posture = AutoMovieMotionHumanStance.stand.posture(
    body,
    { x: 0, y: 0, z: 0 },
    0,
  );
  const standing = poseBones(body, resolveHumanPosture(body, posture));
  const crown = {
    ...standing.get("head")!.worldPosition,
    y: standing.get("head")!.worldPosition.y + 1.3,
  };
  const distance = HumanColliders.distance(body, standing, crown).distance;
  TestValidator.predicate(
    "point and zero-length segment above the head",
    distance >= 0.9 &&
      distance ===
        HumanColliders.distanceToSegment(body, standing, crown, crown).distance,
  );
  TestValidator.predicate(
    "standing colliders meet the floor",
    Math.abs(HumanColliders.lowest(body, standing)) <= 0.01,
  );
  const bones = (rise: number) =>
    poseBones(
      body,
      resolveHumanPosture(body, {
        ...posture,
        root: { ...posture.root, y: posture.root.y + rise },
        limbs: {},
      }),
    );
  const ground = bones(0),
    raised = bones(0.25);
  const flat = HumanColliders.placed(body, ground),
    up = HumanColliders.placed(body, raised);
  TestValidator.predicate(
    "vertical lift preserves every collider frame",
    flat.length === body.profile.segments.length &&
      up.length === flat.length &&
      up.every((s, i) => {
        const other = flat[i]!.pose;
        return (
          vclose(
            s.pose.position,
            { ...other.position, y: other.position.y + 0.25 },
            1e-9,
          ) && qclose(s.pose.rotation, other.rotation, 1e-12)
        );
      }) &&
      nclose(
        HumanColliders.lowest(body, raised) -
          HumanColliders.lowest(body, ground),
        0.25,
        1e-9,
      ),
  );
  const pelvis = flat.find((s) => s.bone === "hips")!.pose.position;
  const from = { ...pelvis, x: pelvis.x - 0.5 },
    to = { ...pelvis, x: pelvis.x + 0.5 };
  const interior = HumanColliders.distance(body, ground, pelvis).distance;
  TestValidator.predicate(
    "a segment through an interior point penetrates at least that deeply",
    interior < 0 &&
      HumanColliders.distanceToSegment(body, ground, from, to).distance <=
        interior + 1e-9,
  );
  const separation = (offset: number): number =>
    segmentSegmentDistance(
      { x: -1, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: offset, z: -1 },
      { x: 0, y: offset, z: 1 },
    ) - 0.25;
  for (const [offset, gap] of [
    [0.5, 0.25],
    [0.25, 0],
    [0.125, -0.125],
  ] as const)
    TestValidator.predicate("surface gap", nclose(separation(offset), gap));
  const clearance = (t: number): number =>
    separation(0.125 + 4 * (t - 0.5) ** 2);
  TestValidator.predicate(
    "interior overlap despite clear endpoints",
    clearance(0) > 0 && clearance(0.5) < 0 && clearance(1) > 0,
  );
}
