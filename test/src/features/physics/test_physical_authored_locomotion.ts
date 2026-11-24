import {
  AutoMoviePhysicalTracking,
  AutoMovieXpbdBody,
  Quaternion,
  measurePhysicalJointLimits,
  physicalGravityTorques,
  physicalJointMotorCommand,
  physicalSupportPoint,
} from "@automovie/engine";
import { fitHumanPhysicalStandingPose } from "@automovie/human";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieStepPlanner,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalPerformanceFixtures } from "../internal/PhysicalPerformanceFixtures";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";

/**
 * An authored slow walk is one the engine's drives can hold: the engine
 * stickman and the canonical Human from its fitted public Stand, each walking
 * 0.12 m/s for two seconds from planner-placed footfalls (the maintained
 * slow-walk fixture), read at every authored frame with no simulation.
 *
 * Scenarios:
 *
 * 1. Planted supports: while the planner holds a limb planted, its authored
 *    endpoint stays within one percent of the 0.35 m stride of where that
 *    stance began.
 * 2. Holding: at every authored frame, each joint's target lies within two
 *    degrees of its range (`measurePhysicalJointLimits`), the joint bound a
 *    tracked walk keeps, and its drive at that target, with the gravity
 *    moment of everything below it as feed-forward (`physicalGravityTorques`),
 *    forecasts no demand past its torque cap (`physicalJointMotorCommand`).
 *    PD with gravity compensation has its equilibrium at the target
 *    (Takegaki and Arimoto 1981), so a held target leaves no static error
 *    while it is reachable and the compensation fits within the caps.
 * 3. Push: the stickman's root servo (`AutoMoviePhysicalTracking.force`) on
 *    its mass, pushed at 0.15 and 0.3 m/s along the walk, stays below its
 *    force bound, so its displacement scales with the push, the larger
 *    peaking at twice the smaller; and both come back within a millimetre
 *    over the walk's last second.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both walks and each held property with its source.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the planner's phases and the authored targets, and calls `physicalGravityTorques`, `physicalJointMotorCommand` and `AutoMoviePhysicalTracking.force` on the authored poses and the fixture's gains.
 * @evidence contracts/development/testing.md#independent-expectations The slip bound is one percent of the fixture's stride; the range bound is the two degrees a tracked joint keeps of its authored rotation (test_physical_human_profile's bound); the caps are each joint's declared torque; the return is the servo's own discrete closed loop at the substep, x' = x + h v', v' = v + h F / m, whose response is linear below the force bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Two independent providers; a planted foot that drifts fails 1, a target past its joint's range, a gravity moment past a cap or a drive that saturates at its own target fails 2, a servo that saturates or does not converge fails 3. The step function's convergence on light links is `test_physical_xpbd_light_chain`'s, the joint limits' reading `test_physical_joint_chart_velocity`'s.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation on the walk fixture's authored frames; no world, simulation, viewer or file host.
 */
