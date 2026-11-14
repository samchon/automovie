import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
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
import { HumanArmClearance } from "./HumanArmClearance";
import type { HumanColliders } from "./HumanColliders";
import { HumanFoot } from "./HumanFoot";
import type { IHumanPosture } from "./IHumanPosture";
import { poseBones } from "./poseBones";

/**
 * The fit of one limb onto its goal, which `resolveHumanPosture` runs for
 * each limb after the trunk: the goal carried into the world by the bone
 * it is attached to, the engine's two-bone fit clear of the trunk and the
 * other arm, the end joint re-aimed so a contact stays put, and the fits
 * remembered per body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the four parts of a limb's fit and who runs it.
 * @evidence contracts/development/design.md#principled-representation The fit of one limb is one responsibility, apart from the assembly of a whole pose.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The chain, the world goal, the fit, the remembered fit and the memory's switch, all read by `resolveHumanPosture`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The solver is the engine's; nothing here sets an angle past the rig's range.
 */
export namespace HumanLimbFit {
  /**
   * The three bones of a limb's chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its bone.
   * @evidence contracts/development/design.md#principled-representation The engine's two-bone chain.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, all read by the fit and the reference.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The bones follow from the limb's side and kind.
   */
  export interface IChain {
    /** The bone at the shoulder or the hip. */
    upper: AutoMovieHumanoidBone;

    /** The bone at the elbow or the knee. */
    lower: AutoMovieHumanoidBone;

    /** The hand or the foot. */
    effector: AutoMovieHumanoidBone;
  }

