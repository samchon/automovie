import {
  type IAutoMovieSeededChainFit,
  type IAutoMovieSwivelNear,
  type IAutoMovieSwivelSeed,
  Quaternion,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanDigitFit } from "./HumanDigitFit";
import { HumanLimbFit } from "./HumanLimbFit";
import { HumanPosturePreparation } from "./HumanPosturePreparation";
import { assembleHumanPosture } from "./assembleHumanPosture";
import type { IHumanPosture } from "./IHumanPosture";
import { lowerHumanPosture } from "./lowerHumanPosture";
import { orderHumanLimbs } from "./orderHumanLimbs";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { prepareHumanPostureBase } from "./prepareHumanPostureBase";
import { refitHumanPosture } from "./refitHumanPosture";
import { selectHumanPostureGoals } from "./selectHumanPostureGoals";

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
 * The seeded companion may restrict an explicit observation to requested
 * bone frames. Unsupported dependencies keep ordinary complete fitting.
 * prepare records an actual cold source for checked raw translation;
 * translated/carried retain its original demands, and rebased transfers
 * provenance whose free-leg dependencies are rechecked after current joint
 * clamping. prepareBase instead snapshots a search's fixed direct posture
 * and actually fits every varying complete goal request on fresh copies.
 *
 * @param body The performer's body.
 * @param posture The posture.
 * @param base A pose whose joints replace clinical zero for unset bones, such
 *   as a transition's displayed pose; its root is ignored.
 * @returns The canonical pose.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States canonical defaults, root/ROM/limb/digit order, observational-frame limits, actual cold preparation, raw-demand transport, per-leg validation and fixed-base candidate ownership; companion docs give each coordinate, seed, attachment and fallback convention.
 * @evidence contracts/development/implementation.md#principled-implementation Ordinary resolution clamps direct joints before the original range-clamped pole-hint IK. Prepared translation is equivariant only after exact raw/root/chain/ancestor and live rig/ROM checks; rebased provenance alone proves no result. A fixed-base operation projects fixed direct inputs once while every varying complete limb/digit request still solves normally.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure assembleHumanPosture owns assembly/admission, refitHumanPosture and HumanDigitFit own actual solves, selectors own proven observational omissions, HumanPosturePreparation owns private issued proof, and prepareHumanPostureBase owns fixed search snapshots; the companion methods delegate to those owners.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No public resolved flag, achieved-target substitution, relaxed ROM/acceptance or prior-time result is accepted. Original raw goals remain auditable; unsupported/changed dependencies, base and near context retain their original solve. Weak issued provenance and independently mutable result copies prevent forged or changed public outputs from certifying another request.
 * @evidence contracts/development/implementation.md#efficient-algorithms Ordinary work scales with rig/joints and actual selected search sizes. Explicit observations omit only proven irrelevant fits; checked source transport replaces a duplicate eligible solve with linear scalar checking/copying, and fixed-base search removes repeated assembly/projection while preserving live memory reads. Every retained target/search remains actual and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Same-operation FK readers share exact scalar prerequisites. Whole-source and individual free-leg reuse require issued provenance plus current raw/ancestor/rig/table equivalence; fixed-base preparation requires unchanged fixed coordinates/body and actual complete varying goals. Existing mirror/floor/grid memory policy remains unchanged, and copies or mismatches fall back normally.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Invocation-owned FK ends on return/throw and borrowed readers remain with their synchronous parent. Issued preparation and transported raw objects weakly own bounded source/signature/seeded data; fixed-base workspaces own fixed snapshots until search release. Results own fresh mutable data, body fit memory remains4096 entries per weak body, and no reader, query history or handle enters those entries.
 */
export function resolveHumanPosture(
  body: IHumanBody,
  posture: IHumanPosture,
  base?: IAutoMoviePose,
  near?: resolveHumanPosture.INear,
): IAutoMoviePose {
  return resolveHumanPosture.seeded(body, posture, base, near).pose;
}

