import {
  type IAutoMovieSeededChainFit,
  type IAutoMovieSwivelNear,
  type IAutoMovieSwivelSeed,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanLimbFit } from "./HumanLimbFit";
import { HumanPosturePreparation } from "./HumanPosturePreparation";
import type { IHumanPosture } from "./IHumanPosture";
import { lowerHumanPosture } from "./lowerHumanPosture";
import { orderHumanLimbs } from "./orderHumanLimbs";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { prepareHumanPostureBase } from "./prepareHumanPostureBase";
import type { prepareHumanPostureProjection } from "./prepareHumanPostureProjection";
import { refitHumanPosture } from "./refitHumanPosture";
import { resolveHumanPostureSource } from "./resolveHumanPostureSource";
import { humanPostureHeading } from "./humanPostureHeading";

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
 * translated/rigid construct its original demands; carried preserves only
 * already issued authority after its original observations. Raw composition
 * retains ordinary fitting; source identity alone cannot certify its current
 * demand graph. prepareBase instead snapshots a search's fixed direct posture
 * and actually fits every varying complete goal request on fresh copies.
 *
 * @param body The performer's body.
 * @param posture The posture.
 * @param base A pose whose joints replace clinical zero for unset bones, such
 *   as a transition's displayed pose; its root is ignored.
 * @returns The canonical pose.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States canonical defaults, root/ROM/limb/digit order, observational-frame limits, actual cold preparation, constructor-owned demand transport, ordinary composition fitting and fixed-base candidate ownership; companion docs give each coordinate, seed, attachment and fallback convention.
 * @evidence contracts/development/implementation.md#principled-implementation Ordinary resolution clamps direct joints before the original range-clamped pole-hint IK. Prepared translation is equivariant only for the actual constructor-owned complete demand graph with current native-loan/live rig proof; arbitrary raw composition retains original fitting. A fixed-base operation projects fixed direct inputs once while every varying complete limb/digit request still solves normally.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Assembly owns fresh direct records/root and admission; internal refit applies owned chain edits and digit fitting retains its original owner. An absent base with an absent or native (factory/engine) reader selects COW transfer, since assembly creates every result record and a native reader lends only exact FK. Explicit base/refit/foreign-reader sources retain independent issuing, and no-goal refit keeps its borrowed-pose contract.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No public resolved flag, achieved-target substitution, relaxed ROM/acceptance or prior-time result is accepted. Original raw goals remain auditable; unsupported/changed dependencies, base and near context retain their original solve. Weak issued provenance and independently mutable result copies prevent forged or changed public outputs from certifying another request.
 * @evidence contracts/development/implementation.md#efficient-algorithms Ordinary work scales with rig/joints and actual selected search sizes. Explicit observations omit only proven irrelevant fits; checked source transport replaces a duplicate eligible solve with linear scalar checking/copying, and fixed-base search removes repeated assembly/projection while preserving live memory reads. Every retained target/search remains actual and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Same-operation FK readers share exact scalar prerequisites. Whole-source reuse requires actual constructor-owned graph plus current rig/table/native-loan proof; fixed-base preparation requires unchanged fixed coordinates/body and actual complete varying goals. Arbitrary raw getters are never sampled to certify partial-leg output. Existing mirror/root-frame/grid memory policy remains unchanged, and copies or mismatches fall back normally.
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface Resolution/refit/reference/heading helpers serve the grammar; prepare/preparedBones/translated/rigid/tryRigid/carried serve actual COM and fixed-shape placement, prepareBase serves complete-goal searches, and prepareShort delegates fixed body/knee geometry for ground-root trials. Specialized owners hold the proof, fixed snapshots and original solvers once.
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
   * @param projection Genuine same-body operation projection; unknown functions fall back to ordinary ROM preparation.
   * @returns The canonical pose and each actually fitted limb's seed; omission of requested preserves complete resolution.
   */
  export function seeded(
    body: IHumanBody,
    posture: IHumanPosture,
    base?: IAutoMoviePose,
    near: INear = {},
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): ISeeded {
    const cold: boolean = base === undefined && Object.keys(near).length === 0;

    // The owned route assembles fresh records from the raw demands and fits
    // them in place; a reader lends only exact FK, so a native one (this
    // owner's factory or the engine's) can alias no record of the result.
    const owned: boolean = base === undefined &&
      (resolution === undefined || prepareHumanPoseResolution.isNativeSource(resolution));
    if (cold) {
      const prepared: ISeeded | undefined = HumanPosturePreparation.read(body, posture);
      if (prepared !== undefined && prepareHumanPoseResolution.isNativeSource(resolution)) return prepared;
    }
    return owned
      ? resolveHumanPostureSource.owned(body, posture, near, resolution, requested, projection)
      : resolveHumanPostureSource(body, posture, base, near, resolution, requested, projection);
  }

  /**
   * An issued preparation's independent canonical pose observation. Only
   * prepare creates private raw/rig evidence; public shape alone proves none.
   *
   * States independent pose ownership and private evidence provenance.
   * Aliases the owner of one actual cold solve, separate from raw authoring goals and opaque transport proof.
   * The jump COM producer reads preparedBones and passes the issued wrapper to translated; fixed joint-only consumers use rigid/tryRigid.
   * A forged or copied wrapper has no private source entry and cannot certify a solution.
   */
  export type IPrepared = HumanPosturePreparation.IPrepared;

  /**
   * Snapshot cloneable enumerable own authoring, resolve that exact owned
   * source cold and issue checked preparation. Ordinary seeded resolution
   * retains its live-input admission; this explicit API snapshots first.
   *
   * Defines the actual cold source, original demands and independent public pose.
   * HumanPosturePreparation runs ordinary seeded resolution on its actual private snapshot before recording strict raw/rig evidence for free world-leg translation or joint-only rigid placement.
   * One owner handles private evidence while seeded retains clamping, fitting and fallback.
   * No caller result or resolved flag is accepted; unsupported context remains ineligible for reuse.
   * Adds source/result copying and a rig signature to one ordinary solve, allowing its demonstrated COM/display consumer to avoid duplicate fitting without a measured speedup claim.
   * Only actual translated/rigid construction plus current graph/rig/native-loan proof can lend its solution; carried cannot mint proof from arbitrary same-string authoring.
   * The issued wrapper and weakly associated carried postures own bounded private source/result data until release; no FK reader, time history or external resource is retained.
   */
  export function prepare(body: IHumanBody, posture: IHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: ReturnType<typeof prepareHumanPostureProjection>): IPrepared {
    return HumanPosturePreparation.prepare(body, posture, resolution, projection);
  }

  /** Observe an issued source through fresh FK only; no private pose escapes or unused public pose is copied. */
  export function preparedBones(...args: Parameters<typeof HumanPosturePreparation.bones>): ReturnType<typeof HumanPosturePreparation.bones> {
    return HumanPosturePreparation.bones(...args);
  }

  /**
   * Snapshot cloneable enumerable own fixed direct authoring, then prepare
   * that exact snapshot for one complete-goal search. Ordinary seeded keeps
   * live admission; body/rig/clinical tables remain fixed for this operation.
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
   * The owner preserves the original actual/expected JSON observations, but retains whole authority only for an already constructor-issued same-source graph.
   * One delegation keeps proof ownership separate from the numerical resolver.
   * JSON collisions, copies, public resolved markers and target changes cannot certify numerical equivalence; arbitrary inputs resolve ordinarily.
   * Performs linear raw-data comparison without FK or solving; body/rig validation remains at consumption.
   * Actual constructor provenance and complete current graph/rig/native-loan checks establish equivalence independently of the observed strings; copied or changed inputs retain normal resolution.
   * Returns the supplied raw object and associates only weak, bounded source evidence; no resource handle or query history is acquired.
   */
  export function carried(prepared: IPrepared, posture: IHumanPosture): IHumanPosture {
    return HumanPosturePreparation.carried(prepared, posture);
  }

  /** Construct an owned joint-only raw shape at a current world root and yaw/pitch/roll in degrees. */
  export function rigid(prepared: IPrepared, root: IAutoMovieVector3, yaw: number, pitch: number, roll: number): IHumanPosture {
    return HumanPosturePreparation.rigid(prepared, root, yaw, pitch, roll);
  }

  /** Construct an owned joint-only placement when its private source supports it, otherwise decline to the caller's original raw path. */
  export function tryRigid(prepared: IPrepared, root: IAutoMovieVector3, yaw: number, pitch: number, roll: number): IHumanPosture | undefined {
    return HumanPosturePreparation.tryRigid(prepared, root, yaw, pitch, roll);
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
   * unchanged to refitHumanPosture. Only an unchanged pose with no fitted seed
   * slots retains no-work borrowing; a real degenerate fit still copies.
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
    const fitted: ISeeded = refitHumanPosture.independent(body, pose, limbs, near, resolution);
    return fitted.pose === pose && Object.keys(fitted.seeds).length === 0 ? fitted : structuredClone(fitted);
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
    return humanPostureHeading(posture);
  }

  /**
   * The heading angles of a root rotation, the inverse of {@link heading}:
   * with `R = Ry(yaw) Rx(pitch) Rz(roll)`, the turned forward axis is
   * `(sin yaw cos pitch, -sin pitch, cos yaw cos pitch)` and the vertical
   * components of the turned left and up axes are `sin roll cos pitch` and
   * `cos roll cos pitch`. A rotation composed in the world (a pelvis tilted
   * about a floor axis after its turn) becomes a posture's heading through
   * it. The original atan2 readings and clamped asin operate directly on
   * those three turned axes, including at a vertical forward axis.
   *
   * @param rotation The root's world rotation, unit.
   * @returns Yaw, pitch and roll, degrees.
   */
  export function angles(
    rotation: IAutoMovieQuaternion,
  ): Pick<IHumanPosture, "yaw" | "pitch" | "roll"> {
    return humanPostureHeading.angles(rotation);
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

  /** Prepare fixed body/knee reach geometry; every hip/ankle query retains the original lowering and refusal arithmetic. */
  export function prepareShort(body: IHumanBody, knee: number): ReturnType<typeof lowerHumanPosture.prepareShort> {
    return lowerHumanPosture.prepareShort(body, knee);
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
   * @returns An independent complete copy of the fitted pose, seed and value, including unrelated nested metadata.
   */
  export function limbSeeded(
    body: IHumanBody,
    pose: IAutoMoviePose,
    limb: IHumanPosture.Limb,
    goal: IHumanPosture.IGoal,
    near?: IAutoMovieSwivelNear,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieSeededChainFit {
    return structuredClone(HumanLimbFit.fit(
      body,
      pose,
      limb,
      goal,
      ["left", "right"],
      undefined,
      near,
      resolution,
    ));
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
    read?: Parameters<typeof HumanLimbFit.world>[4],
  ): IHumanPosture.IGoal {
    return HumanLimbFit.world(body, pose, limb, goal, read);
  }
}
