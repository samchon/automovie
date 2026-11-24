import type {
  IAutoMovieCollectPhysicalSupports,
  IAutoMovieDistributePhysicalSupportWrench,
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AutoMoviePhysicalTracking as Tracking } from "./AutoMoviePhysicalTracking";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { distributePhysicalSupportWrench } from "./distributePhysicalSupportWrench";
import { PhysicalRotationVector } from "./PhysicalRotationVector";
import { physicalCentroidalTask } from "./physicalCentroidalTask";
import { physicalJointInertia } from "./physicalJointInertia";
import { physicalStanceBalance } from "./physicalStanceBalance";
import { physicalSupportFootprint } from "./physicalSupportFootprint";

/**
 * Realize one bounded root demand through an external wrench, or under internal actuation as the root task of the motors' whole-body solve.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Realize one bounded root demand through an external wrench, or under internal actuation as the root task of the motors' whole-body solve) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Realize one bounded root demand through an external wrench, or under internal actuation as the root task of the motors' whole-body solve) directly over its typed inputs (`input`) as nested iteration of depth 3 (map over (["x", "y", "z"] as const); filter over ( body.supportTracking?.pattern ??; flatMap over supports .filter((support: (type), delegating to `Vector3.add`, `Tracking.force`, `Vector3.subtract`, `base.translation`, `base.velocityAtPoint`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 165 lines and 8 top-level statements that reuses `Vector3.add`, `Tracking.force`, `Vector3.subtract`, `base.translation`, `base.velocityAtPoint` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 7 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 3 (map over (["x", "y", "z"] as const); filter over ( body.supportTracking?.pattern ??; flatMap over supports .filter((support: (type), performed once per call with 14 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 14 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function trackPhysicalRoot(input: trackPhysicalRoot.IInput): void {
  const {
    settings,
    body,
    bound,
    base,
    rootDynamic,
    rootIntent,
    target,
    rootShift,
    center: authored,
    landed,
    planted,
    seating,
    integral,
    pushed,
    gravity,
    actuation,
    supports,
    dt,
  }: trackPhysicalRoot.IInput = input;
  // The limbs a recovery swing has lifted, the swing's first.
  const swinging: readonly string[] = input.recoveryBones ?? [];
  const rootStrength: number = target.strength;
  const rootGoal: IAutoMovieVector3 = Vector3.add(
    rootIntent.pose.position,
    rootShift ?? { x: 0, y: 0, z: 0 },
  );
  let force: IAutoMovieVector3 = rootDynamic
    ? Tracking.force(
        Vector3.subtract(rootGoal, base.translation()),
        Vector3.subtract(
          base.velocityAtPoint(base.translation()),
          rootIntent.velocity,
        ),
        body.profile.mass,
        body.rootStiffness * rootStrength,
        body.rootDamping * rootStrength,
        body.maximumRootForce * rootStrength,
        dt,
      )
    : { x: 0, y: 0, z: 0 };
  if (rootDynamic && body.compensateGravity) {
    force = Vector3.subtract(
      force,
      Vector3.scale(
        settings.gravity,
        body.profile.mass *
          rootStrength *
          (body.mode.kind === "exaggerated" ? body.mode.gravity : 1),
      ),
    );
    const magnitude: number = Vector3.length(force);
    if (magnitude > body.maximumRootForce * rootStrength)
      force = Vector3.scale(
        force,
        (body.maximumRootForce * rootStrength) / magnitude,
      );
  }
  let rootTorque: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  let orientation: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  // The trunk's intended attitude under internal actuation is turned by the
  // stance feet's heading as each was latched when its stance began, so its
  // yaw servo holds the heading the feet stand at (design-4017-qp3, Section
  // 1, rule 2: the stance yaw reference latched at touchdown).
  const intended: IAutoMovieQuaternion = actuation
    ? Quaternion.multiply(
        latchedHeading(body, seating, planted, swinging),
        rootIntent.pose.rotation,
      )
    : rootIntent.pose.rotation;
  if (rootDynamic && body.rootTorque && rootStrength > 0) {
    const axes: IAutoMoviePhysicalJointAxis[] = (["x", "y", "z"] as const).map(
      (axis: "x" | "y" | "z"): IAutoMoviePhysicalJointAxis => ({
        axis,
        minimum: -Math.PI,
        maximum: Math.PI,
        channel: `root.${axis}`,
        ...body.rootTorque!,
      }),
    );
    // Under internal actuation the servo acts on a saturated error
    // (`physicalStanceBalance.saturate`).
    orientation = Tracking.torque(
      base.rotation(),
      actuation
        ? physicalStanceBalance.saturate(
            base.rotation(),
            intended,
            physicalStanceBalance.TORSO_ERROR,
          )
        : rootIntent.pose.rotation,
      Vector3.subtract(base.angvel(), rootIntent.angularVelocity),
      axes,
      physicalJointInertia({ x: 0, y: 0, z: 0, w: 1 }, base),
      dt,
      rootStrength,
    ).torque;
    const torque: IAutoMovieVector3 = Vector3.add(
      orientation,
      Vector3.scale(gravity, rootStrength),
    );
    const limit: number = body.rootTorque.maximumTorque * rootStrength;
    rootTorque = {
      x: Math.max(-limit, Math.min(limit, torque.x)),
      y: Math.max(-limit, Math.min(limit, torque.y)),
      z: Math.max(-limit, Math.min(limit, torque.z)),
    };
  }
  if (actuation && rootDynamic) {
    const limbs: NonNullable<
      IAutoMoviePhysicalSimulationInput.IBody["supportTracking"]
    >["pattern"]["limbs"] = (
      body.supportTracking?.pattern ?? body.balance!.pattern
    ).limbs.filter(
      (
        limb: NonNullable<
          IAutoMoviePhysicalSimulationInput.IBody["supportTracking"]
        >["pattern"]["limbs"][number],
      ): boolean =>
        !swinging.includes(limb.bone) &&
        !target.unavailableSupports?.includes(limb.bone) &&
        (target.supportStrength?.[limb.bone] ?? 1) > 0,
    );
    // Internal actuation balances by the centre of pressure, not by holding
    // the pelvis (`physicalStanceBalance`). The supports carry the pendulum's
    // force and any swing hip's reaction (Yin, Loken and van de Panne 2007,
    // Section 3.2) and the trunk's orientation servo, within the centre of
    // pressure's room.
    const segments: ReadonlyMap<string, AutoMovieXpbdBody> = bound.segments.get(
      body.id,
    )!;
    const origin: IAutoMovieVector3 = base.worldCom();
    // Each stance foot's bearing and flatness shares, ramped through contact
    // changes (`advancePhysicalBalance`); a foot that is not flat bears toward
    // its ankle joint centre (Coros, Beaudoin and van de Panne 2010, Section
    // 3.3).
    const ankleOf = (limb: (typeof limbs)[number]): IAutoMovieVector3 => {
      const joint: IAutoMoviePhysicalJoint = body.profile.joints.find(
        (candidate: IAutoMoviePhysicalJoint): boolean =>
          candidate.child === limb.bone,
      )!;
      const parent: AutoMovieXpbdBody = segments.get(joint.parent)!;
      return Vector3.add(
        parent.translation(),
        Quaternion.rotateVector(parent.rotation(), joint.parentFrame.position),
      );
    };
    // An unseated foot still bearing bears on its edge where it is now: its
    // bearing face at its present pose (`physicalStanceBalance.support`).
    const feet: Record<
      string,
      {
        bearing: number;
        flat: number;
        ankle: IAutoMovieVector3;
        edge?: IAutoMovieVector3[];
      }
    > = Object.fromEntries(
      limbs.map((limb: (typeof limbs)[number]) => {
        const flat: number = seating?.[limb.bone]?.flat ?? 1;
        return [
          limb.bone,
          {
            bearing: seating?.[limb.bone]?.bearing ?? 1,
            flat,
            ankle: ankleOf(limb),
            ...(flat > 0
              ? {}
              : {
                  edge: physicalSupportFootprint(
                    body.profile,
                    segments,
                    limb,
                    settings.floor,
                  ),
                }),
          },
        ];
      }),
    );
    // The body's centroidal angular momentum, and the capture point's shift
    // for it (`physicalStanceBalance.momentum`, `spin`).
    let whole: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const segment of body.profile.segments)
      whole = Vector3.add(
        whole,
        Vector3.scale(
          segments.get(segment.bone)!.worldCom(),
          segment.mass / body.profile.mass,
        ),
      );
    const spun: IAutoMovieVector3 = physicalStanceBalance.momentum(
      body.profile,
      segments,
      whole,
    );
    const g: number = Math.abs(settings.gravity.y);
    const shift: IAutoMovieVector3 = physicalStanceBalance.spin(
      spun,
      Math.sqrt(g / Math.max(1e-6, whole.y - settings.floor)),
      body.profile.mass,
      g,
    );
    const stance: physicalStanceBalance.IResult | undefined =
      planted && authored
        ? physicalStanceBalance.demand({
            settings,
            body,
            segments,
            stance: limbs,
            feet,
            planted,
            center: authored,
            ...(landed ? { landed } : {}),
            spin: shift,
            velocity: rootIntent.velocity,
            // Each swinging hip's reaction and the trunk's orientation servo,
            // in single support as in double, served after capture with the
            // centre of pressure kept on the support
            // (`physicalStanceBalance.allocate`; `trackPhysicalRoot.moment`).
            // With its feet held, a body has few joint motions beyond what
            // its momentum fixes, a four-support body none, so the trunk
            // turns back through the ground's moment, which the stance leg
            // realizes while the swing keeps its own task; the stance hips
            // and the root's spin row hold it where the legs leave freedom
            // (`physicalStanceJointTarget`). Its heading is the ground's in
            // any support: no joint motion turns the whole body about the
            // vertical, so its yaw servo is the feet's torsional friction
            // (design-4017-qp3, Section 1, rule 2; `AutoMovieXpbdSupportRows`).
            torque: trackPhysicalRoot.moment({
              trunk: orientation,
              swings: swinging.map(
                (bone: string): IAutoMovieVector3 =>
                  swingHip(body, segments, bone, actuation),
              ),
            }),
            origin,
            // The trunk's intended attitude, which its hip strategy's angle
            // is measured from (`physicalStanceBalance.hip`): the strategy
            // that holds the body instead of a step, so none while a limb
            // swings, whose landing captures it (Stephens 2011, Table 4.1).
            ...(swinging.length === 0
              ? { intended: rootIntent.pose.rotation }
              : {}),
            strength: rootStrength,
            ...(integral
              ? { bias: { x: integral.bias.x, y: 0, z: integral.bias.z } }
              : {}),
          })
        : undefined;
    // The supports' ground reaction is the body's momentum task inside the
    // motors' whole-body solve, with its contacts and joints (the strict
    // support cascade, Herzog et al. 2016; solveXpbdArticulationContacts):
    // the stance's centre-of-pressure wrench while a stance is planted, the
    // mass centre's servo otherwise (`physicalCentroidalTask`).
    if (!stance) {
      submit(
        input,
        limbs,
        physicalCentroidalTask({
          profile: body.profile,
          segments,
          goals: input.goals,
          root: bound.order.get(body.id)![0]!.bone,
          rootGoal,
          rootVelocity: rootIntent.velocity,
          stiffness: body.rootStiffness * rootStrength,
          damping: body.rootDamping * rootStrength,
          maximumForce: body.maximumRootForce * rootStrength,
          weight: body.compensateGravity
            ? Vector3.scale(
                settings.gravity,
                body.profile.mass *
                  rootStrength *
                  (body.mode.kind === "exaggerated" ? body.mode.gravity : 1),
              )
            : { x: 0, y: 0, z: 0 },
          torque: orientation,
          dt,
        }),
      );
      return;
    }
    // The centre-of-pressure integral reads the realized centre of pressure
    // from the actual contact points weighted by their normal impulses (the
    // solver's summed contact wrench), not from the centre of mass's
    // acceleration (Stephens 2011, Eq. 5.31).
    if (integral) {
      // The limbs swinging, as one key: a change resets the bias.
      const swung: string | undefined =
        swinging.length > 0 ? swinging.join("+") : undefined;
      let weight: number = 0;
      let realized: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
      for (const support of supports)
        if (support.pressure && support.impulse > 0) {
          weight += support.impulse;
          realized = Vector3.add(
            realized,
            Vector3.scale(support.pressure, support.impulse),
          );
        }
      physicalStanceBalance.integrate({
        state: integral,
        result: stance,
        dt,
        frozen:
          stance.clamped ||
          !!pushed ||
          swinging.length > 0 ||
          !(weight > 0) ||
          limbs.some(
            (limb): boolean =>
              feet[limb.bone]!.flat < 1 || feet[limb.bone]!.bearing < 1,
          ),
        reset: integral.swing !== swung,
        ...(weight > 0 ? { real: Vector3.scale(realized, 1 / weight) } : {}),
      });
      integral.swing = swung;
      // The command is kept for the step choice: a limb whose remaining
      // supports hold it can be unloaded at once (`AutoMoviePhysicalBalance`
      // `.assess`).
      integral.command = { x: stance.pressure.x, z: stance.pressure.z };
    }
    // The trunk is held in the world frame (Yin, Loken and van de Panne 2007,
    // Section 3.2) as motion: its angular velocity after the step turns it
    // toward the intended attitude at its servo's rate, stiffness over
    // damping, on an error saturated as Feng et al. 2013 saturate theirs
    // (Section III-B; `physicalStanceBalance.saturate`).
    const spin: IAutoMovieVector3 | undefined =
      body.rootTorque && body.rootTorque.damping > 0
        ? Vector3.add(
            rootIntent.angularVelocity,
            Vector3.scale(
              PhysicalRotationVector.log(
                Quaternion.multiply(
                  physicalStanceBalance.saturate(
                    base.rotation(),
                    intended,
                    physicalStanceBalance.TORSO_ERROR,
                  ),
                  Quaternion.inverse(base.rotation()),
                ),
              ),
              (body.rootTorque.stiffness / body.rootTorque.damping) *
                rootStrength,
            ),
          )
        : undefined;
    submit(input, limbs, {
      origin,
      force: stance.force,
      torque: stance.torque,
      ...(spin ? { spin } : {}),
    });
  } else if (rootDynamic && !actuation) {
    base.addForce(force);
    base.addTorque(rootTorque);
  }
}

/**
 * The torque the swinging hip exerts on its thigh, world N m: the swing
 * drive's demand already accumulated at that hip (`advancePhysicalBalance`).
 * Its reaction turns the torso, so the stance supports add it to the torso's
 * moment (Yin, Loken and van de Panne 2007, Section 3.2). None while no limb
 * swings.
 */