  /**
   * The chain of a limb.
   *
   * @param limb The limb.
   * @returns Its three bones.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The side and the kind name the bones.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One conditional.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every limb of the posture's union has its chain.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function chain(limb: IHumanPosture.Limb): IChain {
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
   * Turn the memory of limb fits off or on again. Off, every fit is solved
   * afresh and nothing is kept, which is what a check of the memory against
   * the solver compares with; it is on unless turned off.
   *
   * @param on Whether fits are remembered.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each setting does and the default.
   * @evidence contracts/development/implementation.md#principled-implementation One switch read by every remembered fit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One assignment.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Off keeps nothing, so a comparison reads the solver alone.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The fits kept are bounded by `remembered`.
   */
  export function memory(on: boolean): void {
    REMEMBERING.on = on;
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the transform, the refusal and its reason.
   * @evidence contracts/development/implementation.md#principled-implementation A rigid transform of the goal by the bone's posed frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One frame read and one transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A goal on its own chain or on a missing bone throws instead of chasing itself.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward kinematics, only for an attached goal.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `poseBones`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
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
   * offset) moves the goal with it. An arm fitted after the other arm keeps
   * clear of it too, so two hands sent across each other stack their forearms
   * instead of passing one through the other, and an arm keeps clear of the
   * other bodies its goal names (`IHumanPosture.IGoal.clear`) and of the ones it lays the hand on (`rests`).
   *
   * @param body The performer's body.
   * @param pose The pose before the fit.
   * @param limb The limb.
   * @param attached Its goal, attached or not.
   * @param placed The arms already placed, whose room the arm keeps.
   * @param rival Where the other arm's wrist will be, while it is still to be fitted.
   * @returns The pose with the limb fitted.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fit, the re-aim with its sources and bounds, the attachment and the clearance.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's two-bone fit, a fixed-point re-aim with Anderson mixing, and the clearance as the fit's obstruction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One world goal, one obstruction, one fit, then the re-aim loop and the toes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The re-aim keeps the fit whose contact lay nearest, not its last pass, and stops at `REAIM_PASSES`.
   * @evidence contracts/development/implementation.md#efficient-algorithms One fit without a contact; at most `REAIM_PASSES` with one.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's solver, `HumanArmClearance` and `HumanFoot.heelOff`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function fit(
    body: IHumanBody,
    pose: IAutoMoviePose,
    limb: IHumanPosture.Limb,
    attached: IHumanPosture.IGoal,
    placed: readonly ("left" | "right")[],
    rival?: IAutoMovieVector3,
  ): IAutoMoviePose {
    const goal: IHumanPosture.IGoal = world(body, pose, limb, attached);
    // An arm's forearm stays clear of the trunk, the thighs and an arm fitted
    // before it as the pose being fitted places them (`HumanArmClearance`),
    // whatever the hint or the hand's turn prefer.
    const side: "left" | "right" = limb.startsWith("left") ? "left" : "right";
    const trunk: HumanColliders.IPlaced[] | null = limb.endsWith("Arm")
      ? HumanArmClearance.obstacles(
          body,
          poseBones(body, pose),
          placed.filter((arm: "left" | "right"): boolean => arm !== side),
        )
      : null;
    const clear: IObstruction | undefined =
      trunk === null
        ? undefined
        : (elbow: IAutoMovieVector3, wrist: IAutoMovieVector3): number =>
            HumanArmClearance.overshoot(
              body,
              trunk,
              elbow,
              wrist,
              side,
              attached.clear ?? [],
              true,
              rival,
              goal.bend,
              attached.rests ?? [],
            );
    let fitted: IAutoMoviePose = once(body, pose, limb, goal, clear);
    if (goal.contact === undefined || goal.rotation === undefined)
      return fitted;
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
    // The fit whose contact lay nearest its place: the iteration need not
    // close (a contact far from its joint, a blade's point a metre from the
    // wrist, turns a small change of the hand into a large one of the joint's
    // place, and a mixed step may then land far off), and its last pass is
    // then no better than any other, so the nearest one is the one kept.
    let nearest: { fitted: IAutoMoviePose; miss: number; toes: number } = {
      fitted,
      miss: Infinity,
      toes: 0,
    };
    for (let i: number = 0; i < REAIM_PASSES; i++) {
      const reached: IAutoMovieQuaternion = resolvePose(
        fitted,
        body.skeleton,
        HUMANOID_JOINT_AXES,
        HUMANOID_REST_FRAME,
      ).find(
        (r: IAutoMovieResolvedBone): boolean => r.bone === effector,
      )!.worldRotation;
      const off = HumanFoot.heelOff(
        goal.rotation,
        reached,
        anchor,
        goal.contact,
      );
      // The toes belong to the fit they were read from, which is the one kept.
      toes = off.toes;
      const miss: IAutoMovieVector3 = Vector3.subtract(off.ankle, point);
      if (Vector3.length(miss) < nearest.miss)
        nearest = { fitted, miss: Vector3.length(miss), toes };
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
      fitted = once(body, pose, limb, { ...goal, point }, clear);
    }
    fitted = nearest.fitted;
    toes = nearest.toes;
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

  /**
   * The fit of one limb, remembered: the same body, the same pose before the
   * fit, the same limb, goal and arms placed before it give the same fit, so
   * it is solved once and read again. A plan's own posture and the displayed
   * pose of the same instant ask the same fit, and so does every instant of a
   * held pose; an arm's fit with its clearance search is most of what a
   * displayed pose costs.
   *
   * The fit is a pure function of exactly what the key holds: the limb, the
   * arms placed before it, the whole goal (point, bend, rotation, contact,
   * planted, the bone it is attached to, the reference with its weight, and
   * the other bodies' colliders it keeps clear of, each with its frame and
   * shapes) and the pose before the fit (its root's translation, rotation
   * and scale and every joint's angles, which is where the trunk, the other
   * limbs already fitted and any layer have left the body). The body itself,
   * with its skeleton, topology, ranges and shapes, is the memory's owner.
   * Nothing else is read: the solver draws nothing and keeps no state.
   *
   * Each body keeps its last `FIT_MEMORY` fits, the least recently read
   * dropped first, and a body no longer held drops them all.
   *
   * @param body The performer's body.
   * @param pose The pose before the fit.
   * @param limb The limb.
   * @param goal Its goal, attached or not.
   * @param placed The arms already placed.
   * @param rival Where the other arm's wrist will be, while it is still to be fitted.
   * @returns The pose with the limb fitted.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States why a fit can be remembered, exactly what its key holds and how much is kept.
   * @evidence contracts/development/implementation.md#principled-implementation The key is every input of a pure function; the body owns its fits.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One key, one lookup, one insertion in recency order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing the fit reads is left out of the key.
   * @evidence contracts/development/implementation.md#efficient-algorithms A map read in place of a fit, the key linear in the pose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The fit of an instant already solved is read again.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each body keeps its last `FIT_MEMORY` fits, least recently read dropped first, in a weak map that lets them go with the body.
   */
  export function remembered(
    body: IHumanBody,
    pose: IAutoMoviePose,
    limb: IHumanPosture.Limb,
    goal: IHumanPosture.IGoal,
    placed: readonly ("left" | "right")[],
    rival?: IAutoMovieVector3,
  ): IAutoMoviePose {
    if (!REMEMBERING.on) return fit(body, pose, limb, goal, placed, rival);
    const key: string = JSON.stringify([
      limb,
      placed,
      rival ?? null,
      goal,
      pose.root,
      pose.joints,
    ]);
    let fits: Map<string, IAutoMoviePose> | undefined = FITS.get(body);
    if (fits === undefined) {
      fits = new Map();
      FITS.set(body, fits);
    }
    let out: IAutoMoviePose | undefined = fits.get(key);
    if (out === undefined) out = fit(body, pose, limb, goal, placed, rival);
    else fits.delete(key);
    fits.set(key, out);
    if (fits.size > FIT_MEMORY) fits.delete(fits.keys().next().value!);
    return out;
  }

  /** How far a re-aimed end joint may still move between two fits of a limb with a contact, metres (provisional: a fiftieth of a millimetre, far inside every contact verdict). */
  const REAIM_TOLERANCE: number = 2e-5;

  /**
   * The most fits a limb with a contact takes (provisional). The mixed
   * iteration closes in three to five on a joint well past its limit. A foot
   * whose flat pose misses the ankle's range by under a degree has its only
   * solution far away, at a heel raised by centimetres, and the first passes
   * move away from the flat pose slowly: up to eleven fits measured on a
   * stagger's landed rear foot.
   */
  const REAIM_PASSES: number = 16;

  /** The limb fits remembered, by body. */
  const FITS: WeakMap<IHumanBody, Map<string, IAutoMoviePose>> = new WeakMap();

  /** Whether limb fits are remembered (`memory`). */
  const REMEMBERING: { on: boolean } = { on: true };

  /**
   * How many limb fits a body keeps: about 8 s of four limbs at the 120 Hz
   * of the contact scan (`HumanPerformanceContacts`). The scan reads every
   * body at each step of every strike's window, and reads them again after
   * each stop it commits, and a display reads them once more. The boxing
   * class (four performers over 13.4 s) asks under 2,048 distinct fits of a
   * body. At 512 it solved 7,258 of its 17,214 fits again after dropping
   * them, and at 4,096 none.
   */
  const FIT_MEMORY: number = 4096;

  /** What a limb's fit must keep clear of: the degrees a mid joint and an end joint, world metres, count as out of range. */
  type IObstruction = (
    mid: IAutoMovieVector3,
    end: IAutoMovieVector3,
  ) => number;

  /** One fit of a limb by the engine's two-bone solver, clear of an obstruction when one is given. */
  function once(
    body: IHumanBody,
    pose: IAutoMoviePose,
    limb: IHumanPosture.Limb,
    goal: IHumanPosture.IGoal,
    obstruction?: IObstruction,
  ): IAutoMoviePose {
    const bones: IChain = chain(limb);
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
      chain: bones,
      target: goal.point,
      bend: goal.bend,
      ...(goal.rotation === undefined
        ? {}
        : { effectorRotation: goal.rotation }),
      ...(obstruction === undefined ? {} : { obstruction }),
      // A reference of no weight decides nothing, so it is left out entirely.
      ...(goal.reference === undefined || goal.reference.weight === 0
        ? {}
        : {
            ...(goal.reference.weight === undefined
              ? {}
              : { referenceWeight: goal.reference.weight }),
            referencePose: {
              ...pose,
              joints: [
                angles(bones.upper, goal.reference.upper),
                angles(bones.lower, goal.reference.lower),
              ],
            },
          }),
      topology: body.topology,
      jointAxes: HUMANOID_JOINT_AXES,
      restFrames: HUMANOID_REST_FRAME,
    });
  }
}
