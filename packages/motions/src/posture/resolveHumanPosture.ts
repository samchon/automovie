import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  clampPose,
  fitChainToTarget,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "./HumanFoot";
import type { IHumanPosture } from "./IHumanPosture";
import { hipJoints } from "./hipJoints";
import { poseBones } from "./poseBones";

/**
 * Resolve a posture into a canonical pose: the root from the posture's
 * position and heading, every directly set joint clamped to the rig's range
 * of motion, then each limb goal by the engine's two-bone fit with its bend
 * hint, arms after the trunk and legs after the root, last, so nothing moves
 * a solved goal afterwards.
 *
 * Bones a posture neither sets nor solves stand at clinical zero, so every
 * pose this returns lists every rig bone and reads the same on any renderer.
 * The limb fit is `fitChainToTarget`, which clamps its candidates to the
 * rig's range of motion and searches bend planes when the hinted one misses;
 * the set joints are clamped by `clampPose` before it, so no returned angle
 * exceeds the rig's declared range and the clamp never moves a plant.
 *
 * @param body The performer's body.
 * @param posture The posture.
 * @param base A pose whose joints replace clinical zero for unset bones, such
 *   as a transition's displayed pose; its root is ignored.
 * @returns The canonical pose.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the order, the default for unset bones, the IK owner and where the clamp runs.
 * @evidence contracts/development/implementation.md#principled-implementation Root, then forward joints clamped to their range, then two-bone IK per limb with a pole hint (the engine's fitChainToTarget, range-clamped itself): the standard procedural order where IK runs last, on the already posed parents.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pose assembly, one clamp, one fit per goal.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No angle is set past the rig's range; an unreachable goal leaves the limb extended toward it, reported by the audits.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in bones plus up to four limb fits, each a bounded bend search.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input; the body's topology is shared.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function resolveHumanPosture(
  body: IHumanBody,
  posture: IHumanPosture,
  base?: IAutoMoviePose,
): IAutoMoviePose {
  const kept: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> = new Map(
    (base?.joints ?? []).map(
      (
        j: IAutoMovieJointPose,
      ): [AutoMovieHumanoidBone, IAutoMovieJointPose] => [j.bone, j],
    ),
  );
  const joints: IAutoMovieJointPose[] = body.skeleton.bones.map(
    (b): IAutoMovieJointPose => {
      const set: readonly [number, number, number] | undefined =
        posture.joints[b.bone];
      if (set !== undefined)
        return {
          bone: b.bone,
          flexion: set[0],
          abduction: set[1],
          twist: set[2],
        };
      return (
        kept.get(b.bone) ?? { bone: b.bone, flexion: 0, abduction: 0, twist: 0 }
      );
    },
  );
  // The set joints are clamped first and the limbs fitted last, so the clamp
  // never moves a solved goal; the fit keeps the limb's own angles in range.
  let pose: IAutoMoviePose = clampPose(
    {
      skeleton: body.skeleton.id,
      root: {
        translation: posture.root,
        rotation: resolveHumanPosture.heading(posture),
        scale: { x: 1, y: 1, z: 1 },
      },
      joints,
    },
    body.skeleton,
  );
  for (const limb of resolveHumanPosture.order(posture.limbs)) {
    const goal: IHumanPosture.IGoal | undefined = posture.limbs[limb];
    if (goal === undefined) continue;
    pose = fitLimb(body, pose, limb, goal);
  }
  return pose;
}

/**
 * Companion helpers of {@link resolveHumanPosture}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each helper's convention.
 * @evidence contracts/development/implementation.md#principled-implementation Heading is yaw about +Y, then pitch about the turned +X, then roll about the turned +Z, the intrinsic order of a body turning, then leaning.
 */
