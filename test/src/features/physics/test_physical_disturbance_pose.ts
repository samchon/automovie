import {
  preparePhysicalDisturbanceSpan as Span,
  Vector3,
  physicalSpanPose,
  physicalSupportPoint,
} from "@automovie/engine";
import type {
  IAutoMovieSamplePhysicalTarget,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalDisturbance } from "../internal/PhysicalDisturbance";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";

/**
 * A body's pose synthesized from its push response (`physicalSpanPose`) is one
 * rigid body chain standing on the response's feet: the four-support
 * primitive standing on two diagonal supports, its 0.24 x 0.2 m boxes, pushed
 * forward at 2 m/s, the capture point past their front edge, the response
 * prepared from its own feet, centre of mass and omega, sampled through the
 * swing.
 *
 * Scenarios:
 *
 * 1. Forward kinematics: at every sample every joint's two anchors, its parent
 *    frame on the parent's pose and its child frame on the child's, meet within
 *    a millimetre.
 * 2. Feet: each foot's endpoint lies at the response's place for it within a
 *    millimetre: the swing foot on its curve, the stance foot where it stands.
 * 3. Planted: the stance foot's endpoint does not move through the swing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the input and each geometric condition.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `physicalSpanPose` on samples of `preparePhysicalDisturbanceSpan` and reads the segment poses it returns.
 * @evidence contracts/development/testing.md#independent-expectations The joint anchors from the profile's own joint frames, the feet from the response's own samples, and a stance foot at rest are the requirements of a rigid chain on a planted foot; the millimetre is ten times the leg fit's tolerance.
 * @evidence contracts/development/testing.md#distinguishing-cases A segment carried without its parent fails 1, a leg fit that misses its foot fails 2, and a stance foot dragged by the carried pelvis fails 3; the response's own curves are `test_physical_disturbance_span`'s.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation on the synthetic primitive profile; no figure build, world, simulation, viewer or file host.
 */
export function test_physical_disturbance_pose(): void {
  const subject: PhysicalDisturbance.ISubject = PhysicalDisturbance.planted(
    PhysicalModelFixtures.quadrupod(),
    { "support-0": ["support-0"], "support-3": ["support-3"] },
  );
  const body = subject.body();
  const limbs = body.balance!.pattern.limbs;
  const goals: Record<string, IAutoMovieSamplePhysicalTarget.IResult> =
    Object.fromEntries(
      Object.entries(subject.targets).map(([bone, pose]) => [
        bone,
        {
          pose,
          velocity: { x: 0, y: 0, z: 0 },
          angularVelocity: { x: 0, y: 0, z: 0 },
        },
      ]),
    );
  const endpoint = (
    poses: Record<string, IAutoMovieSamplePhysicalTarget.IResult>,
    bone: string,
  ): IAutoMovieVector3 =>
    physicalSupportPoint(
      poses[bone]!.pose,
      limbs.find((limb) => limb.bone === bone)!.localPoint,
    );
  const center: IAutoMovieVector3 = PhysicalDisturbance.centerOf(
    subject.profile,
    subject.targets,
  );
  const omega: number = PhysicalDisturbance.omegaOf(subject);
  const placed = limbs.map((limb) => endpoint(goals, limb.bone));
  const middle: number = (placed[0]!.x + placed[1]!.x) / 2;
  const span: Span.ISpan = Span({
    seconds: 0.2,
    center,
    velocity: { x: 0, y: 0, z: 2 },
    omega,
    mass: subject.profile.mass,
    gravity: 9.81,
    feet: limbs.map((limb, i: number): Span.IFoot => ({
      bone: limb.bone,
      side: placed[i]!.x > middle ? "left" : "right",
      frame: {
        origin: { x: placed[i]!.x, z: placed[i]!.z },
        forward: { x: 0, z: 1 },
      },
      polygon: [
        { x: -0.1, y: -0.12 },
        { x: 0.1, y: -0.12 },
        { x: 0.1, y: 0.12 },
        { x: -0.1, y: 0.12 },
      ],
    })),
    authored: {
      position: { x: center.x, z: center.z },
      velocity: { x: 0, z: 0 },
    },
    maximumStep: 0.6,
    reactionSeconds: 0,
    floor: 0,
  });
  const trigger = span.branches.find((branch) => branch.kind === "trigger");
  const touchdown = span.branches.find((branch) => branch.kind === "touchdown");
  TestValidator.predicate("the push steps", !!trigger && !!touchdown);
  if (!trigger || !touchdown) return;
  const failures: string[] = [];
  const stance: string = limbs.find((limb) => limb.bone !== trigger.bone)!.bone;
  let planted: IAutoMovieVector3 | undefined;
  for (const share of [0.1, 0.4, 0.7, 0.95]) {
    const t: number =
      trigger.seconds + share * (touchdown.seconds - trigger.seconds);
    const sample: Span.ISample = span.sample(t);
    const pose = physicalSpanPose({ body, goals, sample });
    for (const joint of subject.profile.joints) {
      const parent = pose[joint.parent];
      const child = pose[joint.child];
      if (!parent || !child) continue;
      const gap: number = Vector3.length(
        Vector3.subtract(
          physicalSupportPoint(parent.pose, joint.parentFrame.position),
          physicalSupportPoint(child.pose, joint.childFrame.position),
        ),
      );
      if (gap > 1e-3)
        failures.push(`${t.toFixed(3)} s: ${joint.parent}-${joint.child} anchors ${gap} m apart`);
    }
    for (const limb of limbs) {
      const at: IAutoMovieVector3 = endpoint(pose, limb.bone);
      const goal: IAutoMovieVector3 = sample.feet[limb.bone]!;
      const miss: number = Math.hypot(at.x - goal.x, at.z - goal.z);
      if (miss > 1e-3)
        failures.push(`${t.toFixed(3)} s: ${limb.bone} ${miss} m off its place`);
    }
    const foot: IAutoMovieVector3 = endpoint(pose, stance);
    if (planted && Vector3.length(Vector3.subtract(foot, planted)) > 1e-3)
      failures.push(`${t.toFixed(3)} s: the stance foot ${stance} moved`);
    planted ??= foot;
  }
  TestValidator.equals("span pose", failures, []);
}
