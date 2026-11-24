import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { physicalAuthoredCenter } from "./physicalAuthoredCenter";
import { physicalSupportPoint } from "./physicalSupportPoint";
import { physicalSwingReference } from "./physicalSwingReference";
import { preparePhysicalDisturbanceSpan } from "./preparePhysicalDisturbanceSpan";

/**
 * A body's pose from its disturbance response at a time
 * (`preparePhysicalDisturbanceSpan`): every segment off the legs at its
 * authored pose carried by the response's centre of mass less the authored one,
 * horizontally, and each leg reaching its foot's place on the response from the
 * carried pelvis by the leg's analytical inverse kinematics
 * (`physicalSwingReference.pose`), the foot at its authored attitude.
 *
 * @param input The body, its authored goals and the response's sample.
 * @returns Every segment's goal.
 */
export function physicalSpanPose(input: {
  body: IAutoMoviePhysicalSimulationInput.IBody;
  goals: Readonly<Record<string, IAutoMovieSamplePhysicalTarget.IResult>>;
  sample: preparePhysicalDisturbanceSpan.ISample;
}): Record<string, IAutoMovieSamplePhysicalTarget.IResult> {
  const { body, goals, sample } = input;
  const authored = physicalAuthoredCenter(body.profile, goals);
  const shift: IAutoMovieVector3 = {
    x: sample.center.x - authored.center.x,
    y: 0,
    z: sample.center.z - authored.center.z,
  };
  const rate: IAutoMovieVector3 = {
    x: sample.centerVelocity.x - authored.velocity.x,
    y: 0,
    z: sample.centerVelocity.z - authored.velocity.z,
  };
  const carried = (
    goal: IAutoMovieSamplePhysicalTarget.IResult,
  ): IAutoMovieSamplePhysicalTarget.IResult => ({
    pose: {
      position: Vector3.add(goal.pose.position, shift),
      rotation: goal.pose.rotation,
    },
    velocity: Vector3.add(goal.velocity, rate),
    angularVelocity: goal.angularVelocity,
  });
  const out: Record<string, IAutoMovieSamplePhysicalTarget.IResult> =
    Object.fromEntries(
      Object.entries(goals).map(
        ([bone, goal]: [string, IAutoMovieSamplePhysicalTarget.IResult]) => [
          bone,
          carried(goal),
        ],
      ),
    );

  // Every segment below the root composed from its parent's pose by its
  // authored joint rotation, so each joint's anchors meet as the profile
  // places them, whatever the authored poses leave between them.
  const children: Set<string> = new Set(
    body.profile.joints.map(
      (joint: IAutoMoviePhysicalJoint): string => joint.child,
    ),
  );
  const posed: Set<string> = new Set(
    Object.keys(out).filter((bone: string): boolean => !children.has(bone)),
  );
  const authoredPoses: Record<string, IAutoMovieRigidTransform> =
    Object.fromEntries(
      Object.entries(goals).map(
        ([bone, goal]: [string, IAutoMovieSamplePhysicalTarget.IResult]) => [
          bone,
          goal.pose,
        ],
      ),
    );
  for (
    let pass: number = 0;
    pass < body.profile.joints.length && posed.size < Object.keys(out).length;
    ++pass
  )
    for (const joint of body.profile.joints) {
      if (posed.has(joint.child) || !posed.has(joint.parent)) continue;
      if (!authoredPoses[joint.parent] || !authoredPoses[joint.child]) continue;
      const pose: IAutoMovieRigidTransform = physicalSwingReference({
        joints: [joint],
        base: out[joint.parent]!.pose,
        actual: authoredPoses,
        fit: authoredPoses,
        share: 0,
      })[joint.child]!;
      out[joint.child] = { ...out[joint.child]!, pose };
      posed.add(joint.child);
    }
  const limbs = (body.supportTracking?.pattern ?? body.balance?.pattern)?.limbs;
  for (const limb of limbs ?? []) {
    const place: IAutoMovieVector3 | undefined = sample.feet[limb.bone];
    const joint: IAutoMoviePhysicalJoint | undefined = body.profile.joints.find(
      (candidate: IAutoMoviePhysicalJoint): boolean =>
        candidate.child === limb.chain[0],
    );
    if (!place || !joint || !out[joint.parent]) continue;
    const endpoint: IAutoMovieVector3 = physicalSupportPoint(
      goals[limb.bone]!.pose,
      limb.localPoint,
    );
    const poses = (
      source: Readonly<Record<string, IAutoMovieSamplePhysicalTarget.IResult>>,
    ): Record<string, IAutoMovieRigidTransform> =>
      Object.fromEntries(
        Object.entries(source).map(
          ([bone, goal]: [string, IAutoMovieSamplePhysicalTarget.IResult]) => [
            bone,
            goal.pose,
          ],
        ),
      );
    const fitted: { targets: Record<string, IAutoMovieRigidTransform> } =
      physicalSwingReference.pose({
        profile: body.profile,
        chain: limb.chain,
        base: out[joint.parent]!.pose,
        seed: poses(out),
        authored: poses(goals),
        goal: { x: place.x, y: endpoint.y, z: place.z },
        ...(limb.localPoint ? { localPoint: limb.localPoint } : {}),
        rotation: goals[limb.bone]!.pose.rotation,
        iterations: physicalSpanPose.ITERATIONS,
        tolerance: physicalSpanPose.TOLERANCE,
      });
    for (const [bone, pose] of Object.entries(fitted.targets))
      out[bone] = {
        pose,
        velocity: goals[bone]?.velocity ?? { x: 0, y: 0, z: 0 },
        angularVelocity: goals[bone]?.angularVelocity ?? { x: 0, y: 0, z: 0 },
      };
  }
  return out;
}