export namespace resolveHumanPosture {
  /**
   * A posture's root rotation: yaw about +Y, then pitch about the turned
   * left axis (+X, a forward tip), then roll about the turned forward axis
   * (+Z, a tip toward the right).
   *
   * @param posture The posture's heading.
   * @returns The rotation.
   */
  export function heading(
    posture: Pick<IHumanPosture, "yaw" | "pitch" | "roll">,
  ): IAutoMovieQuaternion {
    return Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, posture.yaw),
        Quaternion.multiply(
          Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, posture.pitch),
          Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, posture.roll),
        ),
      ),
    );
  }

  /**
   * The heading angles of a root rotation, the inverse of {@link heading}:
   * with `R = Ry(yaw) Rx(pitch) Rz(roll)`, the turned forward axis is
   * `(sin yaw cos pitch, -sin pitch, cos yaw cos pitch)` and the vertical
   * components of the turned left and up axes are `sin roll cos pitch` and
   * `cos roll cos pitch`. A rotation composed in the world (a pelvis tilted
   * about a floor axis after its turn) becomes a posture's heading through
   * it. At a pitch of 90 degrees yaw and roll turn about the same axis and
   * only their sum is defined; the yaw is then returned as 0 with the whole
   * turn in the roll's reading, which no upright posture reaches.
   *
   * @param rotation The root's world rotation, unit.
   * @returns Yaw, pitch and roll, degrees.
   */
  export function angles(
    rotation: IAutoMovieQuaternion,
  ): Pick<IHumanPosture, "yaw" | "pitch" | "roll"> {
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 0,
      y: 0,
      z: 1,
    });
    const left: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 1,
      y: 0,
      z: 0,
    });
    const up: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
    const degrees: number = 180 / Math.PI;
    return {
      yaw: Math.atan2(forward.x, forward.z) * degrees,
      pitch: -Math.asin(Math.max(-1, Math.min(1, forward.y))) * degrees,
      roll: Math.atan2(left.y, up.y) * degrees,
    };
  }

  /**
   * A posture with its root lowered along gravity to the highest height at
   * which every planted leg reaches its goal with at least `knee` degrees of
   * knee flexion: a standing body bends its knees rather than letting a foot
   * leave its plant, the root adjustment of footskate cleanup (Kovar,
   * Schreiner and Gleicher 2002). The hip joints are read from the posture's
   * root, heading and trunk joints, so a turned or listed pelvis counts. A
   * leg whose goal lies horizontally beyond its reach cannot be helped by
   * lowering and is left to the audits.
   *
   * @param body The performer's body.
   * @param posture The posture; legs with `planted` goals are kept reachable.
   * @param knee The least knee flexion, degrees; 5 when absent.
   * @returns The posture, its root lowered when needed.
   */
  export function lower(
    body: IHumanBody,
    posture: IHumanPosture,
    knee: number = 5,
  ): IHumanPosture {
    // Only world-anchored plants are lowered for: a leg goal attached to a
    // bone moves with that bone, so the root cannot be solved against it here.
    const legs: { side: "left" | "right"; goal: IAutoMovieVector3 }[] = [];
    for (const side of ["left", "right"] as const) {
      const goal: IHumanPosture.IGoal | undefined = posture.limbs[`${side}Leg`];
      if (goal?.planted === true && goal.on === undefined)
        legs.push({ side, goal: goal.point });
    }
    if (legs.length === 0) return posture;
    const hips: Record<"left" | "right", IAutoMovieVector3> = hipJoints(
      body,
      posture.root,
      heading(posture),
      posture.joints.hips,
    );
    let drop: number = 0;
    for (const { side, goal } of legs)
      drop = Math.max(drop, short(body, hips[side], goal, knee));
    return drop === 0
      ? posture
      : { ...posture, root: { ...posture.root, y: posture.root.y - drop } };
  }

  /**
   * How far a hip joint stands above the height from which its leg reaches an
   * ankle with `knee` degrees of knee flexion: the lowering that leg asks of
   * the root, by Pythagoras on the leg's length at that flexion and the
   * ankle's horizontal distance.
   *
   * @param body The performer's body.
   * @param hip The hip joint, world metres.
   * @param ankle The ankle, world metres.
   * @param knee The least knee flexion, degrees.
   * @returns Metres, negative by the slack of a leg that reaches with more
   *   flexion, and `-Infinity` for an ankle horizontally beyond the leg's
   *   reach, which no lowering helps.
   */
  export function short(
    body: IHumanBody,
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    knee: number,
  ): number {
    const a: number = body.measure.thigh;
    const b: number = body.measure.shank;
    const limit: number = Math.sqrt(
      a * a + b * b + 2 * a * b * Math.cos((knee * Math.PI) / 180),
    );
    const dh: number = Math.hypot(hip.x - ankle.x, hip.z - ankle.z);
    return dh < limit
      ? hip.y - ankle.y - Math.sqrt(limit * limit - dh * dh)
      : -Infinity;
  }

  /**
   * Re-solve one limb of a pose onto a goal, keeping everything else.
   *
   * @param body The performer's body.
   * @param pose The pose.
   * @param limb The limb.
   * @param goal Its goal.
   * @returns The pose with the limb fitted.
   */
  export function limb(
    body: IHumanBody,
    pose: IAutoMoviePose,
    limb: IHumanPosture.Limb,
    goal: IHumanPosture.IGoal,
  ): IAutoMoviePose {
    return fitLimb(body, pose, limb, goal);
  }

  /**
   * A limb's reference solution read off a pose: the clinical angles of its
   * upper and lower bones. A law solves the limb once at the instant its
   * action is about (the grasp, the clasp, the placement) and hands the
   * result to every goal of the stroke as `IHumanPosture.IGoal.reference`.
   *
   * @param pose The pose the limb was solved in.
   * @param limb The limb.
   * @returns The reference.
   */
  export function reference(
    pose: IAutoMoviePose,
    limb: IHumanPosture.Limb,
  ): IHumanPosture.IReference {
    const chain: IChain = chainOf(limb);
    const read = (
      bone: AutoMovieHumanoidBone,
    ): readonly [number, number, number] => {
      const joint: IAutoMovieJointPose | undefined = pose.joints.find(
        (j: IAutoMovieJointPose): boolean => j.bone === bone,
      );
      return [joint?.flexion ?? 0, joint?.abduction ?? 0, joint?.twist ?? 0];
    };
    return { upper: read(chain.upper), lower: read(chain.lower) };
  }

  /**
   * The order to fit a posture's limbs in: arms then legs, each limb after
   * any limb whose bones its goal is attached to (`on`), so an attachment
   * reads that limb's solved frame (a palm under the other elbow follows the
   * other arm). A limb's bones are its chain, its hand or foot, and the
   * fingers or toes beyond them. Two limbs attached to each other (crossed
   * arms, each palm on the other arm) cannot be ordered and are refused; a
   * law that wants them solves the pair itself and attaches to a shared bone
   * such as the chest.
   *
   * @param limbs The posture's limb goals.
   * @returns Every limb, in fitting order.
   * @throws {Error} When two limbs' goals are attached to each other, naming both.
   */
  export function order(limbs: IHumanPosture["limbs"]): IHumanPosture.Limb[] {
    const all: readonly IHumanPosture.Limb[] = [
      "leftArm",
      "rightArm",
      "leftLeg",
      "rightLeg",
    ];
    // The limb a bone belongs to, when it belongs to one.
    const owner = (
      bone: AutoMovieHumanoidBone,
    ): IHumanPosture.Limb | undefined =>
      all.find((limb: IHumanPosture.Limb): boolean => {
        const side: string = limb.startsWith("left") ? "left" : "right";
        return limb.endsWith("Arm")
          ? bone.startsWith(side) &&
              /(UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Little)/.test(
                bone,
              )
          : bone.startsWith(side) &&
              /(UpperLeg|LowerLeg|Foot|Toes|Hallux)/.test(bone);
      });
    const after = (
      limb: IHumanPosture.Limb,
    ): IHumanPosture.Limb | undefined => {
      const on: AutoMovieHumanoidBone | undefined = limbs[limb]?.on;
      const first: IHumanPosture.Limb | undefined =
        on === undefined ? undefined : owner(on);
      return first === limb ? undefined : first;
    };
    for (const limb of all) {
      const first: IHumanPosture.Limb | undefined = after(limb);
      if (first !== undefined && after(first) === limb)
        throw new Error(
          `The ${limb} and ${first} goals are attached to each other and cannot be ordered`,
        );
    }
    // With at most one dependency per limb and no two-cycle, placing each limb
    // after its dependency in one pass is a topological order of four nodes.
    const out: IHumanPosture.Limb[] = [];
    const visit = (limb: IHumanPosture.Limb, depth: number): void => {
      if (out.includes(limb)) return;
      if (depth > all.length)
        throw new Error("Limb goal attachments form a cycle");
      const first: IHumanPosture.Limb | undefined = after(limb);
      if (first !== undefined) visit(first, depth + 1);
      out.push(limb);
    };
    for (const limb of all) visit(limb, 0);
    return out;
  }

  /**
   * A limb goal in world terms: unchanged when it has no `on` bone, otherwise
   * its point and bend carried from the bone's posed frame to the world
   * (`p_world = P + R p`) and its rotation composed after the bone's
   * (`R q`), with the bone placed by the given pose. The attachment is
   * refused for a bone of the limb's own chain (its upper bone, its lower
   * bone or its end), because fitting the limb moves that bone and the goal
   * would chase itself.
   *
   * @param body The performer's body.
   * @param pose The pose that places the attachment bone, before the limb is fitted.
   * @param limb The limb the goal is for.
   * @param goal The goal, attached or not.
   * @returns The goal with world point, bend and rotation and no `on`.
   * @throws {Error} When the goal is attached to a bone of its own limb's chain, or to a bone the rig lacks.
   */
  export function world(
    body: IHumanBody,
    pose: IAutoMoviePose,
    limb: IHumanPosture.Limb,
    goal: IHumanPosture.IGoal,
  ): IHumanPosture.IGoal {
    const on: AutoMovieHumanoidBone | undefined = goal.on;
    if (on === undefined) return goal;
    const side: "left" | "right" = limb.startsWith("left") ? "left" : "right";
    const chain: readonly AutoMovieHumanoidBone[] = limb.endsWith("Arm")
      ? [`${side}UpperArm`, `${side}LowerArm`, `${side}Hand`]
      : [`${side}UpperLeg`, `${side}LowerLeg`, `${side}Foot`];
    if (chain.includes(on))
      throw new Error(
        `A ${limb} goal cannot be attached to ${on}, a bone of its own chain`,
      );
    const frame: IAutoMovieResolvedBone | undefined = poseBones(body, pose).get(
      on,
    );
    if (frame === undefined)
      throw new Error(
        `A ${limb} goal is attached to ${on}, which the rig lacks`,
      );
    const place = (p: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(
        frame.worldPosition,
        Quaternion.rotateVector(frame.worldRotation, p),
      );
    const { on: _attached, ...rest } = goal;
    return {
      ...rest,
      point: place(goal.point),
      bend: place(goal.bend),
      ...(goal.rotation === undefined
        ? {}
        : {
            rotation: Quaternion.normalize(
              Quaternion.multiply(frame.worldRotation, goal.rotation),
            ),
          }),
    };
  }
}

