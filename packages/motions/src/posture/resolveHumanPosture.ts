import type { AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanResolveHumanPosture, IAutoMovieMotionHumanTurnHumanPosture, IAutoMoviePose, IAutoMovieQuaternion, IAutoMovieSeededChainFit, IAutoMovieSwivelNear, IAutoMovieVector3 } from "@automovie/interface";


import { Quaternion, Transform, clampPose } from "@automovie/engine";
import { HumanDigitFit } from "./HumanDigitFit";
import { HumanLimbFit } from "./HumanLimbFit";
import { HumanLimbPair } from "./HumanLimbPair";
import { lowerHumanPosture } from "./lowerHumanPosture";
import { orderHumanLimbs } from "./orderHumanLimbs";
import { turnHumanPosture } from "./turnHumanPosture";

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
 * exceeds the rig's declared range and the clamp never moves a plant. Two
 * arms with goals, neither riding the other, are one coupled problem
 * (`HumanLimbPair`): fitted each on its own, and solved together only
 * where the two fits meet, so a mirrored posture resolves to the mirror of
 * the original's bones. Digit goals are fitted after every limb, each
 * digit reaching from the hand its arm placed (`HumanDigitFit`).
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
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A limb's fit is a pure function of the body, the pose before it, the limb and its goal, so it is remembered by those and read again by the displayed pose of the instant a plan already solved and by every instant of a held pose; the body's topology is shared.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each body keeps its last 4,096 limb fits, least recently read dropped first, in a weak map that lets them go with the body.
 */
export function resolveHumanPosture(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  base?: IAutoMoviePose,
  near?: IAutoMovieMotionHumanResolveHumanPosture.INear,
): IAutoMoviePose {
  return resolveHumanPosture.seeded(body, posture, base, near).pose;
}

/**
 * Companion helpers of {@link resolveHumanPosture}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each helper's convention.
 * @evidence contracts/development/implementation.md#principled-implementation Heading is yaw about +Y, then pitch about the turned +X, then roll about the turned +Z, the intrinsic order of a body turning, then leaning.
 */
export namespace resolveHumanPosture {
  /** The least knee flexion of a planted leg, degrees: the knee's greatest extension in stance, about 5 degrees at initial contact and through terminal stance (Perry and Burnfield 2010, Gait Analysis: Normal and Pathological Function, ch. 7; provisional, read through secondary summaries, the primary not read). Every planted leg's lowering (`lower`) and every stance course (`walkStanceCourse`) keeps it. */
  export const KNEE: number = 5;

