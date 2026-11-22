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
import type { RigidBody, SdpMatrix3 } from "@dimforge/rapier3d-compat";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AutoMoviePhysicalTracking as Tracking } from "./AutoMoviePhysicalTracking";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { accumulatePhysicalMotorTorques } from "./accumulatePhysicalMotorTorques";
import { distributePhysicalSupportWrench } from "./distributePhysicalSupportWrench";
import { physicalJointInertia } from "./physicalJointInertia";
import { physicalNativeVector } from "./physicalNativeVector";
import { physicalStanceBalance } from "./physicalStanceBalance";
import { physicalStanceDynamics } from "./physicalStanceDynamics";
import { physicalSupportPoint } from "./physicalSupportPoint";

/**
 * Realize one bounded root demand through an external wrench or feasible actual-support joint torques.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Realize one bounded root demand through an external wrench or feasible actual-support joint torques) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Realize one bounded root demand through an external wrench or feasible actual-support joint torques) directly over its typed inputs (`input`) as nested iteration of depth 3 (map over (["x", "y", "z"] as const); filter over ( body.supportTracking?.pattern ??; flatMap over supports .filter((support: (type), delegating to `Vector3.add`, `Tracking.force`, `Vector3.subtract`, `base.translation`, `base.velocityAtPoint`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
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
    planted,
    seating,
    ankleCaps,
    dynamics,
    integral,
    pushed,
    gravity,
    actuation,
    supports,
    recoveryBone,
    step,
    seconds,
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
          base.velocityAtPoint(physicalNativeVector(base.translation())),
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
    const torque: IAutoMovieVector3 = Vector3.add(
      Tracking.torque(
        base.rotation(),
        rootIntent.pose.rotation,
        Vector3.subtract(base.angvel(), rootIntent.angularVelocity),
        axes,
        physicalJointInertia({ x: 0, y: 0, z: 0, w: 1 }, base),
        dt,
        rootStrength,
      ).torque,
      // Under internal actuation the supports carry the weight through the
      // centre of mass (`pendulum`), which already counters its moment about
      // the root; only the servo remains for them.
      actuation ? { x: 0, y: 0, z: 0 } : Vector3.scale(gravity, rootStrength),
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
    // force and the torso's servo moment plus any swing hip's reaction:
    // SIMBICON turns the torso by the stance hips alone, tau_A = -tau_torso -
    // tau_B (Yin, Loken and van de Panne 2007, Section 3.2), which the J^T
    // realization below gives each stance hip and carries down to the floor.
    const segments: ReadonlyMap<string, RigidBody> = bound.segments.get(
      body.id,
    )!;
    const origin: IAutoMovieVector3 = physicalNativeVector(base.worldCom());
    // Each stance foot's bearing and flatness shares, ramped through contact
    // changes (`advancePhysicalBalance`); a foot that is not flat bears toward
    // its ankle joint centre (Coros, Beaudoin and van de Panne 2010, Section
    // 3.3).
    const ankleOf = (limb: (typeof limbs)[number]): IAutoMovieVector3 => {
      const joint: IAutoMoviePhysicalJoint = body.profile.joints.find(
        (candidate: IAutoMoviePhysicalJoint): boolean =>
          candidate.child === limb.bone,
      )!;
      const parent: RigidBody = segments.get(joint.parent)!;
      return Vector3.add(
        physicalNativeVector(parent.translation()),
        Quaternion.rotateVector(parent.rotation(), joint.parentFrame.position),
      );
    };
    const feet: Record<
      string,
      { bearing: number; flat: number; ankle: IAutoMovieVector3 }
    > = Object.fromEntries(
      limbs.map((limb: (typeof limbs)[number]) => [
        limb.bone,
        {
          bearing: seating?.[limb.bone]?.bearing ?? 1,
          flat: seating?.[limb.bone]?.flat ?? 1,
          ankle: ankleOf(limb),
        },
      ]),
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
            velocity: rootIntent.velocity,
            torque: Vector3.add(
              rootTorque,
              swingHip(body, segments, recoveryBone, actuation),
            ),
            origin,
            strength: rootStrength,
            ...(integral
              ? { bias: { x: integral.bias.x, y: 0, z: integral.bias.z } }
              : {}),
          })
        : undefined;
    const demand: IAutoMovieVector3 = stance?.force ?? { x: 0, y: 0, z: 0 };
    const moment: IAutoMovieVector3 = stance?.torque ?? { x: 0, y: 0, z: 0 };
    let points: physicalStanceBalance.IResult["points"] = stance?.points ?? [];
    const allocated: IAutoMovieDistributePhysicalSupportWrench.IResult =
      distributePhysicalSupportWrench({
        origin,
        force: demand,
        torque: moment,
        maximumForce: body.maximumRootForce * rootStrength,
        points,
        // Each foot bears at most its bearing share of the force bound, so a
        // contact change ramps its load (Kim, Jorgensen and Sentis 2018).
        loads: Object.fromEntries(
          limbs.map((limb: (typeof limbs)[number]): [string, number] => [
            limb.bone,
            feet[limb.bone]!.bearing * body.maximumRootForce * rootStrength,
          ]),
        ),
        ...(stance
          ? {
              priority: stance.priority,
              normalization: stance.normalization,
              effort: {
                normal: physicalStanceBalance.EFFORT_NORMAL,
                tangential: physicalStanceBalance.EFFORT_TANGENTIAL,
              },
              exactNormal: true,
              yaw: stance.yaw,
            }
          : {}),
      });
    if (
      Math.round(seconds * settings.rate * settings.substeps!) %
        settings.substeps! ===
      0
    )
      bound.supportWrenches.push({
        body: body.id,
        seconds: step / settings.rate,
        origin: base.worldCom(),
        requested: { force: demand, torque: moment },
        allocated: { force: allocated.force, torque: allocated.torque },
        residual: allocated.residual,
        pointCount: allocated.forces.length,
      });
    let tracked: typeof allocated.forces = allocated.forces;
    // The centre-of-pressure integral reads the realized centre of pressure
    // from the actual contact points weighted by their normal impulses (the
    // solver's summed contact wrench), not from the centre of mass's
    // acceleration (Stephens 2011, Eq. 5.31).
    if (stance && integral) {
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
      const swinging: string | undefined = recoveryBone;
      physicalStanceBalance.integrate({
        state: integral,
        result: stance,
        dt,
        frozen:
          stance.clamped ||
          !!pushed ||
          swinging !== undefined ||
          !(weight > 0) ||
          limbs.some((limb): boolean => feet[limb.bone]!.flat < 1),
        reset: integral.swing !== swinging,
        ...(weight > 0 ? { real: Vector3.scale(realized, 1 / weight) } : {}),
      });
      integral.swing = swinging;
    }
    // The stance's joint accelerations and contact forces are solved together
    // once per control frame (`physicalStanceDynamics.stance`; TSID; Herzog et
    // al. 2016), the base's acceleration following from its six rows; every
    // substep each leg's torques are refreshed from that solution by one
    // Newton-Euler pass, tau = M_a q''* + h_a - J_a^T lambda*, and the solved
    // forces stand for the allocation. A bearing ankle's roll and pitch are
    // its impedance's (`physicalStanceBalance.hold`): the solve takes them as
    // given and adds no second centre-of-pressure feedback. A leg it cannot
    // cover keeps the J^T of the allocated forces.
    const field: IAutoMovieVector3 = Vector3.scale(
      settings.gravity,
      body.mode.kind === "exaggerated" ? body.mode.gravity : 1,
    );
    const solved: Set<string> = new Set();
    const legs = limbs.flatMap((limb) => {
      const joints: IAutoMoviePhysicalJoint[] = limb.chain.flatMap(
        (bone: string): IAutoMoviePhysicalJoint[] => {
          const joint: IAutoMoviePhysicalJoint | undefined =
            body.profile.joints.find(
              (candidate: IAutoMoviePhysicalJoint): boolean =>
                candidate.child === bone,
            );
          return joint ? [joint] : [];
        },
      );
      return joints.length === limb.chain.length ? [{ limb, joints }] : [];
    });
    const members: Set<string> = new Set(
      legs.flatMap(({ limb }) => [...limb.chain, ...(limb.contacts ?? [])]),
    );
    const frameOf = (joint: IAutoMoviePhysicalJoint): IAutoMovieQuaternion =>
      Quaternion.multiply(
        segments.get(joint.parent)!.rotation(),
        joint.parentFrame.rotation,
      );
    const worldAxis = (
      joint: IAutoMoviePhysicalJoint,
      axis: IAutoMoviePhysicalJointAxis,
    ): IAutoMovieVector3 =>
      Quaternion.rotateVector(frameOf(joint), {
        x: axis.axis === "x" ? 1 : 0,
        y: axis.axis === "y" ? 1 : 0,
        z: axis.axis === "z" ? 1 : 0,
      });
    const chainOf = (
      limb: (typeof limbs)[number],
      joints: IAutoMoviePhysicalJoint[],
    ): physicalStanceDynamics.IJoint[] =>
      joints.map((joint, index) => {
        const parent: RigidBody = segments.get(joint.parent)!;
        return {
          pivot: Vector3.add(
            physicalNativeVector(parent.translation()),
            Quaternion.rotateVector(
              parent.rotation(),
              joint.parentFrame.position,
            ),
          ),
          axes: joint.axes.map((axis: IAutoMoviePhysicalJointAxis) =>
            worldAxis(joint, axis),
          ),
          bodies: [
            rigidBody(segments.get(joint.child)!),
            ...(index === joints.length - 1
              ? (limb.contacts ?? [])
                  .filter((bone: string): boolean => !limb.chain.includes(bone))
                  .map((bone: string) => rigidBody(segments.get(bone)!))
              : []),
          ],
        };
      });
    const composite = (): physicalStanceDynamics.IBody => {
      const parts: physicalStanceDynamics.IBody[] = body.profile.segments
        .filter((segment) => !members.has(segment.bone))
        .map((segment) => rigidBody(segments.get(segment.bone)!));
      const mass: number = parts.reduce(
        (sum: number, part) => sum + part.mass,
        0,
      );
      const center: IAutoMovieVector3 = Vector3.scale(
        parts.reduce(
          (sum: IAutoMovieVector3, part): IAutoMovieVector3 =>
            Vector3.add(sum, Vector3.scale(part.center, part.mass)),
          { x: 0, y: 0, z: 0 },
        ),
        1 / mass,
      );
      const inertia: number[] = new Array<number>(9).fill(0);
      for (const part of parts) {
        const r: IAutoMovieVector3 = Vector3.subtract(part.center, center);
        const v: number[] = [r.x, r.y, r.z];
        const rr: number = Vector3.dot(r, r);
        for (let a: number = 0; a < 3; a++)
          for (let b: number = 0; b < 3; b++)
            inertia[3 * a + b]! +=
              part.inertia[3 * a + b]! +
              part.mass * ((a === b ? rr : 0) - v[a]! * v[b]!);
      }
      return {
        mass,
        center,
        inertia,
        velocity: physicalNativeVector(base.linvel()),
        angular: physicalNativeVector(base.angvel()),
      };
    };
    // A bearing ankle's roll and pitch axes: those not near the vertical.
    const level = (
      joint: IAutoMoviePhysicalJoint,
      axis: IAutoMoviePhysicalJointAxis,
    ): boolean => Math.abs(worldAxis(joint, axis).y) <= Math.SQRT1_2;
    if (stance && body.balance && planted && legs.length > 0) {
      const store: Map<string, IStanceFrame> = frames.get(bound) ?? new Map();
      frames.set(bound, store);
      let frame: IStanceFrame | undefined = store.get(body.id);
      if (!frame || frame.step !== step) {
        // TSID's contact gain: K_p = 10 per second squared, critically damped.
        const problem = legs.map(({ limb, joints }) => {
          const bearing: boolean = feet[limb.bone]!.bearing > 0;
          const rows = bearing
            ? points.filter((point) => point.bone === limb.bone)
            : [];
          const anchor = seating?.[limb.bone]?.anchor;
          const foot: RigidBody = segments.get(limb.bone)!;
          const ankle: IAutoMoviePhysicalJoint = joints[joints.length - 1]!;
          let held: { velocity: number[]; error: number[] } | undefined;
          if (bearing && anchor) {
            const at: IAutoMovieVector3 = physicalNativeVector(
              physicalSupportPoint(
                { position: foot.translation(), rotation: foot.rotation() },
                limb.localPoint,
              ),
            );
            const delta: IAutoMovieQuaternion = Quaternion.multiply(
              foot.rotation(),
              Quaternion.inverse(anchor.rotation),
            );
            const norm: number = Math.hypot(delta.x, delta.y, delta.z);
            const sign: number = delta.w < 0 ? -1 : 1;
            const scale: number =
              norm < 1e-12
                ? 2 * sign
                : (2 * Math.atan2(norm, Math.abs(delta.w)) * sign) / norm;
            const spin: IAutoMovieVector3 = physicalNativeVector(foot.angvel());
            const velocity: IAutoMovieVector3 = physicalNativeVector(
              foot.linvel(),
            );
            const shift: IAutoMovieVector3 = Vector3.subtract(at, anchor.point);
            held = {
              velocity: [
                spin.x,
                spin.y,
                spin.z,
                velocity.x,
                velocity.y,
                velocity.z,
              ],
              error: [
                delta.x * scale,
                delta.y * scale,
                delta.z * scale,
                shift.x,
                shift.y,
                shift.z,
              ],
            };
          }
          // A bearing ankle's roll and pitch torque is its impedance's now,
          // within what its allocated load can hold flat.
          // The ankle impedance is a known passive torque in the bias: the solve
          // leaves the ankle's feed-forward free and the motor adds the
          // impedance (Herzog et al. 2016, Eq. 1).
          const passive: Map<number, number> = new Map();
          const local: IAutoMovieVector3 = bearing
            ? Quaternion.rotateVector(
                Quaternion.inverse(frameOf(ankle)),
                physicalStanceBalance.hold({
                  carriers: [
                    ...new Set([limb.bone, ...(limb.contacts ?? [])]),
                  ].map((bone: string): RigidBody => segments.get(bone)!),
                  foot,
                  shank: segments.get(ankle.parent)!,
                  dt,
                  rotation: anchor?.rotation ?? planted[limb.bone]!.rotation,
                  ankle: feet[limb.bone]!.ankle,
                  duration: body.balance!.duration,
                  axes: ankle.axes.map((axis: IAutoMoviePhysicalJointAxis) =>
                    worldAxis(ankle, axis),
                  ),
                }),
              )
            : { x: 0, y: 0, z: 0 };
          const own = allocated.forces.filter(
            (force) => force.bone === limb.bone,
          );
          const resultant: IAutoMovieVector3 = own.reduce(
            (sum: IAutoMovieVector3, force): IAutoMovieVector3 =>
              Vector3.add(sum, force.force),
            { x: 0, y: 0, z: 0 },
          );
          let index: number = 0;
          const bounds = joints.flatMap((joint) =>
            joint.axes.map((axis: IAutoMoviePhysicalJointAxis) => {
              const bound = {
                lower: -(axis.reverseTorque ?? axis.maximumTorque),
                upper: axis.maximumTorque,
              };
              if (bearing && joint === ankle && level(joint, axis)) {
                const along: number[] = rows.map(
                  (row) =>
                    Quaternion.rotateVector(
                      Quaternion.inverse(frameOf(ankle)),
                      Vector3.cross(
                        resultant,
                        Vector3.subtract(row.point, feet[limb.bone]!.ankle),
                      ),
                    )[axis.axis],
                );
                const lowest: number = Math.min(0, ...along);
                const highest: number = Math.max(0, ...along);
                passive.set(
                  index,
                  Math.max(lowest, Math.min(highest, local[axis.axis])),
                );
              }
              index++;
              return bound;
            }),
          );
          const yaw: boolean = joints.some((joint) =>
            joint.axes.some((axis) => !level(joint, axis)),
          );
          const twist = stance.yaw.find((entry) => entry.bone === limb.bone);
          return {
            limb,
            joints,
            passive,
            leg: {
              joints: chainOf(limb, joints),
              points: rows.map((row) => ({
                point: row.point,
                friction: row.friction,
              })),
              load:
                feet[limb.bone]!.bearing * body.maximumRootForce * rootStrength,
              ...(held ? { held } : {}),
              yaw,
              ...(yaw && twist
                ? { twist: { center: twist.center, limit: twist.limit } }
                : {}),
              bounds,
            } satisfies physicalStanceDynamics.ILeg,
          };
        });
        const solution = physicalStanceDynamics.stance({
          base: composite(),
          legs: problem.map((entry) => entry.leg),
          gravity: field,
          stiffness: 10,
          damping: 2 * Math.sqrt(10),
          task: { force: stance.force, moment: stance.torque, origin },
          ...(frame?.solution
            ? {
                previous: problem.map((entry) => {
                  const at: number = frame!.legs.findIndex(
                    (leg) => leg.bone === entry.limb.bone,
                  );
                  return at >= 0 &&
                    frame!.legs[at]!.points.length === entry.leg.points.length
                    ? frame!.solution!.forces[at]!
                    : [];
                }),
              }
            : {}),
        });
        frame = {
          step,
          solution,
          legs: problem.map((entry) => ({
            bone: entry.limb.bone,
            points: entry.leg.points.map((p) => p.point),
            carrier: (entry.limb.contacts ?? [entry.limb.bone])[0]!,
            passive: [...entry.passive.entries()],
            friction: entry.leg.points.map((p) => p.friction),
          })),
        };
        store.set(body.id, frame);
      }
      const solution = frame.solution;
      if (solution) {
        const now: physicalStanceDynamics.IBody = composite();
        const baseMotion = {
          ...now,
          acceleration: {
            x: solution.base[0]!,
            y: solution.base[1]!,
            z: solution.base[2]!,
          },
          angularAcceleration: {
            x: solution.base[3]!,
            y: solution.base[4]!,
            z: solution.base[5]!,
          },
        };
        const solvedForces: typeof allocated.forces = [];
        frame.legs.forEach((entry, index: number): void => {
          const leg = legs.find(({ limb }) => limb.bone === entry.bone);
          if (!leg) return;
          const torque: number[] = physicalStanceDynamics.refresh(
            baseMotion,
            chainOf(leg.limb, leg.joints),
            field,
            entry.points,
            solution.forces[index]!,
            solution.acceleration[index]!,
          );
          if (!torque.every(Number.isFinite)) return;
          let at: number = 0;
          for (const joint of leg.joints) {
            const local: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
            const rate: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
            for (const axis of joint.axes) {
              const held: [number, number] | undefined = entry.passive.find(
                ([k]) => k === at,
              );
              local[axis.axis] = torque[at]! - (held ? held[1] : 0);
              rate[axis.axis] = solution.acceleration[index]![at]! * dt;
              at++;
            }
            actuation.set(
              joint.id,
              Vector3.add(
                actuation.get(joint.id) ?? { x: 0, y: 0, z: 0 },
                local,
              ),
            );
            dynamics?.set(joint.id, rate);
          }
          entry.points.forEach((point, k: number): void => {
            solvedForces.push({
              bone: entry.bone,
              point,
              force: solution.forces[index]![k]!,
              friction: entry.friction[k]!,
            });
          });
          solved.add(entry.bone);
        });
        tracked = solvedForces;
        points = solvedForces.map((force) => ({
          bone: force.bone,
          carrier: frame!.legs.find((leg) => leg.bone === force.bone)!.carrier,
          point: force.point,
          friction: force.friction,
        }));
      }
    } // Allocation preserves input order, including coincident points on different carriers.
    for (const [index, contact] of tracked.entries()) {
      if (solved.has(contact.bone)) continue;
      const limb: (typeof limbs)[number] = limbs.find(
        (candidate: (typeof limbs)[number]): boolean =>
          candidate.bone === contact.bone,
      )!;
      accumulatePhysicalMotorTorques({
        profile: body.profile,
        segments,
        chain: limb.chain,
        carrier: points[index]!.carrier,
        point: contact.point,
        force: contact.force,
        torque: { x: 0, y: 0, z: 0 },
        reverse: true,
        torques: actuation,
      });
    } // Every stance foot's support point is servoed in the world frame to its
    // latched footprint through its leg's J^T: the swing controller with a
    // stationary target (Coros, Beaudoin and van de Panne 2010, Section 3.2;
    // Pratt et al., M2V2, Section VII-D), K = Lambda omega_n^2 and D = 2
    // Lambda omega_n, bounded by twice the leg's weight. The target is the footprint
    // latched where the foot actually stood when its stance began
    // (`advancePhysicalBalance`), so the error is zero while the foot stays
    // planted and it adds nothing to a borne foot; it keeps an unloaded foot
    // where it was planted.
    const servos: Map<string, IAutoMovieVector3> = new Map();
    if (planted && body.balance)
      for (const limb of limbs) {
        // A held foot's contact row in the joint solve keeps it in place.
        if (solved.has(limb.bone) && feet[limb.bone]!.bearing > 0) continue;
        const rigid: RigidBody = segments.get(limb.bone)!;
        const point: IAutoMovieVector3 = physicalNativeVector(
          physicalSupportPoint(
            { position: rigid.translation(), rotation: rigid.rotation() },
            limb.localPoint,
          ),
        );
        const goal: IAutoMovieVector3 =
          seating?.[limb.bone]?.anchor?.point ??
          physicalSupportPoint(planted[limb.bone]!, limb.localPoint);
        // The gains are sized by the foot point's own effective mass, Lambda
        // = (J M^-1 J^T)^-1 for the foot body at that point (Khatib 1987),
        // in its least massive direction, so the servo cannot overdrive the
        // point it moves; its damping is implicit (backward Euler), which
        // stays stable at any gain over a substep.
        const lever: IAutoMovieVector3 = Vector3.subtract(
          point,
          physicalNativeVector(rigid.worldCom()),
        );
        const inverse: SdpMatrix3 = rigid.effectiveWorldInvInertia();
        const effective: number = Math.min(
          ...[
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 0, y: 0, z: 1 },
          ].map((axis: IAutoMovieVector3): number => {
            const w: IAutoMovieVector3 = Vector3.cross(lever, axis);
            return (
              1 /
              (rigid.invMass() +
                w.x * w.x * inverse.m11 +
                w.y * w.y * inverse.m22 +
                w.z * w.z * inverse.m33 +
                2 *
                  (w.x * w.y * inverse.m12 +
                    w.x * w.z * inverse.m13 +
                    w.y * w.z * inverse.m23))
            );
          }),
        );
        const leg: number = [
          ...new Set([...limb.chain, ...(limb.contacts ?? [])]),
        ].reduce(
          (sum: number, bone: string): number =>
            sum +
            (body.profile.segments.find((segment) => segment.bone === bone)
              ?.mass ?? 0),
          0,
        );
        const frequency: number =
          physicalStanceBalance.HOLD_FREQUENCY / body.balance.duration;
        const force: IAutoMovieVector3 = Tracking.force(
          Vector3.subtract(goal, point),
          physicalNativeVector(
            rigid.velocityAtPoint(physicalNativeVector(point)),
          ),
          effective,
          effective * frequency * frequency,
          2 * effective * frequency,
          2 * leg * Vector3.length(settings.gravity),
          dt,
        );
        servos.set(limb.bone, force);
        accumulatePhysicalMotorTorques({
          profile: body.profile,
          segments,
          chain: limb.chain,
          carrier: limb.bone,
          point,
          force,
          torque: { x: 0, y: 0, z: 0 },
          reverse: false,
          torques: actuation,
        });
      }
    // Every stance ankle adds a world-frame hold of its sole
    // (`physicalStanceBalance.hold`), always on whatever the load, to the
    // contact moment its allocation already gave it through J^T: the full
    // sum (p_i - r_ankle) x f_i over the foot's allocated forces, the ankle
    // height times the horizontal force included. Its motor is bounded each
    // way by the moment the foot's allocated force F can have about the axis
    // while its centre of pressure p stays on what it bears on, (-(p -
    // r_ankle) x F) . a at the extreme vertex of its shrunken outline (its
    // ankle point when not flat), plus the hold, under the joint's own
    // strength (Koolen et al., capturability, Eqs. 18-20): a foot stays flat
    // only while its centre of pressure stays inside.
    if (ankleCaps && planted && body.balance)
      for (const limb of limbs) {
        const foot = feet[limb.bone]!;
        const joint: IAutoMoviePhysicalJoint = body.profile.joints.find(
          (candidate: IAutoMoviePhysicalJoint): boolean =>
            candidate.child === limb.bone,
        )!;
        const frame: IAutoMovieQuaternion = Quaternion.multiply(
          segments.get(joint.parent)!.rotation(),
          joint.parentFrame.rotation,
        );
        const held: IAutoMovieVector3 = physicalStanceBalance.hold({
          carriers: [...new Set([limb.bone, ...(limb.contacts ?? [])])].map(
            (bone: string): RigidBody => segments.get(bone)!,
          ),
          foot: segments.get(limb.bone)!,
          shank: segments.get(joint.parent)!,
          dt,
          rotation:
            seating?.[limb.bone]?.anchor?.rotation ??
            planted[limb.bone]!.rotation,
          ankle: foot.ankle,
          duration: body.balance.duration,
          axes: joint.axes.map(
            (axis: IAutoMoviePhysicalJointAxis): IAutoMovieVector3 =>
              Quaternion.rotateVector(frame, {
                x: axis.axis === "x" ? 1 : 0,
                y: axis.axis === "y" ? 1 : 0,
                z: axis.axis === "z" ? 1 : 0,
              }),
          ),
        });
        const hold: IAutoMovieVector3 = Quaternion.rotateVector(
          Quaternion.inverse(frame),
          held,
        );
        actuation.set(
          joint.id,
          Vector3.add(actuation.get(joint.id) ?? { x: 0, y: 0, z: 0 }, hold),
        );
        // A foot the floor does not carry keeps its ordinary motor, its hold
        // added; only a bearing foot's ankle is bounded by its contact.
        if (!(foot.bearing > 0)) continue;
        const resultant: IAutoMovieVector3 = tracked
          .filter((force) => force.bone === limb.bone)
          .reduce(
            (sum: IAutoMovieVector3, force): IAutoMovieVector3 =>
              Vector3.add(sum, force.force),
            { x: 0, y: 0, z: 0 },
          );
        // The rows the allocation gave this foot: its outline drawn toward
        // its ankle point by its flatness.
        const bearing: IAutoMovieVector3[] = points
          .filter((point): boolean => point.bone === limb.bone)
          .map((point): IAutoMovieVector3 => point.point);
        if (bearing.length === 0)
          bearing.push({ ...foot.ankle, y: settings.floor });
        // The torque, in the joint frame, the ankle must give its foot to hold
        // the resultant at each vertex it may bear at: -(p - r_ankle) x F, the
        // sign J^T gives a support's chain (`accumulatePhysicalMotorTorques`).
        const moments: IAutoMovieVector3[] = bearing.map(
          (point: IAutoMovieVector3): IAutoMovieVector3 =>
            Quaternion.rotateVector(
              Quaternion.inverse(frame),
              Vector3.cross(resultant, Vector3.subtract(point, foot.ankle)),
            ),
        );
        const bounds: Partial<
          Record<"x" | "y" | "z", { up: number; down: number }>
        > = {};
        for (const axis of joint.axes) {
          const along: number[] = moments.map(
            (moment: IAutoMovieVector3): number => moment[axis.axis],
          );
          bounds[axis.axis] = {
            up: Math.max(0, Math.max(...along) + hold[axis.axis]),
            down: Math.max(0, -(Math.min(...along) + hold[axis.axis])),
          };
        }
        ankleCaps.set(joint.id, bounds);
      }
  } else if (rootDynamic && !actuation) {
    base.addForce(physicalNativeVector(force), true);
    base.addTorque(physicalNativeVector(rootTorque), true);
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
  segments: ReadonlyMap<string, RigidBody>,
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
    /** Native root wrapper. */ base: RigidBody;
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
    /** Filled with each planted ankle's motor bounds this step, by joint id and axis, newton metres. */ ankleCaps?: Map<
      string,
      Partial<Record<"x" | "y" | "z", { up: number; down: number }>>
    >;
    /** The authored pose's centre of mass, world metres, moved with any landed step; internal actuation balances it. */ center?: IAutoMovieVector3;
    /** The centre-of-pressure integral's persisted state, advanced in place (`physicalStanceBalance.integrate`). */ integral?: physicalStanceBalance.IIntegral;
    /** Whether an external push lands on the body this control frame. */ pushed?: boolean;
    /** Declared gravity-compensation moment about the root. */ gravity: IAutoMovieVector3;
    /** Internal Cartesian moments accumulate into bounded joint motors. */ actuation?: Map<
      string,
      IAutoMovieVector3
    >;
    /** Actual solved floor witnesses with their measured impulses and centres of pressure. */ supports: IAutoMovieCollectPhysicalSupports.ISupport[];
    /** Filled with the joints whose torques this step carry their stance chain's inverse dynamics, gravity included, each with the joint-velocity change the solve gives over the substep, joint frame, radians per second. */ dynamics?: Map<
      string,
      IAutoMovieVector3
    >;
    /** Endpoint currently owned by recovery. */ recoveryBone?: string;
    /** Enclosing cache interval. */ step: number;
    /** Exact declared native tick time. */ seconds: number;
    /** Native integration duration. */ dt: number;
  }
}