/**
 * Companion helpers of {@link resolveHumanPosture}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Companion members state heading order, lowering/leg units, reference angles, attachment rules and pose/seed/value meanings.
 * @evidence contracts/development/design.md#principled-representation Raw authoring demands remain separate from canonical pose/per-limb continuation metadata. IPrepared aliases an independently owned pose observation whose private issued source records exact translation proof; unsupported states remain ordinary postures rather than public resolved flags.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Resolution/refit/reference/heading helpers serve the grammar; prepare/translated/carried/rebased serve actual COM/display and composition consumers, while prepareBase serves complete-goal candidate searches. Their specialized owners hold proof, fixed snapshots and original solvers once.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A forged/copied preparation has no private issued source; changed solver dependencies cannot self-certify. No production name, altered target, approximate new key or parallel solver is introduced, and every retained solve preserves its original constraints and memory policy.
 */
export namespace resolveHumanPosture {
  /** The least knee flexion of a planted leg, degrees: the knee's greatest extension in stance, about 5 degrees at initial contact and through terminal stance (Perry and Burnfield 2010, Gait Analysis: Normal and Pathological Function, ch. 7; provisional, read through secondary summaries, the primary not read). Every planted leg's lowering (`lower`) and every stance course (`walkStanceCourse`) keeps it. */
  export const KNEE: number = 5;

  /** Each limb's nearby fit to continue (`IAutoMovieSwivelNear`). */
  export type INear = Readonly<
    Partial<Record<IHumanPosture.Limb, IAutoMovieSwivelNear>>
  >;

  /** A resolved pose with the seed each limb's fit was chosen at; null where a limb's fit has none. */
  export interface ISeeded {
    /** The canonical pose. */
    pose: IAutoMoviePose;

    /** Each fitted limb's seed. */
    seeds: Partial<Record<IHumanPosture.Limb, IAutoMovieSwivelSeed | null>>;

    /** Each fitted limb's fit value (`IAutoMovieSeededChainFit.value`), where its fit reports one. */
    values: Partial<
      Record<IHumanPosture.Limb, IAutoMovieSeededChainFit["value"]>
    >;
  }

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
   * @param resolution Optional exact reader or lazy supplier borrowed from this same synchronous person evaluation; never retained by the result.
   * @param requested Optional observational bone demand: only these frames equal full resolution; unneeded world limb goals may remain at clamped authored joints. Foot contacts retain re-aim/toe correction; continued, unsupported or arm-dependent context keeps full resolution.
   * @returns The canonical pose and each actually fitted limb's seed; omission of requested preserves complete resolution.
   */
  export function seeded(
    body: IHumanBody,
    posture: IHumanPosture,
    base?: IAutoMoviePose,
    near: INear = {},
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ): ISeeded {
    const cold: boolean = base === undefined && Object.keys(near).length === 0;
    if (cold) {
      const prepared: ISeeded | undefined = HumanPosturePreparation.read(body, posture);
      if (prepared !== undefined) return prepared;
    }
    const assembled: ReturnType<typeof assembleHumanPosture> = assembleHumanPosture(body, posture, base);
    const reused: ReturnType<typeof HumanPosturePreparation.reuseLegs> = cold
      ? HumanPosturePreparation.reuseLegs(body, posture, assembled.pose)
      : undefined;
    posture = { ...posture, limbs: reused?.limbs ?? assembled.limbs };
    const readResolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const limbs: IHumanPosture["limbs"] = requested === undefined || Object.keys(near).length !== 0
      ? posture.limbs
      : selectHumanPostureGoals(body, posture, requested);
    const fitted: ISeeded = refit(body, reused?.fitted.pose ?? assembled.pose, limbs, near, readResolution);
    // The digits reach from the hands the arms placed (`HumanDigitFit`).
    return {
      ...fitted,
      ...(reused === undefined ? {} : {
        seeds: { ...reused.fitted.seeds, ...fitted.seeds },
        values: { ...reused.fitted.values, ...fitted.values },
      }),
      pose: HumanDigitFit.fitted(body, fitted.pose, posture.digits, readResolution, requested),
    };
  }

