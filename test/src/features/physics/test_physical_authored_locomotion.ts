import {
  AutoMoviePhysicalTracking,
  AutoMovieXpbdBody,
  Quaternion,
  measurePhysicalJointLimits,
  physicalGravityTorques,
  physicalJointMotorCommand,
  physicalSupportPoint,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieStepPlanner,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalHumanProfiles } from "../internal/PhysicalHumanProfiles";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalPerformanceFixtures } from "../internal/PhysicalPerformanceFixtures";

/**
 * An authored slow walk is one the engine's drives can hold: the engine
 * stickman and the canonical Human (its stored profile and fitted public
 * Stand, `PhysicalHumanProfiles`), each walking 0.12 m/s for a second from
 * planner-placed footfalls (the maintained slow-walk fixture), a swing and a
 * heel strike of each foot, read with no simulation at the frames that carry
 * each property, which the planner's phases give: every stance's heel strike
 * and middle, every swing's middle, and the push's frame at 1 s.
 *
 * Scenarios:
 *
 * 1. Planted supports: at each stance's middle its authored endpoint stays
 *    within one percent of the 0.35 m stride of where it struck.
 * 2. Holding: at every key frame, each joint's target lies within two
 *    degrees of its range (`measurePhysicalJointLimits`), the joint bound a
 *    tracked walk keeps, and its drive at that target, at rest and asked to
 *    follow the target's rate toward the neighbouring key frame, with the
 *    gravity moment of everything below it as feed-forward
 *    (`physicalGravityTorques`), forecasts no demand past its torque cap
 *    (`physicalJointMotorCommand`): the gravity moment plus the damping's kd
 *    w fit within the cap. PD with gravity compensation has its equilibrium
 *    at the target (Takegaki and Arimoto 1981), so a held target leaves no
 *    static error while it is reachable and the compensation fits within the
 *    caps.
 * 3. Push: the stickman's root servo (`AutoMoviePhysicalTracking.force`) on
 *    its mass, pushed at 0.15 and 0.3 m/s along the walk, stays below its
 *    force bound, so its displacement scales with the push, the larger
 *    peaking at twice the smaller; and both come back within a millimetre
 *    within a second, as the walk the push lands in goes on.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both walks and each held property with its source.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the planner's phases and the authored targets, and calls `physicalGravityTorques`, `physicalJointMotorCommand` and `AutoMoviePhysicalTracking.force` on the authored poses and the fixture's gains.
 * @evidence contracts/development/testing.md#independent-expectations The slip bound is one percent of the fixture's stride; the range bound is the two degrees a tracked joint keeps of its authored rotation (test_physical_human_profile's bound); the caps are each joint's declared torque; the return is the servo's own discrete closed loop at the substep, x' = x + h v', v' = v + h F / m, whose response is linear below the force bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Two independent providers; a planted foot that drifts fails 1, a target past its joint's range, a gravity moment past a cap or a drive that saturates at its own target fails 2, a servo that saturates or does not converge fails 3. The step function's convergence on light links is `test_physical_xpbd_light_chain`'s, the joint limits' reading `test_physical_joint_chart_velocity`'s.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation on the walk fixture's key frames, the Human read from its stored profile and Stand with no figure built; no world, simulation, viewer or file host beyond reading those fixtures.
 */
