import { AutoMovieEngineVector3, AutoMovieEnginePhysicalSpanPose, AutoMovieEnginePhysics, AutoMovieEnginePhysicalBalance, type AutoMovieEnginePhysicalBalanceTypes } from "@automovie/engine";
import type {
  IAutoMovieSamplePhysicalTarget,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalDisturbance } from "../../internal/PhysicalDisturbance";
import { PhysicalModelFixtures } from "../../internal/PhysicalModelFixtures";

/**
 * How far a span pose's joint, target or planted foot may stand from where it
 * belongs, metres: a millimetre, the support rows' own convergence.
 */
const PLACE: number = 1e-3;

/**
 * A body's pose synthesized from its push response (`AutoMovieEnginePhysicalSpanPose`) is one
 * rigid body chain standing on the response's feet: the four-support primitive
 * standing on two diagonal supports, its 0.24 x 0.2 m boxes, pushed forward at
 * 2 m/s, the capture point past their front edge, the response prepared from
 * its own feet, centre of mass and omega, sampled through the swing.
 *
 * Scenarios:
 *
 * 1. Forward kinematics: at every sample every joint's two anchors, its parent
 *    frame on the parent's pose and its child frame on the child's, meet within
 *    a millimetre.
 * 2. Feet: each foot's endpoint lies at the response's place for it within a
 *    millimetre: the swing foot on its curve, the stance foot where it stands.
 * 3. Planted: the stance foot's endpoint does not move through the swing.
 */
export function test_engine_physics_physical_span_pose(): void {
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
    AutoMovieEnginePhysics.physicalSupportPoint(
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
  const span: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanResult = AutoMovieEnginePhysicalBalance.prepareDisturbanceSpan({
    seconds: 0.2,
    center,
    velocity: { x: 0, y: 0, z: 2 },
    omega,
    mass: subject.profile.mass,
    gravity: 9.81,
    feet: limbs.map(
      (limb, i: number): AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanFoot => ({
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
      }),
    ),
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
    const sample: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanSample = span.sample(t);
    const pose = AutoMovieEnginePhysicalSpanPose.pose({ body, goals, sample });
    for (const joint of subject.profile.joints) {
      const parent = pose[joint.parent];
      const child = pose[joint.child];
      if (!parent || !child) continue;
      const gap: number = AutoMovieEngineVector3.length(
        AutoMovieEngineVector3.subtract(
          AutoMovieEnginePhysics.physicalSupportPoint(parent.pose, joint.parentFrame.position),
          AutoMovieEnginePhysics.physicalSupportPoint(child.pose, joint.childFrame.position),
        ),
      );
      if (gap > PLACE)
        failures.push(
          `${t.toFixed(3)} s: ${joint.parent}-${joint.child} anchors ${gap} m apart`,
        );
    }
    for (const limb of limbs) {
      const at: IAutoMovieVector3 = endpoint(pose, limb.bone);
      const goal: IAutoMovieVector3 = sample.feet[limb.bone]!;
      const miss: number = Math.hypot(at.x - goal.x, at.z - goal.z);
      if (miss > PLACE)
        failures.push(
          `${t.toFixed(3)} s: ${limb.bone} ${miss} m off its place`,
        );
    }
    const foot: IAutoMovieVector3 = endpoint(pose, stance);
    if (planted && AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(foot, planted)) > PLACE)
      failures.push(`${t.toFixed(3)} s: the stance foot ${stance} moved`);
    planted ??= foot;
  }
  TestValidator.equals("span pose", failures, []);
}