  /**
   * An issued preparation's independent canonical pose observation. Only
   * prepare creates private raw/rig evidence; public shape alone proves none.
   *
   * States independent pose ownership and private evidence provenance.
   * Aliases the owner of one actual cold solve, separate from raw authoring goals and opaque transport proof.
   * The jump COM producer reads pose and passes the issued wrapper to translated/carried.
   * A forged or copied wrapper has no private source entry and cannot certify a solution.
   */
  export type IPrepared = HumanPosturePreparation.IPrepared;

  /**
   * Resolve one raw source cold and issue checked translation preparation.
   * The original raw goals remain private source data, not achieved targets.
   *
   * Defines the actual cold source, original demands and independent public pose.
   * HumanPosturePreparation runs ordinary seeded resolution on an unissued source copy before recording strict raw/rig evidence for free world-leg translation.
   * One owner handles private evidence while seeded retains clamping, fitting and fallback.
   * No caller result or resolved flag is accepted; unsupported context remains ineligible for reuse.
   * Adds source/result copying and a rig signature to one ordinary solve, allowing its demonstrated COM/display consumer to avoid duplicate fitting without a measured speedup claim.
   * Only the same issued source and checked unchanged cold dependencies can lend its solution through translated/carried.
   * The issued wrapper and weakly associated carried postures own bounded private source/result data until release; no FK reader, time history or external resource is retained.
   */
  export function prepare(body: IHumanBody, posture: IHumanPosture): IPrepared {
    return HumanPosturePreparation.prepare(body, posture);
  }

  /**
   * Prepare fixed direct coordinates for one complete-goal candidate search.
   * The body/rig/clinical tables remain unchanged through the operation.
   *
   * States fixed direct coordinates, complete varying goals, unchanged-body scope and actual seeded outputs.
   * The owner assembles/clamps the fixed direct pose once, then actually turns and fits every complete candidate's limb/digit demands on a fresh copy.
   * One facade delegates fixed snapshots to prepareHumanPostureBase while ordinary assembly/refit/digit owners remain shared.
   * No numerical candidate, seed or goal is cached or omitted; changed fixed coordinates or body context require a new operation.
   * Removes repeated B-bone assembly/clamping across K same-base candidates, retaining O(B) fresh copying and all actual fitting per candidate without a measured speedup claim.
   * Explicit fixed-source preparation proves direct-coordinate equivalence while varying goals/near seeds still execute through original solvers.
   * The search owns bounded fixed snapshots until completion or failure, and every mutable returned pose is independent of its protected base and later results.
   */
  export function prepareBase(body: IHumanBody, posture: IHumanPosture, base?: IAutoMoviePose): ReturnType<typeof prepareHumanPostureBase> {
    return prepareHumanPostureBase(body, posture, base);
  }

  /**
   * Translate an issued source's original raw demands to a new root. An
   * eligible exact candidate carries private evidence for seeded; changed
   * context and copied postures resolve normally.
   *
   * States world-metre root translation, raw-demand preservation and ordinary fallback.
   * Delegates source-plus-displacement translation of original world goals to the checked preparation owner; attached/local demands keep their frame.
   * One delegation preserves a single raw translation and evidence owner.
   * Achieved limb points never replace asked goals and no plants, contacts, constraints or audits are removed.
   * Copies raw source data and translates its fixed goal population without running a fit.
   * Only exact issued source evidence can be attached; seeded still checks current body/rig/raw scalar equivalence and absent base/near context.
   * The fresh raw posture owns its data and weak evidence retains the bounded source only for its lifetime, without readers or a global result history.
   */
  export function translated(prepared: IPrepared, root: IAutoMovieVector3): IHumanPosture {
    return HumanPosturePreparation.translated(prepared, root);
  }

  /**
   * Check an explicitly supplied raw translation against an issued source.
   * A mismatch remains an ordinary posture with its original demands.
   *
   * States exact source check and raw mismatch behavior.
   * The owner compares supported raw scalar data with its authoritative translation before attaching private evidence.
   * One delegation keeps proof ownership separate from the numerical resolver.
   * No tolerance, public resolved marker or target change can certify equivalence.
   * Performs linear raw-data comparison without FK or solving; body/rig validation remains at consumption.
   * Only a candidate exactly derived from the same source receives evidence; copies and changed solver context retain normal resolution.
   * Returns the supplied raw object and associates only weak, bounded source evidence; no resource handle or query history is acquired.
   */
  export function carried(prepared: IPrepared, posture: IHumanPosture): IHumanPosture {
    return HumanPosturePreparation.carried(prepared, posture);
  }