function swingHip(
  body: IAutoMoviePhysicalSimulationInput.IBody,
  segments: ReadonlyMap<string, AutoMovieXpbdBody>,
  swing: string | undefined,
  torques: ReadonlyMap<string, IAutoMovieVector3>,
): IAutoMovieVector3 {
  const limb: IAutoMovieFootfallPattern["limbs"][number] | undefined = (
    body.supportTracking?.pattern ?? body.balance?.pattern
  )?.limbs.find(
    (candidate: IAutoMovieFootfallPattern["limbs"][number]): boolean =>
      candidate.bone === swing,
  );
  const joint: IAutoMoviePhysicalJoint | undefined = limb
    ? body.profile.joints.find(
        (candidate: IAutoMoviePhysicalJoint): boolean =>
          candidate.child === limb.chain[0],
      )
    : undefined;
  const local: IAutoMovieVector3 | undefined = joint
    ? torques.get(joint.id)
    : undefined;
  if (!joint || !local) return { x: 0, y: 0, z: 0 };
  const frame: IAutoMovieQuaternion = Quaternion.multiply(
    segments.get(joint.parent)!.rotation(),
    joint.parentFrame.rotation,
  );
  return Quaternion.rotateVector(frame, local);
}

/**
 * Set a body's momentum task for the motors' whole-body solve while a stance
 * limb presses the floor, and keep in the cache, at its instants, the task's
 * feasible split over the measured support points, a diagnostic of what the
 * supports were asked.
 */
