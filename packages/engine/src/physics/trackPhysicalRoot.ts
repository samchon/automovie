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
    recoveryBone,
    dt,
  }: trackPhysicalRoot.IInput = input;
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
            rootIntent.pose.rotation,
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
        limb.bone !== recoveryBone &&
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
            // The swinging hip's reaction and, in double support, the trunk's
            // orientation servo, kept within the centre of pressure's room so
            // the task never asks the floor for more than it can bear (Feng
            // et al. 2013, Section III-B). The cascade ranks this task above
            // the motors, the swing's among them (Herzog et al. 2016); in
            // single support the trunk is left to its own joints, ranked with
            // the swing, as Khadiv et al. 2017 rank posture below the swing
            // (Table I), and it is restored once both feet bear.
            torque: Vector3.add(
              swingHip(body, segments, recoveryBone, actuation),
              recoveryBone === undefined ? orientation : { x: 0, y: 0, z: 0 },
            ),
            origin,
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
          recoveryBone !== undefined ||
          !(weight > 0) ||
          limbs.some((limb): boolean => feet[limb.bone]!.flat < 1),
        reset: integral.swing !== recoveryBone,
        ...(weight > 0 ? { real: Vector3.scale(realized, 1 / weight) } : {}),
      });
      integral.swing = recoveryBone;
    }
    submit(input, limbs, {
      origin,
      force: stance.force,
      torque: stance.torque,
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
  task: AutoMovieXpbdWorld.IRootTask,
): void {
  const { settings, body, bound, step, seconds } = input;
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
 * Transient native state and explicit policy, without retained wrappers or provider-specific selectors.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Transient native state and explicit policy, without retained wrappers or provider-specific selectors) and documents 1 documented member as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Transient native state and explicit policy, without retained wrappers or provider-specific selectors: companion namespace of 1 member (`IInput`); units and frames named in its text: seconds. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `trackPhysicalRoot` in packages/engine/src/physics/trackPhysicalRoot.ts; its surface is the 1 member listed and the text shows 1 other file naming it, mostly packages/engine (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace trackPhysicalRoot {
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
          touching?: boolean;
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
    /** Endpoint currently owned by recovery. */ recoveryBone?: string;
    /** Enclosing cache interval. */ step: number;
    /** Exact declared native tick time. */ seconds: number;
    /** Native integration duration. */ dt: number;
    /** The world whose motors' solve takes the root's task. */ world: AutoMovieXpbdWorld;
    /** Every segment's sampled goal, with the balance's root offset; the momentum task's reference pose. */ goals: Readonly<
      Record<string, IAutoMovieSamplePhysicalTarget.IResult>
    >;
  }
}