/** How far a re-aimed end joint may still move between two fits of a limb with a contact, metres (provisional: a fiftieth of a millimetre, far inside every contact verdict). */
const REAIM_TOLERANCE: number = 2e-5;

/** The most fits a limb with a contact takes (provisional: the mixed iteration closes in three to five on a joint at its limit). */
const REAIM_PASSES: number = 8;

/** The three bones of a limb's chain. */
interface IChain {
  /** The bone at the shoulder or the hip. */
  upper: AutoMovieHumanoidBone;

  /** The bone at the elbow or the knee. */
  lower: AutoMovieHumanoidBone;

  /** The hand or the foot. */
  effector: AutoMovieHumanoidBone;
}

/** The chain of a limb. */
function chainOf(limb: IHumanPosture.Limb): IChain {
  const side: "left" | "right" = limb.startsWith("left") ? "left" : "right";
  return limb.endsWith("Arm")
    ? {
        upper: `${side}UpperArm`,
        lower: `${side}LowerArm`,
        effector: `${side}Hand`,
      }
    : {
        upper: `${side}UpperLeg`,
        lower: `${side}LowerLeg`,
        effector: `${side}Foot`,
      };
}

/**
 * The fit of one limb by the engine's two-bone solver; with a contact, the end
 * joint is re-aimed until the contact stays put, within `REAIM_TOLERANCE`,
 * under the rotation the limb actually reached (`HumanFoot.heelOff`), and a
 * foot's toes take back the pitch that fit lost. The re-aim is a fixed-point
 * iteration with Anderson's mixing of depth one (Anderson 1965, "Iterative
 * procedures for nonlinear integral equations", J. ACM 12; Walker and Ni
 * 2011, SIAM J. Numer. Anal. 49), at most `REAIM_PASSES` fits. A goal attached to a bone (`on`) is first carried into
 * the world by that bone as the pose being fitted places it, so whatever
 * moved the bone before the fit (a trunk joint, a layer, a transition
 * offset) moves the goal with it.
 */