export async function test_physical_authored_locomotion(): Promise<void> {
  const duration: number = 1;
  const stride: number = 0.35;
  const substep: number = 1 / (120 * 32);
  const radian: number = Math.PI / 180;
  const failures: string[] = [];
  const steps: number = Math.round(duration * 120);
  const walks: [string, IWalk][] = [
    [
      "stickman",
      keyed(PhysicalModelFixtures.stickman().profile, duration, steps),
    ],
    [
      "Human",
      keyed(
        PhysicalHumanProfiles.load("m-average"),
        duration,
        steps,
        PhysicalHumanProfiles.stand("m-average"),
      ),
    ],
  ];
  for (const [label, { walk, stances, frames }] of walks) {
    const profile: IAutoMoviePhysicalProfile = walk.body.profile;
    const targets = walk.body.targets;

    // 1. Planted supports: each stance's middle against its heel strike.
    for (const stance of stances) {
      const limb = walk.pattern.limbs.find(
        (candidate): boolean => candidate.bone === stance.bone,
      )!;
      const at = (step: number): IAutoMovieVector3 =>
        physicalSupportPoint(
          targets[step]!.segments[limb.bone]!,
          limb.localPoint,
        );
      const anchor: IAutoMovieVector3 = at(stance.from);
      const step: number = Math.floor((stance.from + stance.to) / 2);
      const point: IAutoMovieVector3 = at(step);
      const slip: number = Math.hypot(point.x - anchor.x, point.z - anchor.z);
      if (slip > 0.01 * stride)
        failures.push(`${label}: ${limb.bone} slides ${slip} m at ${step / 120} s`);
    }

    // 2. Holding, at the key frames.
    const order: IAutoMoviePhysicalJoint[] = postorder(profile);
    const relative = (
      joint: IAutoMoviePhysicalJoint,
      poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
    ): IAutoMovieQuaternion =>
      Quaternion.multiply(
        Quaternion.inverse(
          Quaternion.multiply(
            poses[joint.parent]!.rotation,
            joint.parentFrame.rotation,
          ),
        ),
        Quaternion.multiply(
          poses[joint.child]!.rotation,
          joint.childFrame.rotation,
        ),
      );
    for (const [index, step] of frames.entries()) {
      const poses: Record<string, IAutoMovieRigidTransform> =
        targets[step]!.segments;
      // The target's rate toward the neighbouring key frame, in the parent's
      // anchor frame: the rotation between them over their interval.
      const neighbour: number = frames[index + 1] ?? frames[index - 1]!;
      const beside: Record<string, IAutoMovieRigidTransform> =
        targets[neighbour]!.segments;
      const interval: number = (neighbour - step) / 120;
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
      const rest: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
      for (const joint of profile.joints) {
        const now: IAutoMovieQuaternion = relative(joint, poses);
        const turn: IAutoMovieQuaternion = Quaternion.multiply(
          relative(joint, beside),
          Quaternion.inverse(now),
        );
        const sign: number = turn.w < 0 ? -1 : 1;
        const norm: number = Math.hypot(turn.x, turn.y, turn.z);
        const scale: number =
          norm < 1e-12
            ? (2 * sign) / interval
            : (2 * sign * Math.atan2(norm, Math.abs(turn.w))) / norm / interval;
        const rate: IAutoMovieVector3 = {
          x: turn.x * scale,
          y: turn.y * scale,
          z: turn.z * scale,
        };
        // The drive at rest asked to follow the target's rate: its demand is
        // the damping's kd w on top of the gravity moment.
        const command = physicalJointMotorCommand({
          joint,
          current: now,
          target: now,
          velocity: rest,
          targetVelocity: rate,
          strength: 1,
          timestep: substep,
          feedForward: gravity.joints.get(joint.id) ?? rest,
        });
        if (command.saturated.length > 0)
          failures.push(
            `${label}: ${joint.id} following its target at ${step / 120} s, ${JSON.stringify(rate)} rad/s, passes its cap on ${command.saturated.join(",")}`,
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
    }
  }

  // 3. Push.
  const body = walks[0]![1].walk.body;
  const mass: number = body.profile.mass;
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

/** A walk planned at its key frames only. */
interface IWalk {
  /** The fixture's walk, its unlisted frames left unplanned. */
  walk: ReturnType<typeof PhysicalPerformanceFixtures.walk>;

  /** Each planted interval: its limb, its heel strike and its last step. */
  stances: { bone: string; from: number; to: number }[];

  /**
   * The frames the drives are held at: each stance's heel strike and middle,
   * each swing's middle, and the push's frame at 1 s.
   */
  frames: number[];
}

/**
 * The fixture's walk planned at the frames that carry its properties, read
 * from its planner's phases.
 */
function keyed(
  profile: IAutoMoviePhysicalProfile,
  duration: number,
  steps: number,
  stance?: Readonly<Record<string, IAutoMovieRigidTransform>>,
): IWalk {
  const stances: IWalk["stances"] = [];
  const frames: Set<number> = new Set([120]);
  const walk = PhysicalPerformanceFixtures.walk(
    profile,
    duration,
    0,
    stance,
    (planner: IAutoMovieStepPlanner): ReadonlySet<number> => {
      for (const limb of PhysicalPerformanceFixtures.supports(profile).limbs) {
        const planted = (step: number): boolean =>
          planner.at(limb.bone, step / 120).phase === "planted";
        let from: number = 0;
        for (let step: number = 1; step <= steps + 1; step++) {
          if (step <= steps && planted(step) === planted(from)) continue;
          const to: number = step - 1;
          frames.add(Math.floor((from + to) / 2));
          if (planted(from)) {
            stances.push({ bone: limb.bone, from, to });
            frames.add(from);
          }
          from = step;
        }
      }
      return frames;
    },
  );
  return { walk, stances, frames: [...frames].sort((a, b) => a - b) };
}