  /**
   * Transfer an existing issued source across an explicit raw composition.
   * This proves no whole pose; seeded first clamps the current request and
   * independently checks each source free leg's exact current dependencies.
   *
   * States issued-source provenance, explicit composition and post-clamp per-leg validation.
   * Unrelated arm edits need not change a free leg, but actual chain/ancestor inputs, raw goals, orientation and live rig must still match before its source result applies.
   * One private-owner delegation transfers provenance; the consumer alone checks equivalence and original refit handles all remaining complete goals.
   * Ordinary sources transfer nothing, no public resolved marker is accepted and every current direct joint is clamped before any leg reuse.
   * Transfers one weak source reference in constant work, with exact scalar checks deferred to actual consumption.
   * Source identity proves only issued provenance; changed parent/leg/goal/body/ROM or unsupported base/near/rotation/digit context retains its ordinary solve.
   * One weak raw candidate entry borrows bounded source data, retaining no intermediate compositions, numerical history or FK reader.
   */
  export function rebased(from: IHumanPosture, to: IHumanPosture): IHumanPosture {
    return HumanPosturePreparation.rebased(from, to);
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
   * @param resolution Optional parent-owned exact reader or lazy supplier; cache hits do not invoke it.
   * @returns The pose, seeds and values of the same limb solver `seeded` uses.
   *
   * The source frames, goals, near records and returned fit metadata pass
   * unchanged to refitHumanPosture, the one owner of the existing limb loop.
   * It owns a lazy reader until return or borrows its explicit parent's
   * synchronous reader; body memory stores fits, never either getter or reader.
   */
  export function refit(
    body: IHumanBody,
    pose: IAutoMoviePose,
    limbs: IHumanPosture["limbs"],
    near: INear = {},
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): ISeeded {
    return refitHumanPosture(body, pose, limbs, near, resolution);
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

  /** The posture's root lowered so every planted leg keeps at least knee degrees of knee flexion, KNEE when absent; an optional same-operation FK supplier is borrowed only by the actual hip reading. */
  export function lower(
    body: IHumanBody,
    posture: IHumanPosture,
    knee: number = KNEE,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IHumanPosture {
    return lowerHumanPosture(body, posture, knee, resolution);
  }

  /** The lowering one leg asks of the root, metres; `-Infinity` beyond the leg's reach ({@link lowerHumanPosture.short}). */
  export function short(
    body: IHumanBody,
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
    body: IHumanBody,
    pose: IAutoMoviePose,
    limb: IHumanPosture.Limb,
    goal: IHumanPosture.IGoal,
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
   * @param resolution Optional exact reader or lazy supplier borrowed only from the same synchronous person evaluation.
   * @returns The pose with the limb fitted, and its seed.
   */
  export function limbSeeded(
    body: IHumanBody,
    pose: IAutoMoviePose,
    limb: IHumanPosture.Limb,
    goal: IHumanPosture.IGoal,
    near?: IAutoMovieSwivelNear,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieSeededChainFit {
    return HumanLimbFit.fit(
      body,
      pose,
      limb,
      goal,
      ["left", "right"],
      undefined,
      near,
      resolution,
    );
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
    const chain: HumanLimbFit.IChain = HumanLimbFit.chain(limb);
    const read: (
      bone: AutoMovieHumanoidBone,
    ) => readonly [number, number, number] = (
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
  export function order(limbs: IHumanPosture["limbs"]): IHumanPosture.Limb[] {
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
    body: IHumanBody,
    pose: IAutoMoviePose,
    limb: IHumanPosture.Limb,
    goal: IHumanPosture.IGoal,
  ): IHumanPosture.IGoal {
    return HumanLimbFit.world(body, pose, limb, goal);
  }
}
