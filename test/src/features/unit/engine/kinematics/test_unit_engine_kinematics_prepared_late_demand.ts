import {
  preparePoseResolution,
  prepareSkeletonPoseResolution,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../../../internal/createSkeleton";
import { joint } from "../../../internal/joint";
import { makePose } from "../../../internal/makePose";
import { vclose } from "../../../internal/vclose";

/**
 * A demanded frame reads every current ancestor even when it was first
 * observed late, or its ancestor changed during another branch's query.
 *
 * Scenarios:
 * 1. Empty-demand queries change chest twist90 then-90 (a new chest record,
 *    admitted records being values). The first later left
 *    hand observes the current Y-90, mapping its0.75m horizontal reach to+Z.
 * 2. After observing an ordinary left hand, a right-forearm query changes the
 *    left upper arm to Y90. A later left query needs the changed arm despite
 *    no new authored change in that last query. Root translation during a
 *    right-forearm read similarly remains visible to a later left query.
 * 3. A fixed baseline chestY90 is overridden only under empty demand. Omitted
 *    edits restore that baseline before the first demanded frame. Later
 *    left/right demand changes and edit removal retain the same rule.
 */
export function test_unit_engine_kinematics_prepared_late_demand(): void {
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  const rig: ReturnType<typeof prepareSkeletonPoseResolution> = prepareSkeletonPoseResolution(skeleton);
  const operation: ReturnType<typeof preparePoseResolution> = preparePoseResolution();
  const empty: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>();
  const left: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>(["leftHand"]);
  const right: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>(["rightLowerArm"]);
  const pose: IAutoMoviePose = makePose([joint("chest", { twist: 90 })]);
  TestValidator.equals("first empty demand publishes no frame", rig.resolve(pose, operation, empty).length, 0);
  // An admitted record is a value: the changed chest is a new record.
  pose.joints[0] = joint("chest", { twist: -90 });
  TestValidator.equals("a changed but unobserved ancestor still has empty output", rig.resolve(pose, operation, empty).length, 0);
  point(rig.resolve(pose, operation, left), "leftHand", { x: 0, y: 1.4, z: 0.75 });

  pose.joints = [];
  point(rig.resolve(pose, operation, left), "leftHand", { x: 0.75, y: 1.4, z: 0 });
  pose.joints = [joint("leftUpperArm", { twist: 90 })];
  point(rig.resolve(pose, operation, right), "rightLowerArm", { x: -0.5, y: 1.4, z: 0 });
  point(rig.resolve(pose, operation, left), "leftHand", { x: 0.2, y: 1.4, z: -0.55 });
  pose.root = { translation: { x: 2, y: 3, z: 4 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 } };
  point(rig.resolve(pose, operation, right), "rightLowerArm", { x: 1.5, y: 4.4, z: 4 });
  point(rig.resolve(pose, operation, left), "leftHand", { x: 2.2, y: 4.4, z: 3.45 });

  const fixed: ReturnType<typeof rig.preparePose> = rig.preparePose(makePose([joint("chest", { twist: 90 })]));
  TestValidator.equals("an unobserved baseline override needs no output frame",
    fixed.resolve([joint("chest", { twist: 0 })], empty).length, 0);
  point(fixed.resolve([], left), "leftHand", { x: 0, y: 1.4, z: -0.75 });
  point(fixed.resolve([joint("chest", { twist: -90 })], right), "rightLowerArm", { x: 0, y: 1.4, z: -0.5 });
  point(fixed.resolve([], left), "leftHand", { x: 0, y: 1.4, z: -0.75 });
}

/** Observe only the explicitly demanded name and its independent world-metre position. */
function point(readings: readonly IAutoMovieResolvedBone[], name: AutoMovieHumanoidBone, expected: IAutoMovieVector3): void {
  TestValidator.predicate(`late demanded ${name} observes actual current ancestry at ${JSON.stringify(expected)}`,
    readings.length === 1 && readings[0]!.bone === name && vclose(readings[0]!.worldPosition, expected, 1e-12));
}