  /**
   * {@link resolveHumanPosture} with each limb's fit continued from a nearby
   * one where `near` names it (`IAutoMovieSwivelNear`), reporting the seed
   * each limb's fit was chosen at: the same pose, solved the same way, with
   * what a fit of the same limb a moment away continues from.
   *
   * @param body The performer's body.
   * @param posture The posture.
   * @param base A pose whose joints replace clinical zero for unset bones.
   * @param near Each limb's nearby fit to continue; a limb not named is solved cold.
   * @returns The canonical pose and each fitted limb's seed.
   */
  export function seeded(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    base?: IAutoMoviePose,
    near: IAutoMovieMotionHumanResolveHumanPosture.INear = {},
  ): IAutoMovieMotionHumanResolveHumanPosture.ISeeded {
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
          kept.get(b.bone) ?? {
            bone: b.bone,
            flexion: 0,
            abduction: 0,
            twist: 0,
          }
        );
      },
    );
    // A whole-body rotation turns the root and the world goals before any fit
    // (`turnHumanPosture`), so the limbs are fitted on the turned body.
    const turned: IAutoMovieMotionHumanTurnHumanPosture.ITurned = turnHumanPosture(posture);
    posture = { ...posture, limbs: turned.limbs };

    // The set joints are clamped first and the limbs fitted last, so the clamp
    // never moves a solved goal; the fit keeps the limb's own angles in range.
    const pose: IAutoMoviePose = clampPose(
      {
        skeleton: body.skeleton.id,
        root: Transform.of(turned.position, turned.rotation),
        joints,
      },
      body.skeleton,
    );
    const fitted: IAutoMovieMotionHumanResolveHumanPosture.ISeeded = refit(body, pose, posture.limbs, near);
    // The digits reach from the hands the arms placed (`HumanDigitFit`).
    return {
      ...fitted,
      pose: HumanDigitFit.fitted(body, fitted.pose, posture.digits),
    };
  }

  /**
   * Re-fit limb goals on an already displayed pose, after its parents,
   * blending or transition have been placed. World goals have already
   * received the posture's root turn; attached goals keep their `on` frame
   * and are carried into the world once, by the limb fit.
   *
   * @param body The performer's body.
   * @param pose The pose before these limb fits.
   * @param limbs The goals, world or attached to a posed bone.
   * @param near Each limb's nearby fit to continue, if any.
   * @returns The pose, seeds and values of the same limb solver `seeded` uses.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs' frames and the returned fit records.
   * @evidence contracts/development/implementation.md#principled-implementation Fits the limbs on their already placed parents, in attachment order, with independent arms solved as one pair.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The original seeded limb loop is the one shared implementation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves contact, attachment, clearance, reference, seed and value data without reconstructing a goal.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most four limb fits, using the existing remembered solver.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by posture resolution and final contact restoration.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure operation that retains nothing.
   */
  export function refit(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    limbs: IAutoMovieMotionHumanPosture["limbs"],
    near: IAutoMovieMotionHumanResolveHumanPosture.INear = {},
  ): IAutoMovieMotionHumanResolveHumanPosture.ISeeded {
    const seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"] = {};
    const values: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["values"] = {};
    // An arm with no goal hangs or rests where its joints put it, so its own
    // colliders keep its room from the first fit on.
    const placed: ("left" | "right")[] = (["left", "right"] as const).filter(
      (side: "left" | "right"): boolean => limbs[`${side}Arm`] === undefined,
    );
    // Two arms with goals, neither riding the other, are one coupled problem
    // (`HumanLimbPair`), fitted when the first of them is reached.
    const arms: Record<"left" | "right", IAutoMovieMotionHumanPosture.IGoal | undefined> = {
      left: limbs.leftArm,
      right: limbs.rightArm,
    };
    const riding = (
      goal: IAutoMovieMotionHumanPosture.IGoal | undefined,
      other: "left" | "right",
    ): boolean => goal?.on !== undefined && goal.on.startsWith(other);
    const paired: boolean =
      arms.left !== undefined &&
      arms.right !== undefined &&
      !riding(arms.left, "right") &&
      !riding(arms.right, "left");
    for (const limb of resolveHumanPosture.order(limbs)) {
      const goal: IAutoMovieMotionHumanPosture.IGoal | undefined = limbs[limb];
      if (goal === undefined) continue;
      if (paired && (limb === "leftArm" || limb === "rightArm")) {
        if (placed.length === 0) {
          const pair: HumanLimbPair.IFitted = HumanLimbPair.fitted(
            body,
            pose,
            { left: arms.left!, right: arms.right! },
            {
              ...(near.leftArm === undefined ? {} : { left: near.leftArm }),
              ...(near.rightArm === undefined ? {} : { right: near.rightArm }),
            },
          );
          pose = pair.pose;
          seeds.leftArm = pair.seeds.left;
          seeds.rightArm = pair.seeds.right;
          values.leftArm = pair.values.left;
          values.rightArm = pair.values.right;
        }
        placed.push(limb === "leftArm" ? "left" : "right");
        continue;
      }
      // The other arm's goal, while that arm is still to be fitted: where its
      // wrist will be, for the room the clearance keeps it.
      const other: IAutoMovieMotionHumanPosture.Limb | undefined =
        limb === "leftArm"
          ? "rightArm"
          : limb === "rightArm"
            ? "leftArm"
            : undefined;
      const coming: IAutoMovieMotionHumanPosture.IGoal | undefined =
        other === undefined ||
        placed.includes(other === "leftArm" ? "left" : "right")
          ? undefined
          : limbs[other];
      const rival: IAutoMovieVector3 | undefined =
        coming === undefined || other === undefined
          ? undefined
          : resolveHumanPosture.world(body, pose, other, coming).point;
      const fitted: IAutoMovieSeededChainFit = HumanLimbFit.remembered(
        body,
        pose,
        limb,
        goal,
        placed,
        rival,
        near[limb],
      );
      pose = fitted.pose;
      seeds[limb] = fitted.seed;
      values[limb] = fitted.value;
      if (limb === "leftArm") placed.push("left");
      if (limb === "rightArm") placed.push("right");
    }

    return { pose, seeds, values };
  }

  /**
   * Turn the memory of limb fits off or on again. Off, every fit is solved
   * afresh and nothing is kept, which is what a check of the memory against
   * the solver compares with; it is on unless turned off.
   *
   * @param on Whether fits are remembered.
   */
  export function memory(on: boolean): void {
    HumanLimbFit.memory(on);
  }

  /**
   * A posture's root rotation: yaw about +Y, then pitch about the turned
   * left axis (+X, a forward tip), then roll about the turned forward axis
   * (+Z, a tip toward the right).
   *
   * @param posture The posture's heading.
   * @returns The rotation.
   */
  export function heading(
    posture: Pick<IAutoMovieMotionHumanPosture, "yaw" | "pitch" | "roll">,
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
  ): Pick<IAutoMovieMotionHumanPosture, "yaw" | "pitch" | "roll"> {
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

  /** The posture's root lowered so every planted leg keeps at least `knee` degrees of knee flexion, `KNEE` when absent ({@link lowerHumanPosture}). */
  export function lower(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    knee: number = KNEE,
  ): IAutoMovieMotionHumanPosture {
    return lowerHumanPosture(body, posture, knee);
  }

  /** The lowering one leg asks of the root, metres; `-Infinity` beyond the leg's reach ({@link lowerHumanPosture.short}). */
  export function short(
    body: IAutoMovieMotionHumanBody,
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    knee: number,
  ): number {
    return lowerHumanPosture.short(body, hip, ankle, knee);
  }

  /**
   * Re-solve one limb of a pose onto a goal, keeping everything else; an arm
   * keeps clear of the other arm where the pose already places it.
   *
   * @param body The performer's body.
   * @param pose The pose.
   * @param limb The limb.
   * @param goal Its goal.
   * @param near A nearby fit of the limb to continue; omitted, it is solved cold.
   * @returns The pose with the limb fitted.
   */
  export function limb(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    limb: IAutoMovieMotionHumanPosture.Limb,
    goal: IAutoMovieMotionHumanPosture.IGoal,
    near?: IAutoMovieSwivelNear,
  ): IAutoMoviePose {
    return limbSeeded(body, pose, limb, goal, near).pose;
  }

  /**
   * {@link limb} with the seed its fit was chosen at.
   *
   * @param body The performer's body.
   * @param pose The pose.
   * @param limb The limb.
   * @param goal Its goal.
   * @param near A nearby fit of the limb to continue; omitted, it is solved cold.
   * @returns The pose with the limb fitted, and its seed.
   */
  export function limbSeeded(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    limb: IAutoMovieMotionHumanPosture.Limb,
    goal: IAutoMovieMotionHumanPosture.IGoal,
    near?: IAutoMovieSwivelNear,
  ): IAutoMovieSeededChainFit {
    return HumanLimbFit.fit(
      body,
      pose,
      limb,
      goal,
      ["left", "right"],
      undefined,
      near,
    );
  }

  /**
   * A limb's reference solution read off a pose: the clinical angles of its
   * upper and lower bones. A law solves the limb once at the instant its
   * action is about (the grasp, the clasp, the placement) and hands the
   * result to every goal of the stroke as `HumanPosture.IGoal.reference`.
   *
   * @param pose The pose the limb was solved in.
   * @param limb The limb.
   * @returns The reference.
   */
  export function reference(
    pose: IAutoMoviePose,
    limb: IAutoMovieMotionHumanPosture.Limb,
  ): IAutoMovieMotionHumanPosture.IReference {
    const chain: HumanLimbFit.IChain = HumanLimbFit.chain(limb);
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

  /** The order to fit a posture's limbs in ({@link orderHumanLimbs}). */
  export function order(limbs: IAutoMovieMotionHumanPosture["limbs"]): IAutoMovieMotionHumanPosture.Limb[] {
    return orderHumanLimbs(limbs);
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
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    limb: IAutoMovieMotionHumanPosture.Limb,
    goal: IAutoMovieMotionHumanPosture.IGoal,
  ): IAutoMovieMotionHumanPosture.IGoal {
    return HumanLimbFit.world(body, pose, limb, goal);
  }
}
