import type {
  IAutoMovieAdvancePhysicalBalance,
  IAutoMovieConfigurePhysicalJointMotor,
  IAutoMoviePhysicalGravityTorques,
  IAutoMoviePhysicalRecoveryPolicy,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalTarget,
  IAutoMovieStepPlanner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { configurePhysicalJointMotor } from "./configurePhysicalJointMotor";
import { physicalJointEffort } from "./physicalJointEffort";
import { physicalRecoveryLifted } from "./physicalRecoveryLifted";
import { physicalRecoveryLimbSwing } from "./physicalRecoveryLimbSwing";
import { physicalStanceJointTarget } from "./physicalStanceJointTarget";
import { physicalSwingReference } from "./physicalSwingReference";
import { trackPhysicalRoot } from "./trackPhysicalRoot";

/**
 * Drive a tracked body's dynamic joints this substep (`trackPhysicalWorld`):
 * each joint's reference by its role in the stance or the swing, its strength
 * and its feed-forward, configured on its motor.
 *
 * @param scope The world, the run and its binding, the body and what this
 *   substep's earlier phases decided for it.
 */
export function trackPhysicalWorldJoints(
  scope: trackPhysicalWorldJoints.IScope,
): void {
  const {
    world,
    input,
    bound,
    step,
    softened,
    diagnostics,
    recovery,
    seconds,
    body,
    target,
    effort,
    authoredGoals,
    goals,
    dynamic,
    actuation,
    assessment,
    rooted,
    gravity,
  }: trackPhysicalWorldJoints.IScope = scope;
  for (const joint of body.profile.joints) {
    if (!dynamic.has(joint.child)) continue;
    const parent: AutoMovieXpbdBody = bound.bodies.get(
      `${body.id}/${joint.parent}`,
    )!;
    const child: AutoMovieXpbdBody = bound.bodies.get(
      `${body.id}/${joint.child}`,
    )!;
    const parentFrame: IAutoMovieRigidTransform["rotation"] =
      Quaternion.multiply(parent.rotation(), joint.parentFrame.rotation);
    const childFrame: IAutoMovieRigidTransform["rotation"] =
      Quaternion.multiply(child.rotation(), joint.childFrame.rotation);
    // Under internal actuation a stance limb, any limb not lifted for a
    // swing, sets its joints' references by their role
    // (`physicalStanceJointTarget`): a planted foot holds the world
    // orientation latched when its stance began, against the actual parent,
    // so a leaning shank does not tip it onto an edge; the leg's first joint
    // holds the trunk at its intended world orientation over the actual
    // thigh (Yin, Loken and van de Panne 2007, Section 3.2); the rest keep
    // the goal posture refit to the present footholds.
    const swinging: readonly string[] = physicalRecoveryLifted(
      recovery[body.id],
    );
    const stance:
      | IAutoMoviePhysicalRecoveryPolicy["pattern"]["limbs"][number]
      | undefined = actuation
      ? body.balance?.pattern.limbs.find(
          (
            limb: IAutoMoviePhysicalRecoveryPolicy["pattern"]["limbs"][number],
          ): boolean =>
            !swinging.includes(limb.bone) &&
            (limb.chain.includes(joint.child) ||
              (limb.contacts?.includes(joint.child) ?? false)),
        )
      : undefined;
    const planted: boolean =
      !!stance &&
      (stance.bone === joint.child ||
        (stance.contacts?.includes(joint.child) ?? false));
    // A swinging foot is held at its authored world orientation, level,
    // apart from its path, so a toe or heel neither drags nor strikes first
    // (Pratt et al., M2V2, Section VII-D1).
    const level: boolean =
      !!actuation &&
      (body.balance?.pattern.limbs.some(
        (
          limb: IAutoMoviePhysicalRecoveryPolicy["pattern"]["limbs"][number],
        ): boolean =>
          swinging.includes(limb.bone) &&
          (limb.bone === joint.child ||
            (limb.contacts?.includes(joint.child) ?? false)),
      ) ??
        false);
    const reference: physicalStanceJointTarget.IResult =
      physicalStanceJointTarget({
        parentFrame: joint.parentFrame.rotation,
        childFrame: joint.childFrame.rotation,
        actual: {
          parent: parent.rotation(),
          child: child.rotation(),
          parentSpin: parent.angvel(),
          childSpin: child.angvel(),
        },
        goal: {
          parent: goals[joint.parent]!.pose.rotation,
          child: goals[joint.child]!.pose.rotation,
          parentSpin: goals[joint.parent]!.angularVelocity,
          childSpin: goals[joint.child]!.angularVelocity,
        },
        ...(planted || level
          ? {
              role: "planted" as const,
              latched:
                (planted
                  ? assessment?.state.seating?.[joint.child]?.anchor?.rotation
                  : undefined) ?? authoredGoals[joint.child]!.pose.rotation,
            }
          : stance !== undefined && stance.chain[0] === joint.child
            ? {
                role: "hip" as const,
                intended: {
                  rotation: authoredGoals[joint.parent]!.pose.rotation,
                  spin: authoredGoals[joint.parent]!.angularVelocity,
                },
                // The hip strategy's axis, along which the stance hips
                // release the trunk (design-4017-edge, E2).
                ...(rooted.release ? { release: rooted.release } : {}),
              }
            : { role: "posture" as const }),
      });
    const inv: IAutoMovieRigidTransform["rotation"] =
      Quaternion.inverse(parentFrame);
    const rate: IAutoMovieVector3 = Quaternion.rotateVector(
      inv,
      Vector3.subtract(child.angvel(), parent.angvel()),
    );
    // A lifted swing starts from the leg's present state, its rates as
    // well as its angles: through the fade its joints' reference rates are
    // drawn from their actual rates toward the path's, as their angles are
    // (`physicalSwingReference`; design-4017-edge, S1), since a swing
    // trajectory is planned from the foot's present position and velocity
    // (Khadiv et al. 2017, Section III-B; TSID `remove_contact`). A rate
    // reference left at the path's first, near rest, would have the joints'
    // damping hold back a leg the advancing pelvis is turning, pressing the
    // lifted foot back into the floor.
    const own:
      | IAutoMoviePhysicalRecoveryPolicy["pattern"]["limbs"][number]
      | undefined = body.balance?.pattern.limbs.find(
      (
        limb: IAutoMoviePhysicalRecoveryPolicy["pattern"]["limbs"][number],
      ): boolean =>
        swinging.includes(limb.bone) &&
        (limb.chain.includes(joint.child) ||
          (limb.contacts?.includes(joint.child) ?? false)),
    );
    const swing: IAutoMovieStepPlanner.IStep | undefined = own
      ? physicalRecoveryLimbSwing(recovery[body.id], own.bone)
      : undefined;
    const targetVelocity: IAutoMovieVector3 = swing
      ? physicalSwingReference.rate({
          actual: rate,
          path: reference.velocity,
          elapsed: seconds - swing.start,
        })
      : reference.velocity;
    const moving: boolean =
      body.balance?.pattern.limbs.some(
        (
          limb: IAutoMoviePhysicalRecoveryPolicy["pattern"]["limbs"][number],
        ): boolean =>
          (physicalRecoveryLimbSwing(recovery[body.id], limb.bone) !==
            undefined ||
            recovery[body.id]?.offsets[limb.bone] !== undefined) &&
          limb.chain.includes(joint.child),
      ) ?? false;
    const strength: number = physicalJointEffort({
      effort: effort.strength,
      override:
        target.jointStrength && Object.hasOwn(target.jointStrength, joint.id)
          ? target.jointStrength[joint.id]!
          : undefined,
      recovery: moving ? (body.balance!.jointStrength ?? 1) : undefined,
      softenedUntil: softened.get(`${body.id}/${joint.child}`),
      seconds,
      compliance: body.complianceStrength,
    });
    const result: IAutoMovieConfigurePhysicalJointMotor.IResult =
      configurePhysicalJointMotor({
        world,
        native: bound.joints.get(`${body.id}/${joint.id}`)!,
        joint,
        current: Quaternion.multiply(inv, childFrame),
        target: reference.target,
        velocity: rate,
        targetVelocity,
        strength,
        feedForward: Vector3.add(
          gravity.joints.get(joint.id) ?? { x: 0, y: 0, z: 0 },
          actuation?.get(joint.id) ?? { x: 0, y: 0, z: 0 },
        ),
      });
    if (
      result.saturated.length > 0 &&
      Math.abs(seconds * input.rate - step) < 1e-7
    )
      diagnostics.push({
        seconds,
        body: body.id,
        joint: joint.id,
        error: result.error,
        saturated: result.saturated,
      });
  }
}

/** The joints' phase's inputs. */
export namespace trackPhysicalWorldJoints {
  /** What the joints' phase reads of the substep. */
  export interface IScope {
    /** The solver world. */
    world: AutoMovieXpbdWorld;

    /** The run's input. */
    input: IAutoMoviePhysicalSimulationInput.IInput;

    /** The run's binding. */
    bound: Bound;

    /** The enclosing cache interval. */
    step: number;

    /** The softened tracking's end seconds, by body/bone key. */
    softened: ReadonlyMap<string, number>;

    /** Where saturated motors are recorded. */
    diagnostics: IAutoMoviePhysicalSimulationInput.IDiagnostic[];

    /** Each body's recovery state. */
    recovery: Readonly<Record<string, IAutoMoviePhysicalRecoveryState>>;

    /** The substep's local seconds. */
    seconds: number;

    /** The body. */
    body: IAutoMoviePhysicalSimulationInput.IBody;

    /** Its sampled target. */
    target: IAutoMoviePhysicalSimulationInput.ITarget;

    /** Its target at the balance's effort. */
    effort: IAutoMoviePhysicalSimulationInput.ITarget;

    /** Its authored goals. */
    authoredGoals: Readonly<
      Record<string, IAutoMovieSamplePhysicalTarget.IResult>
    >;

    /** Its goals, played or authored. */
    goals: Readonly<Record<string, IAutoMovieSamplePhysicalTarget.IResult>>;

    /** Its dynamically owned segments. */
    dynamic: ReadonlySet<string>;

    /** The internal actuation's accumulated moments, by joint. */
    actuation: ReadonlyMap<string, IAutoMovieVector3> | undefined;

    /** The balance's assessment, if it ran. */
    assessment: IAutoMovieAdvancePhysicalBalance.IResult | undefined;

    /** What the root's tracking left the joints. */
    rooted: trackPhysicalRoot.IResult;

    /** The gravity compensation's joint moments. */
    gravity: IAutoMoviePhysicalGravityTorques.IResult;
  }
}