/** A native body as the stance dynamics reads it: mass, centre, world inertia and velocities. */
function rigidBody(rigid: RigidBody): physicalStanceDynamics.IBody {
  const frame: IAutoMovieQuaternion = Quaternion.multiply(
    rigid.rotation(),
    rigid.principalInertiaLocalFrame(),
  );
  const principal: IAutoMovieVector3 = physicalNativeVector(
    rigid.principalInertia(),
  );
  const columns: IAutoMovieVector3[] = [
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
  ].map((unit: IAutoMovieVector3): IAutoMovieVector3 => {
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(frame),
      unit,
    );
    return Quaternion.rotateVector(frame, {
      x: principal.x * local.x,
      y: principal.y * local.y,
      z: principal.z * local.z,
    });
  });
  return {
    mass: rigid.mass(),
    center: physicalNativeVector(rigid.worldCom()),
    inertia: [
      columns[0]!.x,
      columns[1]!.x,
      columns[2]!.x,
      columns[0]!.y,
      columns[1]!.y,
      columns[2]!.y,
      columns[0]!.z,
      columns[1]!.z,
      columns[2]!.z,
    ],
    velocity: physicalNativeVector(rigid.linvel()),
    angular: physicalNativeVector(rigid.angvel()),
  };
}

/** One body's joint solve, kept for the control frame it was solved in. */
interface IStanceFrame {
  step: number;
  solution: physicalStanceDynamics.ISolution | undefined;
  legs: {
    bone: string;
    points: IAutoMovieVector3[];
    carrier: string;
    passive: [number, number][];
    friction: number[];
  }[];
}

/** The joint solves of the frames in progress, by binding and body. */
const frames: WeakMap<Bound, Map<string, IStanceFrame>> = new WeakMap();