function submit(
  input: trackPhysicalRoot.IInput,
  limbs: readonly IAutoMovieFootfallPattern["limbs"][number][],
  wrench: AutoMovieXpbdWorld.IRootTask,
): void {
  const { settings, body, bound, step, seconds } = input;
  const task: AutoMovieXpbdWorld.IRootTask = {
    ...wrench,
    ...transitions(input, limbs, Math.max(0, wrench.force.y)),
  };
  const points: (IAutoMovieCollectPhysicalSupports.IPoint & {
    bone: string;
  })[] = input.supports
    .filter((support: IAutoMovieCollectPhysicalSupports.ISupport): boolean =>
      limbs.some(
        (limb: IAutoMovieFootfallPattern["limbs"][number]): boolean =>
          limb.bone === support.bone,
      ),
    )
    .flatMap(
      (
        support: IAutoMovieCollectPhysicalSupports.ISupport,
      ): (IAutoMovieCollectPhysicalSupports.IPoint & { bone: string })[] =>
        support.samples.map(
          (
            sample: IAutoMovieCollectPhysicalSupports.IPoint,
          ): IAutoMovieCollectPhysicalSupports.IPoint & { bone: string } => ({
            bone: support.bone,
            ...sample,
          }),
        ),
    );
  if (points.length > 0) input.world.rootTasks.set(input.base, task);
  if (
    Math.round(seconds * settings.rate * settings.substeps!) %
      settings.substeps! !==
    0
  )
    return;
  const allocated: IAutoMovieDistributePhysicalSupportWrench.IResult =
    distributePhysicalSupportWrench({
      origin: task.origin,
      force: task.force,
      torque: task.torque,
      maximumForce: body.maximumRootForce * input.target.strength,
      points,
    });
  bound.supportWrenches.push({
    body: body.id,
    seconds: step / settings.rate,
    origin: task.origin,
    requested: { force: task.force, torque: task.torque },
    allocated: { force: allocated.force, torque: allocated.torque },
    residual: allocated.residual,
    pointCount: allocated.forces.length,
  });
}
/**
 * The support transitions a root task carries: each limb asked to step keeps
 * its contacts held while its bearing share of the vertical force bounds
 * their total, ramping to zero before it lifts (Herzog et al. 2016, Section
 * 5.3), both feet of a diagonal pair alike; the lifted limbs' contacts are
 * released to the contact passes, so their swings move them off the floor;
 * every stance limb's carriers stay the task's stance whatever their load, so
 * their legs keep their posture rows.
 */