export async function test_physical_authored_locomotion(): Promise<void> {
  const duration: number = 2;
  const stride: number = 0.35;
  const substep: number = 1 / (120 * 32);
  const radian: number = Math.PI / 180;
  const failures: string[] = [];
  const stickman: IAutoMoviePhysicalProfile =
    PhysicalModelFixtures.stickman().profile;
  const human: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const walks: [string, ReturnType<typeof PhysicalPerformanceFixtures.walk>][] =
    [
      ["stickman", PhysicalPerformanceFixtures.walk(stickman, duration)],
      [
        "Human",
        PhysicalPerformanceFixtures.walk(human.profile, duration, 0, stand(human)),
      ],
    ];
  for (const [label, walk] of walks) {
    const profile: IAutoMoviePhysicalProfile = walk.body.profile;
    const targets = walk.body.targets;

    // 1. Planted supports.
    for (const limb of walk.pattern.limbs) {
      let anchor: IAutoMovieVector3 | null = null;
      targets.forEach((target, step: number): void => {
        const state: IAutoMovieStepPlanner.IState = walk.planner.at(
          limb.bone,
          step / 120,
        );
        if (state.phase !== "planted") {
          anchor = null;
          return;
        }
        const point: IAutoMovieVector3 = physicalSupportPoint(
          target.segments[limb.bone]!,
          limb.localPoint,
        );
        anchor ??= point;
        const slip: number = Math.hypot(point.x - anchor.x, point.z - anchor.z);
        if (slip > 0.01 * stride)
          failures.push(`${label}: ${limb.bone} slides ${slip} m at ${step / 120} s`);
      });
    }

    // 2. Holding.
    const order: IAutoMoviePhysicalJoint[] = postorder(profile);
    targets.forEach((target, step: number): void => {
      const poses: Record<string, IAutoMovieRigidTransform> = target.segments;
      const next: Record<string, IAutoMovieRigidTransform> =
        targets[Math.min(step + 1, targets.length - 1)]!.segments;
      const bodies: Map<string, AutoMovieXpbdBody> = new Map(
        profile.segments.map(
          (segment: IAutoMoviePhysicalSegment, i: number): [string, AutoMovieXpbdBody] => {
            const pose: IAutoMovieRigidTransform = poses[segment.bone]!;
            const body: AutoMovieXpbdBody = new AutoMovieXpbdBody(
              i,
              true,
              pose.position,
              pose.rotation,
            );
            body.setMass(
              segment.mass,
              segment.centerOfMass,
              segment.inertia,
              segment.inertiaRotation,
            );
            return [segment.bone, body];
          },
        ),
      );
      const gravity = physicalGravityTorques(profile, order, bodies, {
        x: 0,
        y: -9.81,
        z: 0,
      });
      for (const joint of profile.joints) {
        const relative = (
          set: Readonly<Record<string, IAutoMovieRigidTransform>>,
        ): IAutoMovieQuaternion =>
          Quaternion.multiply(
            Quaternion.inverse(
              Quaternion.multiply(
                set[joint.parent]!.rotation,
                joint.parentFrame.rotation,
              ),
            ),
            Quaternion.multiply(
              set[joint.child]!.rotation,
              joint.childFrame.rotation,
            ),
          );
        const now: IAutoMovieQuaternion = relative(poses);
        const turn: IAutoMovieQuaternion = Quaternion.multiply(
          relative(next),
          Quaternion.inverse(now),
        );
        const sign: number = turn.w < 0 ? -1 : 1;
        const rate: IAutoMovieVector3 = {
          x: 2 * 120 * sign * turn.x,
          y: 2 * 120 * sign * turn.y,
          z: 2 * 120 * sign * turn.z,
        };
        const command = physicalJointMotorCommand({
          joint,
          current: now,
          target: now,
          velocity: rate,
          targetVelocity: rate,
          strength: 1,
          timestep: substep,
          feedForward: gravity.joints.get(joint.id) ?? { x: 0, y: 0, z: 0 },
        });
        if (command.saturated.length > 0)
          failures.push(
            `${label}: ${joint.id} holding its target at ${step / 120} s passes its cap on ${command.saturated.join(",")}`,
          );
        const excess: number = Math.max(
          ...measurePhysicalJointLimits(
            joint,
            poses[joint.parent]!,
            poses[joint.child]!,
          ).map((c): number => c.violation),
        );
        if (excess > 2 * radian)
          failures.push(
            `${label}: ${joint.id}'s target at ${step / 120} s lies ${excess / radian} degrees past its range`,
          );
      }
    });
  }

  // 3. Push.
  const body = walks[0]![1].body;
  const mass: number = stickman.mass;
  const respond = (speed: number): { peak: number; tail: number; force: number } => {
    let x: number = 0;
    let v: number = speed;
    let peak: number = 0;
    let force: number = 0;
    for (let n: number = 0; n < 120 * 32; n++) {
      const f: number = AutoMoviePhysicalTracking.force(
        { x: -x, y: 0, z: 0 },
        { x: v, y: 0, z: 0 },
        mass,
        body.rootStiffness,
        body.rootDamping,
        body.maximumRootForce,
        substep,
      ).x;
      force = Math.max(force, Math.abs(f));
      v += (substep * f) / mass;
      x += substep * v;
      peak = Math.max(peak, Math.abs(x));
    }
    return { peak, tail: Math.abs(x), force };
  };
  const once = respond(0.15);
  const twice = respond(0.3);
  if (!(twice.force < body.maximumRootForce))
    failures.push(`the pushed root servo reaches its bound, ${twice.force} N of ${body.maximumRootForce}`);
  if (!(Math.abs(twice.peak / once.peak - 2) < 0.2))
    failures.push(`the push displaces the root ${once.peak} and ${twice.peak} m, not in proportion`);
  if (!(once.tail < 0.001 && twice.tail < 0.001))
    failures.push(`the pushed root is ${once.tail} and ${twice.tail} m off after a second`);
  TestValidator.equals("an authored slow walk is holdable", failures, []);
}

/** The profile's joints with every joint after all the joints below it. */
function postorder(profile: IAutoMoviePhysicalProfile): IAutoMoviePhysicalJoint[] {
  const children: Map<string, IAutoMoviePhysicalJoint[]> = new Map();
  for (const joint of profile.joints)
    children.set(joint.parent, [...(children.get(joint.parent) ?? []), joint]);
  const root: string = profile.segments.find(
    (segment: IAutoMoviePhysicalSegment): boolean =>
      !profile.joints.some((joint): boolean => joint.child === segment.bone),
  )!.bone;
  const out: IAutoMoviePhysicalJoint[] = [];
  const visit = (bone: string): void => {
    for (const joint of children.get(bone) ?? []) {
      visit(joint.child);
      out.push(joint);
    }
  };
  visit(root);
  return out;
}

/** Fit the public settled Stand once, as test_motion_support_stand_support_geometry does. */
function stand(
  human: IAutoMovieMotionHumanBody,
): Record<string, IAutoMovieRigidTransform> {
  const { profile }: IAutoMovieMotionHumanBody = human;
  const film: motionHumanLaw.IFilm = motionHumanLaw.perform(
    "physical-authored-locomotion",
    [{ subject: profile.id, body: human }],
    HumanChain.subject(profile.id).stand({ hold: 1, sway: 0 }),
  );
  const settled: number = motionHumanLaw.event(film, "settled", profile.id);
  const bones: motionHumanLaw.Bones = film.bones(
    profile.id,
    settled + (film.duration - settled) / 2,
  );
  const fit: ReturnType<typeof fitHumanPhysicalStandingPose> =
    fitHumanPhysicalStandingPose({
      profile,
      targets: Object.fromEntries(
        profile.segments.map(
          (
            segment: IAutoMoviePhysicalSegment,
          ): [string, IAutoMovieRigidTransform] => {
            const bone: IAutoMovieResolvedBone = bones.get(
              segment.bone as AutoMovieHumanoidBone,
            )!;
            return [
              segment.bone,
              { position: bone.worldPosition, rotation: bone.worldRotation },
            ];
          },
        ),
      ),
      floor: 0,
      iterations: 32,
      tolerance: 0.000025,
    });
  if (fit.kind === "unresolved")
    throw new Error(`The public Stand has no physical fit: ${fit.reason}`);
  return fit.targets;
}