/** The span's play and the leg fit's budget. */
export namespace physicalSpanPose {
  /** The selection that makes every segment kinematic while a span plays. */
  export const KINEMATIC: string[] = [];
  Object.freeze(KINEMATIC);

  /** The leg fit's iteration budget. */
  export const ITERATIONS: number = 16;

  /** The leg fit's tolerance, metres. */
  export const TOLERANCE: number = 1e-4;

  /**
   * The body's disturbance response at a time while it plays: after its first
   * push and before it settles. The response is prepared once from the recorded
   * inputs and held on the binding; a restore, which keeps only the inputs,
   * prepares it once again.
   *
   * @param bound The binding holding the prepared responses.
   * @param body The body.
   * @param state Its recovery state, if any.
   * @param seconds The substep's time, local seconds.
   * @returns The response's sample while it plays, else undefined.
   */
  export function play(
    bound: Bound,
    body: IAutoMoviePhysicalSimulationInput.IBody,
    state: IAutoMoviePhysicalRecoveryState | undefined,
    seconds: number,
  ): preparePhysicalDisturbanceSpan.ISample | undefined {
    const recorded: IAutoMoviePhysicalRecoveryState["span"] = state?.span;
    if (!recorded || !(seconds > recorded.seconds)) return undefined;
    let held = bound.spans.get(body.id);
    if (held?.input !== recorded) {
      held = {
        input: recorded,
        span: preparePhysicalDisturbanceSpan(recorded),
      };
      bound.spans.set(body.id, held);
    }
    return seconds < held.span.until ? held.span.sample(seconds) : undefined;
  }

  /**
   * The body's disturbance response handed back on the first substep after it
   * settles: the recovery state adopts where the response left the body, its
   * centre of mass's shift from the authored one as the root's offset and each
   * foot's place less its authored endpoint as that foot's offset, the walking
   * state's plan, swing and seating cleared so the balance controller starts
   * from the body as it stands.
   *
   * @param bound The binding holding the prepared responses.
   * @param body The body.
   * @param state Its recovery state, written in place.
   * @param goals The authored goals now.
   * @param seconds The substep's time, local seconds.
   */
  export function hand(
    bound: Bound,
    body: IAutoMoviePhysicalSimulationInput.IBody,
    state: IAutoMoviePhysicalRecoveryState | undefined,
    goals: Readonly<Record<string, IAutoMovieSamplePhysicalTarget.IResult>>,
    seconds: number,
  ): void {
    const held = bound.spans.get(body.id);
    if (!state?.span || !held || held.input !== state.span || held.handed)
      return;
    if (seconds < held.span.until) return;
    held.handed = true;
    const last: preparePhysicalDisturbanceSpan.ISample = held.span.sample(
      held.span.until,
    );
    const authored = physicalAuthoredCenter(body.profile, goals);
    state.rootOffset = {
      x: last.center.x - authored.center.x,
      y: 0,
      z: last.center.z - authored.center.z,
    };
    const offsets: Record<string, IAutoMovieVector3> = { ...state.offsets };
    const limbs = (body.supportTracking?.pattern ?? body.balance?.pattern)
      ?.limbs;
    for (const limb of limbs ?? []) {
      const place: IAutoMovieVector3 | undefined = last.feet[limb.bone];
      const goal: IAutoMovieSamplePhysicalTarget.IResult | undefined =
        goals[limb.bone];
      if (!place || !goal) continue;
      const endpoint: IAutoMovieVector3 = physicalSupportPoint(
        goal.pose,
        limb.localPoint,
      );
      offsets[limb.bone] = {
        x: place.x - endpoint.x,
        y: 0,
        z: place.z - endpoint.z,
      };
    }
    state.offsets = offsets;
    delete state.plan;
    delete state.desired;
    delete state.swing;
    delete state.seating;
    delete state.push;
    delete state.icp;
    delete state.switches;
    state.revision = (state.revision ?? 0) + 1;
  }
}