function transitions(
  input: trackPhysicalRoot.IInput,
  limbs: readonly IAutoMovieFootfallPattern["limbs"][number][],
  force: number,
): Pick<AutoMovieXpbdWorld.IRootTask, "bounds" | "released" | "stance"> {
  const segments: ReadonlyMap<string, AutoMovieXpbdBody> =
    input.bound.segments.get(input.body.id)!;
  const pattern: readonly IAutoMovieFootfallPattern["limbs"][number][] = (
    input.body.supportTracking?.pattern ??
    input.body.balance?.pattern ?? { limbs: [] }
  ).limbs;
  const carriers = (bone: string | undefined): AutoMovieXpbdBody[] => {
    const limb: IAutoMovieFootfallPattern["limbs"][number] | undefined =
      pattern.find(
        (candidate: IAutoMovieFootfallPattern["limbs"][number]): boolean =>
          candidate.bone === bone,
      );
    return limb
      ? (limb.contacts ?? [limb.bone]).flatMap(
          (carrier: string): AutoMovieXpbdBody[] => {
            const rigid: AutoMovieXpbdBody | undefined = segments.get(carrier);
            return rigid ? [rigid] : [];
          },
        )
      : [];
  };
  const requested: readonly string[] = input.requested ?? [];
  const leaving: AutoMovieXpbdWorld.IBound[] = requested.flatMap(
    (bone: string): AutoMovieXpbdWorld.IBound[] => {
      const bodies: AutoMovieXpbdBody[] = carriers(bone);
      return bodies.length > 0
        ? [
            {
              bodies,
              force:
                Math.max(0, Math.min(1, input.seating?.[bone]?.bearing ?? 1)) *
                force,
            },
          ]
        : [];
    },
  );
  const lifted: AutoMovieXpbdBody[] = (input.recoveryBones ?? []).flatMap(
    (bone: string): AutoMovieXpbdBody[] => carriers(bone),
  );
  const stance: AutoMovieXpbdBody[] = limbs.flatMap(
    (limb: IAutoMovieFootfallPattern["limbs"][number]): AutoMovieXpbdBody[] =>
      carriers(limb.bone),
  );
  // A foot entering the holds, landed or touching again after it left them,
  // has its force bound ramp in with the lesser of its bearing and entry
  // shares, mirrored at lift-off (design-4017-qp3, Section 3, rule 3;
  // Herzog et al. 2016, Section 5.3).
  const entering: AutoMovieXpbdWorld.IBound[] = limbs.flatMap(
    (limb: IAutoMovieFootfallPattern["limbs"][number]): AutoMovieXpbdWorld.IBound[] => {
      if (requested.includes(limb.bone)) return [];
      const seat: NonNullable<trackPhysicalRoot.IInput["seating"]>[string] | undefined =
        input.seating?.[limb.bone];
      const ramp: number = Math.max(
        0,
        Math.min(1, seat?.bearing ?? 1, seat?.entry ?? 1),
      );
      const bodies: AutoMovieXpbdBody[] = carriers(limb.bone);
      return ramp < 1 && bodies.length > 0
        ? [{ bodies, force: ramp * force }]
        : [];
    },
  );
  const bounds: AutoMovieXpbdWorld.IBound[] = [...leaving, ...entering];
  return {
    ...(bounds.length > 0 ? { bounds } : {}),
    ...(lifted.length > 0 ? { released: new Set(lifted) } : {}),
    ...(stance.length > 0 ? { stance } : {}),
  };
}