function fitLimb(
  body: IHumanBody,
  pose: IAutoMoviePose,
  limb: IHumanPosture.Limb,
  attached: IHumanPosture.IGoal,
): IAutoMoviePose {
  const goal: IHumanPosture.IGoal = resolveHumanPosture.world(
    body,
    pose,
    limb,
    attached,
  );
  let fitted: IAutoMoviePose = fitOnce(body, pose, limb, goal);
  if (goal.contact === undefined || goal.rotation === undefined) return fitted;
  const side: "left" | "right" = limb.startsWith("left") ? "left" : "right";
  const leg: boolean = limb.endsWith("Leg");
  const effector: AutoMovieHumanoidBone = leg ? `${side}Foot` : `${side}Hand`;
  const anchor: IAutoMovieVector3 = Vector3.add(
    goal.point,
    Quaternion.rotateVector(goal.rotation, goal.contact),
  );
  // The end joint's point is the fixed point of `x -> anchor - R(x) contact`,
  // `R(x)` being the rotation the limb reaches when fitted to `x`. Plain
  // iteration closes slowly while a joint stands on its limit, so each pass
  // after the first takes Anderson's one-step mixing of the last two.
  let point: IAutoMovieVector3 = goal.point;
  let last: { image: IAutoMovieVector3; miss: IAutoMovieVector3 } | undefined;
  let toes: number = 0;
  for (let i: number = 0; i < REAIM_PASSES; i++) {
    const reached: IAutoMovieQuaternion = resolvePose(
      fitted,
      body.skeleton,
      HUMANOID_JOINT_AXES,
      HUMANOID_REST_FRAME,
    ).find(
      (r: IAutoMovieResolvedBone): boolean => r.bone === effector,
    )!.worldRotation;
    const off = HumanFoot.heelOff(goal.rotation, reached, anchor, goal.contact);
    // The toes belong to the fit they were read from, which is the one kept.
    toes = off.toes;
    const miss: IAutoMovieVector3 = Vector3.subtract(off.ankle, point);
    if (Vector3.length(miss) < REAIM_TOLERANCE || i === REAIM_PASSES - 1)
      break;
    let next: IAutoMovieVector3 = off.ankle;
    if (last !== undefined) {
      const change: IAutoMovieVector3 = Vector3.subtract(miss, last.miss);
      const size: number = Vector3.dot(change, change);
      if (size > 1e-18) {
        const mixing: number = Math.max(
          -20,
          Math.min(20, Vector3.dot(change, miss) / size),
        );
        next = Vector3.subtract(
          off.ankle,
          Vector3.scale(Vector3.subtract(off.ankle, last.image), mixing),
        );
      }
    }
    last = { image: off.ankle, miss };
    point = next;
    fitted = fitOnce(body, pose, limb, { ...goal, point });
  }
  if (!leg || toes === 0) return fitted;
  const bone: AutoMovieHumanoidBone = `${side}Toes`;
  return {
    ...fitted,
    joints: fitted.joints.map(
      (j: IAutoMovieJointPose): IAutoMovieJointPose =>
        j.bone === bone ? { ...j, flexion: (j.flexion ?? 0) + toes } : j,
    ),
  };
}

/** One fit of a limb by the engine's two-bone solver. */
function fitOnce(
  body: IHumanBody,
  pose: IAutoMoviePose,
  limb: IHumanPosture.Limb,
  goal: IHumanPosture.IGoal,
): IAutoMoviePose {
  const chain: IChain = chainOf(limb);
  const angles = (
    bone: AutoMovieHumanoidBone,
    of: readonly [number, number, number],
  ): IAutoMovieJointPose => ({
    bone,
    flexion: of[0],
    abduction: of[1],
    twist: of[2],
  });
  return fitChainToTarget({
    skeleton: body.skeleton,
    pose,
    chain,
    target: goal.point,
    bend: goal.bend,
    ...(goal.rotation === undefined ? {} : { effectorRotation: goal.rotation }),
    ...(goal.reference === undefined
      ? {}
      : {
          referencePose: {
            ...pose,
            joints: [
              angles(chain.upper, goal.reference.upper),
              angles(chain.lower, goal.reference.lower),
            ],
          },
        }),
    topology: body.topology,
    jointAxes: HUMANOID_JOINT_AXES,
    restFrames: HUMANOID_REST_FRAME,
  });
}
