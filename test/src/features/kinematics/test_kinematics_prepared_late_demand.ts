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

import { createSkeleton } from "../internal/createSkeleton";
import { joint } from "../internal/joint";
import { makePose } from "../internal/makePose";
import { vclose } from "../internal/vclose";

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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States current-versus-observed dependency semantics, empty/other-branch intervals, default-Y twist, metre geometry, root placement and fixed-baseline restoration in three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the genuine public prepared rig through one operation and a fixed-source reader, interleaving empty/left/right demands with ancestor/root edits and later restoration. Literal output coordinates detect missing initial ancestry, skipped updates to previously observed inactive frames or stale overlay membership; no revision metadata is read.
 * @evidence contracts/development/testing.md#independent-expectations The existing incomplete fixture has chest height1.4m, left shoulder X0.2m and remaining links0.3m/0.25m. Right-handed Y-90 maps+X to+Z, so chest rotation gives(0,1.4,0.75). Rotating only the left upper arm by Y90 leaves shoulder(.2,1.4,0) and sends the remaining.55m to-Z. Baseline chestY90 gives(0,1.4,-.75); adding root(2,3,4) gives(2.2,4.4,3.45) for the upper-arm-only turn. The existing right forearm is at(-.5,1.4,0). Comparisons allow1e-12m trigonometric roundoff.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers never-observed versus previously observed frames, zero versus other-branch demand, changed joints versus unchanged replay, joint membership removal, changed root and fixed-baseline edits/removal. Existing prepared-pose contracts own input admission, snapshots, output mutation and malformed topology behavior.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable kernel unit owns conventional skeleton/poses/demand sets and calls public preparation/resolution only. It adds no producer or internal export, replaces no foreign function/global, and starts no Human, renderer, process or compiler.
 */
export function test_kinematics_prepared_late_demand(): void {
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