/**
 * The yaw the stance feet stand turned by from their planted poses, as each
 * foot's world rotation was latched when its stance began or it last touched
 * again: their mean heading turn about the vertical, identity without a
 * latched foot (design-4017-qp3, Section 1, rule 2; Pratt et al., M2V2,
 * Section VII-C: a frame fixed to the supporting foot).
 */
function latchedHeading(
  body: IAutoMoviePhysicalSimulationInput.IBody,
  seating: trackPhysicalRoot.IInput["seating"],
  planted: trackPhysicalRoot.IInput["planted"],
  swinging: readonly string[],
): IAutoMovieQuaternion {
  let sum: number = 0;
  let count: number = 0;
  for (const limb of (body.supportTracking?.pattern ?? body.balance?.pattern)
    ?.limbs ?? []) {
    const anchor: { rotation: IAutoMovieQuaternion } | undefined =
      seating?.[limb.bone]?.anchor;
    const goal: IAutoMovieRigidTransform | undefined = planted?.[limb.bone];
    if (swinging.includes(limb.bone) || !anchor || !goal) continue;
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.multiply(anchor.rotation, Quaternion.inverse(goal.rotation)),
      { x: 0, y: 0, z: 1 },
    );
    if (!(Math.hypot(forward.x, forward.z) > 0)) continue;
    sum += Math.atan2(forward.x, forward.z);
    count += 1;
  }
  return count > 0
    ? Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, ((sum / count) * 180) / Math.PI)
    : { x: 0, y: 0, z: 0, w: 1 };
}

