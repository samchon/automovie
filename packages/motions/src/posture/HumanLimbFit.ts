import {
  type IAutoMoviePlantChain,
  type IAutoMovieResolvedBone,
  type IAutoMovieSeededChainFit,
  type IAutoMovieSwivelNear,
  Quaternion,
  Vector3,
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
import { HumanArmMirror } from "./HumanArmMirror";
import type { HumanColliders } from "./HumanColliders";
import { HumanFoot } from "./HumanFoot";
import { HumanLimbFitMemory } from "./HumanLimbFitMemory";
import { HumanLimbMirror } from "./HumanLimbMirror";
import type { IHumanPosture } from "./IHumanPosture";
import { poseBones } from "./poseBones";
import { prepareHumanLimbFit } from "./prepareHumanLimbFit";

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
   * The engine's three required mutable bone identities: upper, lower and
   * effector. `chain` chooses their Human names from the limb's side and kind.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the three identities and distinguishes their engine-owned structure from the Human naming policy.
   * @evidence contracts/development/design.md#principled-representation The existing engine descriptor has exactly the same three required mutable AutoMovieHumanoidBone fields as this Human chain.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Aliases IAutoMoviePlantChain instead of maintaining a parallel structure; the fit and reference keep their existing IChain name.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias changes no field, optionality or bone union; chain still selects names from the limb's side and kind.
   */
  export type IChain = IAutoMoviePlantChain;

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
   * Turn limb-fit cache reads and inserts off or on again through
   * `HumanLimbFitMemory.memory`. Off solves afresh; existing body-owned pools
   * remain available when enabled again and are not purged by this switch.
   *
   * @param on Whether fits are remembered.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the read/insert switch, fresh solves while disabled and preservation of existing pools.
   * @evidence contracts/development/implementation.md#principled-implementation Forwards the switch to the single memory owner, whose disabled branch calls fit directly.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call keeps cache policy in HumanLimbFitMemory.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Changes no fit, seed, key or rig rule, and does not claim disabling purges prior entries.
   * @evidence contracts/development/implementation.md#efficient-algorithms The owner sets one boolean in constant work; subsequent remembered calls own their key and fit costs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The switch only enables or bypasses the owner's existing reuse; it computes and shares no fit itself.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources This wrapper retains nothing; the owner's weak body keys and 4096-entry LRU bound pools, which remain while disabled. No handle or task is acquired.
   */
  export function memory(on: boolean): void {
    HumanLimbFitMemory.memory(on);
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
   * @param readAuthored Optional full FK of this exact body/pose and canonical mappings, shared only within the current fit operation.
   * @returns The goal with world point, bend and rotation and no `on`.
   * @throws {Error} When the goal is attached to a bone of its own limb's chain, or to a bone the rig lacks.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the transform, the refusal and its reason.
   * @evidence contracts/development/implementation.md#principled-implementation A rigid transform of the goal by the bone's posed frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One frame read and one transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A goal on its own chain or on a missing bone throws instead of chasing itself.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward kinematics, only for an attached goal.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses poseBones, or the same exact authored-FK reader the fit's clearance and engine source read consume; a self-chain refusal precedes that read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function world(
    body: IHumanBody,
    pose: IAutoMoviePose,
    limb: IHumanPosture.Limb,
    goal: IHumanPosture.IGoal,
    readAuthored?: () => ReadonlyMap<
      AutoMovieHumanoidBone,
      IAutoMovieResolvedBone
    >,
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
    const frame: IAutoMovieResolvedBone | undefined = (
      readAuthored === undefined ? poseBones(body, pose) : readAuthored()
    ).get(on);
    if (frame === undefined)
      throw new Error(
        `A ${limb} goal is attached to ${on}, which the rig lacks`,
      );
    const place: (p: IAutoMovieVector3) => IAutoMovieVector3 = (
      p: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      Vector3.add(
        frame.worldPosition,
        Quaternion.rotateVector(frame.worldRotation, p),
      );
    const { on: _attached, ...rest }: IHumanPosture.IGoal = goal;
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
   * offset) moves the goal with it. An arm fitted after the other arm (one
   * whose goal rides the other, `resolveHumanPosture.order`) keeps clear of
   * it too; two arms with goals that ride neither are fitted as one coupled
   * problem (`HumanLimbPair`), each first on its own with the other only a
   * coming wrist (`rival`). An arm keeps clear of the
   * other bodies its goal names (`IHumanPosture.IGoal.clear`) and of the ones it lays the hand on (`rests`).
   * A left limb is fitted as the right limb in the mirror image of its world
   * (the pose, the goal, the colliders it keeps clear of and the other arm)
   * and mirrored back, so a mirrored posture's fit is the mirror of the
   * original's to the bit: the solver's rounding is not sign-symmetric, and
   * each side solved on its own parted them by up to 6.4e-14 degrees.
   *
   * With `near`, the fit continues a nearby one (`IAutoMovieSwivelNear`):
   * every pass refines that seed instead of sweeping the swivel. The seed
   * returned is the kept pass's, in the frame the limb is solved in (a left
   * limb's in its mirror image), which is the frame a `near` for the same
   * limb is read in.
   *
   * @param body The performer's body.
   * @param pose The pose before the fit.
   * @param limb The limb.
   * @param attached Its goal, attached or not.
   * @param placed The arms already placed, whose room the arm keeps.
   * @param rival Where the other arm's wrist will be, while it is still to be fitted.
   * @param near A nearby fit of the same limb to continue; omitted, the fit is solved cold.
   * @returns The pose with the limb fitted, and the seed that continues it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fit, the re-aim with its sources and bounds, the attachment and the clearance.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's two-bone fit, a fixed-point re-aim with Anderson mixing, and the clearance as the fit's obstruction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One world goal, one obstruction, one fit, then the re-aim loop and the toes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The re-aim keeps the fit whose contact lay nearest, not its last pass, and stops at `REAIM_PASSES`.
   * @evidence contracts/development/implementation.md#efficient-algorithms One lazy canonical source FK serves world attachment, arm clearance and the engine's authored read; the distinct zeroed preparation and reference FK remain separate. At most REAIM_PASSES targets share rig/clamp/reference work, and reached rotations use chain FK after one joint scan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One authored reader and one prepareHumanLimbFit workspace serve the fixed body/source pose, mappings, goal bend/rotation/reference, obstruction and cold/near mode; only targets vary. Callback evaluations and distinct fitted/zeroed/reference poses are not merged.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns one local source-FK map and workspace through synchronous completion or failure; only selected pose/seed/value escape, with no persistent cache, retained reader or handle.
   */
  export function fit(
    body: IHumanBody,
    pose: IAutoMoviePose,
    limb: IHumanPosture.Limb,
    attached: IHumanPosture.IGoal,
    placed: readonly ("left" | "right")[],
    rival?: IAutoMovieVector3,
    near?: IAutoMovieSwivelNear,
  ): IAutoMovieSeededChainFit {
    // A left limb is fitted as the right limb in the mirror image of its
    // world, so the two sides are mirror images to the bit.
    if (limb.startsWith("left")) {
      const image: IAutoMovieSeededChainFit = fit(
        body,
        HumanLimbMirror.pose(pose),
        HumanLimbMirror.limb(limb),
        HumanLimbMirror.goal(attached),
        placed.map(HumanLimbMirror.side),
        rival === undefined ? undefined : HumanArmMirror.flip(rival),
        near,
      );
      return { ...image, pose: HumanLimbMirror.pose(image.pose) };
    }
    let authoredBones:
      | ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>
      | undefined;

    // These consumers all read the unchanged source pose. Keep the reader
    // lazy so attachment refusals and degenerate leg fits keep their original
    // admission order, and never let a fitted pose replace this source.
    const readAuthored: () => ReadonlyMap<
      AutoMovieHumanoidBone,
      IAutoMovieResolvedBone
    > = (): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      if (authoredBones === undefined) authoredBones = poseBones(body, pose);
      return authoredBones;
    };
    const goal: IHumanPosture.IGoal = world(
      body,
      pose,
      limb,
      attached,
      readAuthored,
    );
    // An arm's forearm stays clear of the trunk, the thighs and an arm fitted
    // before it as the pose being fitted places them (`HumanArmClearance`),
    // whatever the hint or the hand's turn prefer.
    const side: "left" | "right" = limb.startsWith("left") ? "left" : "right";
    const trunk: HumanColliders.IPlaced[] | null = limb.endsWith("Arm")
      ? HumanArmClearance.obstacles(
          body,
          readAuthored(),
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
    const fitter: ReturnType<typeof prepareHumanLimbFit> = prepareHumanLimbFit(
      body,
      pose,
      chain(limb),
      goal,
      clear,
      near,
      readAuthored,
    );
    let fitted: IAutoMovieSeededChainFit = fitter.fit(goal.point);
    if (goal.contact === undefined || goal.rotation === undefined)
      return fitted;
    const leg: boolean = limb.endsWith("Leg");
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
    let nearest: {
      fitted: IAutoMovieSeededChainFit;
      miss: number;
      toes: number;
    } = {
      fitted,
      miss: Infinity,
      toes: 0,
    };
    for (let i: number = 0; i < REAIM_PASSES; i++) {
      const reached: IAutoMovieQuaternion = fitter.rotation(fitted.pose);
      const off: ReturnType<typeof HumanFoot.heelOff> = HumanFoot.heelOff(
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
      fitted = fitter.fit(point);
    }
    fitted = nearest.fitted;
    toes = nearest.toes;
    if (!leg || toes === 0) return fitted;
    const bone: AutoMovieHumanoidBone = `${side}Toes`;
    return {
      pose: {
        ...fitted.pose,
        joints: fitted.pose.joints.map(
          (j: IAutoMovieJointPose): IAutoMovieJointPose =>
            j.bone === bone ? { ...j, flexion: (j.flexion ?? 0) + toes } : j,
        ),
      },
      seed: fitted.seed,
      ...(fitted.value === undefined ? {} : { value: fitted.value }),
    };
  }

  /**
   * The fit of one limb, remembered by every input it is a pure function of
   * (`HumanLimbFitMemory.remembered`).
   *
   * @param body The performer's body.
   * @param pose The pose before the fit.
   * @param limb The limb.
   * @param goal Its goal, attached or not.
   * @param placed The arms already placed.
   * @param rival Where the other arm's wrist will be, while it is still to be fitted.
   * @param near A nearby fit of the same limb to continue; omitted, the fit is solved cold.
   * @returns The pose with the limb fitted, and the seed that continues it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the source pose, complete goal, placed arms, rival and optional continuation forwarded to the memory owner.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates deterministic fit reuse to HumanLimbFitMemory; the body's skeleton, topology, ranges and profile must remain unchanged while its entries are valid.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call forwards every argument; the owner handles mirror/floor-frame keys, lookup, a miss's fit and recency eviction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the owner's existing floor-frame/grid key and all arguments, including near; this wrapper adds no quantization, target adjustment or new exact-key claim.
   * @evidence contracts/development/implementation.md#efficient-algorithms Enabled memory builds a key proportional to serialized pose, goal and collider data; a miss adds fit's bounded search. Disabled memory directly fits. The wrapper adds no traversal or measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The unchanged body owns equivalence and the complete keyed inputs select reuse under the memory owner's existing grid policy; disabled memory solves afresh.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The owner retains at most 4096 fits per live body, evicts least-recent entries and uses weak body keys; entry bytes depend on key/pose size and callers may retain returned poses. No handles or tasks are added.
   */
  export function remembered(
    body: IHumanBody,
    pose: IAutoMoviePose,
    limb: IHumanPosture.Limb,
    goal: IHumanPosture.IGoal,
    placed: readonly ("left" | "right")[],
    rival?: IAutoMovieVector3,
    near?: IAutoMovieSwivelNear,
  ): IAutoMovieSeededChainFit {
    return HumanLimbFitMemory.remembered(
      body,
      pose,
      limb,
      goal,
      placed,
      rival,
      near,
    );
  }

  /**
   * A limb goal's mirror image (`HumanLimbMirror.goal`).
   *
   * @param goal The goal.
   * @returns Its mirror image.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies HumanLimbMirror.goal as the owner of median-plane goal reflection, including attachments and external colliders.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the shared median-plane reflection of points, rotations, attached bone and colliders; clinical reference angles keep their side convention.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegation keeps every reflected goal field in HumanLimbMirror.goal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No goal part or side is special-cased by this wrapper; the shared owner reflects limits, clear and rests as well as the main target.
   * @evidence contracts/development/implementation.md#efficient-algorithms Work is linear in limits, placed segments/shapes and uncached hull vertices; already mirrored source hull arrays reuse their points. The wrapper adds no scan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses common goal/shape reflection and HumanArmMirror's mirrored hull points while source point arrays remain unchanged, without a new goal cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the returned goal and mirrored records; unchanged fields are borrowed and shared hull points follow their source-array weak cache. This wrapper owns no retained state, handles or tasks.
   */
  export function reflected(goal: IHumanPosture.IGoal): IHumanPosture.IGoal {
    return HumanLimbMirror.goal(goal);
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

  /** What a limb's fit must keep clear of: the degrees a mid joint and an end joint, world metres, count as out of range. */
  type IObstruction = (
    mid: IAutoMovieVector3,
    end: IAutoMovieVector3,
  ) => number;
}