/**
 * Transient native state and explicit policy, without retained wrappers or provider-specific selectors.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Transient native state and explicit policy, without retained wrappers or provider-specific selectors) and documents 1 documented member as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Transient native state and explicit policy, without retained wrappers or provider-specific selectors: companion namespace of 1 member (`IInput`); units and frames named in its text: seconds. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `trackPhysicalRoot` in packages/engine/src/physics/trackPhysicalRoot.ts; its surface is the 1 member listed and the text shows 1 other file naming it, mostly packages/engine (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace trackPhysicalRoot {
  /**
   * The moment the stance's supports are asked to bear about the body, world
   * N m: the trunk's orientation servo in every support, single as double,
   * and each swinging hip's torque on its thigh, whose reaction the stance
   * holds. The stance hips hold the trunk in the world frame and take the
   * swing's reaction, tau_stance = -tau_torso - tau_swing (Yin, Loken and van
   * de Panne 2007, Section 3.2; Pratt et al., M2V2, Sections VII-D2 and
   * VII-E4); the centre of pressure's room bounds what is borne
   * (`physicalStanceBalance.allocate`). A swing hip's own demand is carried
   * whole and never trimmed to make room for the trunk: the swing keeps its
   * own task.
   *
   * @param input The trunk's servo moment and each swinging hip's torque on
   *   its thigh, world N m.
   * @returns Their sum, world N m.
   */
  export function moment(input: {
    trunk: IAutoMovieVector3;
    swings: readonly IAutoMovieVector3[];
  }): IAutoMovieVector3 {
    return input.swings.reduce(
      (sum: IAutoMovieVector3, hip: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(sum, hip),
      input.trunk,
    );
  }

  /** The same pre-integration state used by endpoint and joint controllers. */
  export interface IInput {
    /** Admitted global physical settings. */ settings: IAutoMoviePhysicalSimulationInput.IInput;
    /** Admitted provider and controller. */ body: IAutoMoviePhysicalSimulationInput.IBody;
    /** Transient native maps and prediction destination. */ bound: Bound;
    /** Native root wrapper. */ base: AutoMovieXpbdBody;
    /** Whether the root is currently dynamically owned. */ rootDynamic: boolean;
    /** Independent root motor intent captured before actual-root fitting. */ rootIntent: IAutoMovieSamplePhysicalTarget.IResult;
    /** Effective effort after physical balance assessment. */ target: IAutoMoviePhysicalSimulationInput.ITarget;
    /** Recovery's bounded virtual root-position intent. */ rootShift?: IAutoMovieVector3;
    /** The stance carriers' planted poses: authored, moved by a landed step. */ planted?: Readonly<
      Record<string, IAutoMovieRigidTransform>
    >;
    /** Each stance foot's seating and its ramped bearing and flatness shares (`advancePhysicalBalance`). */ seating?: Readonly<
      Record<
        string,
        {
          seated: boolean;
          since: number;
          bearing?: number;
          flat?: number;
          load?: number;
          entry?: number;
          relief?: number;
          anchor?: { point: IAutoMovieVector3; rotation: IAutoMovieQuaternion };
        }
      >
    >;
    /** The authored pose's centre of mass, world metres, moved with any landed step; internal actuation balances it. */ center?: IAutoMovieVector3;
    /** Whether a recovery step has landed, so the stance stands on a new polygon. */ landed?: boolean;
    /** The centre-of-pressure integral's persisted state, advanced in place (`physicalStanceBalance.integrate`). */ integral?: physicalStanceBalance.IIntegral;
    /** Whether an external push lands on the body this control frame. */ pushed?: boolean;
    /** Declared gravity-compensation moment about the root. */ gravity: IAutoMovieVector3;
    /** Internal Cartesian moments accumulate into bounded joint motors. */ actuation?: Map<
      string,
      IAutoMovieVector3
    >;
    /** Actual solved floor witnesses with their measured impulses and centres of pressure. */ supports: IAutoMovieCollectPhysicalSupports.ISupport[];
    /** Endpoints currently owned by recovery: the lifted swing limbs, a diagonal pair's both. */ recoveryBones?: readonly string[];
    /** Limbs asked to step that have not lifted yet: each one's share of the stance ramps out. */ requested?: readonly string[];
    /** Enclosing cache interval. */ step: number;
    /** Exact declared native tick time. */ seconds: number;
    /** Native integration duration. */ dt: number;
    /** The world whose motors' solve takes the root's task. */ world: AutoMovieXpbdWorld;
    /** Every segment's sampled goal, with the balance's root offset; the momentum task's reference pose. */ goals: Readonly<
      Record<string, IAutoMovieSamplePhysicalTarget.IResult>
    >;
  }
}
