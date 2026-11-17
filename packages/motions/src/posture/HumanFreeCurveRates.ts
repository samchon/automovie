import {
  type IAutoMovieResolvedBone,
  type resolveAutoMovieBoneRates,
  HUMANOID_REST_FRAME,
  Quaternion,
  Vector3,
  getConstraint,
  jointToQuaternion,
  nearestAngleAlias,
  solveResolvedRate,
  swingConeAngle,
  swingTwistRange,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { prepareJumpPosture } from "../actions/prepareJumpPosture";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { prepareHumanSegmentPose } from "../perform/prepareHumanSegmentPose";
import { HumanJacobian } from "./HumanJacobian";
import { HumanPosturePreparation } from "./HumanPosturePreparation";
import type { IHumanPosture } from "./IHumanPosture";
import { poseBones } from "./poseBones";
import { prepareHumanPostureRigCheck } from "./prepareHumanPostureRigCheck";
import { prepareHumanFreeCurve } from "./prepareHumanFreeCurve";
import { prepareHumanPostureProjection } from "./prepareHumanPostureProjection";

/**
 * Instantaneous differentiation of an owned free-foot curve at its actual
 * resolved pose. A raw record acquires provenance only in prepareJumpFlight,
 * from its actual immutable goal construction and canonical solve. The
 * displayed consumer separately excludes composition and phase boundaries.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents direct clinical degrees/second, root-frame goal velocities, exact current-pose comparison, strict interior support, numerical refusal and independent outputs.
 * @evidence contracts/development/design.md#principled-representation Constructor-owned analytic demands and the actual geometric Jacobian define the implicit six-coordinate derivative; no time samples or static flags represent derivatives.
 * @evidence contracts/development/design.md#minimal-and-owned-surface issued links the real jump producer to the displayed evaluator's one-slot capture/readCaptured handoff. Goal rates and direct clinical rates remain distinct from solved IK rates.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No callback registration, approximate pose cache, law-name dispatch or inferred missing velocity is used. Unsupported or uncertain data returns undefined for the original stencil.
 */
export namespace HumanFreeCurveRates {
  /**
   * Exact authored derivatives in the fixed root frame, before IK.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines complete pre-IK clinical degrees per second and root-frame foot-origin metres/spatial radians per second; missing coordinates decline read rather than imply zero.
   * @evidence contracts/development/design.md#principled-representation Direct clinical derivatives and two complete rigid task velocities distinguish authoring from the subsequently solved implicit joint derivative.
   * @evidence contracts/development/design.md#minimal-and-owned-surface jumpAirborne's actual immutable coefficients produce both fields and the free-curve rate owner alone consumes them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No static flag, arbitrary task callback, sampled derivative or partially guessed velocity appears in the record.
   */
  export interface IAuthored {
    /** Actual normalized open-phase argument being differentiated. */
    share: number;
    /** Actual physical duration of that normalized phase, seconds. */
    duration: number;
    /** Complete clinical joint derivatives, degrees per second. */
    joints: Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>;
    /** Root-frame foot-origin and spatial angular derivatives. */
    legs: Record<"left" | "right", resolveAutoMovieBoneRates.IRate>;
  }

  /** One current constructor-owned solve and its actual goal derivative. */
  interface ISource {
    /** Body whose unchanged native rig supplied the solve. */
    body: IHumanBody;
    /** Independent flat current canonical clinical scalars. */
    snapshot: Pick<HumanPosturePreparation.IObservation, "names" | "values">;
    /** Root-frame exact current goal positions and rotations. */
    goals: Record<"left" | "right", { point: IAutoMovieVector3; bend: IAutoMovieVector3; rotation: IAutoMovieQuaternion }>;
    /** Actual analytic authoring rates of this same current target. */
    rates: IAuthored;
    /** Same construction's unprojected clinical targets. */
    authored: IHumanPosture["joints"];
    /** Actual strict-interior canonical construction, not a global smoothness claim. */
    cell: prepareHumanFreeCurve.ICell;
    /** Live scalar rig proof, never a cached verdict. */
    unchanged: () => boolean;
  }

  /** Weak current outputs own their bounded numerical derivative source. */
  const SOURCES: WeakMap<IHumanPosture, ISource> = new WeakMap();

  /** One synchronous displayed workspace lends at most one current source. */
  const CAPTURED: WeakMap<prepareHumanSegmentPose.IPrepared, { source: ISource; pose: IAutoMoviePose }> = new WeakMap();

  /** Only actual physical consumers request source data from their exact workspace pair. */
  const REQUESTS: WeakMap<prepareHumanSegmentPose.IPrepared["clamp"], WeakMap<prepareHumanSegmentPose.IPrepared["resolution"], { count: number }>> = new WeakMap();

  /**
   * Request derivative construction only for this consumer's live operation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the exact projection/FK workspace pair, nested consumer count and idempotent release; a request is demand only and proves no derivative eligibility.
   * @evidence contracts/development/implementation.md#principled-implementation A physical history explicitly consumes derivative data; staged playback and ordinary observations do not. Scope that demand to the actual synchronous workspace pair rather than a global mode, authoring flag or retained plan.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One private pair lookup increments active consumers and returns an idempotent decrement/delete closure. wants observes that demand before the actual source producer performs any derivative work.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Requesting cannot approve a source, root, curve, physical result or callback; every original numerical and construction gate remains. No ambient toggle or caller-supplied trust flag replaces validation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant weak-map work avoids O(J) unused derivative/scalar snapshots in staged and ordinary reads; actual physical consumers retain the same current computation. Runtime savings remain unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only an exact operation pair shares demand among nested physical consumers, never a numerical answer or a different timestamp's preparation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Weak pair keys hold one count record while requested; the final idempotent release deletes it and releases any captured source. The consumer calls release in finally on success or failure; no global population, plan flag, handle or task is retained.
   */
  export function request(owner: prepareHumanSegmentPose.IPrepared): () => void {
    const source: prepareHumanSegmentPose.IPrepared["resolution"] = owner.resolution;
    const projection: prepareHumanSegmentPose.IPrepared["clamp"] = owner.clamp;
    let group: WeakMap<prepareHumanSegmentPose.IPrepared["resolution"], { count: number }> | undefined = REQUESTS.get(projection);
    if (group === undefined) {
      group = new WeakMap();
      REQUESTS.set(projection, group);
    }
    let record: { count: number } | undefined = group.get(source);
    if (record === undefined) {
      record = { count: 0 };
      group.set(source, record);
    }
    ++record.count;
    const retained: { count: number } = record;
    const pairs: typeof group = group;
    let released: boolean = false;
    return (): void => {
      if (released) return;
      released = true;
      if (--retained.count === 0) {
        pairs.delete(source);
        release(owner);
      }
    };
  }

  /**
   * Whether this exact source/projection pair has a live physical consumer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines optional native workspace arguments, no-invocation lookup and demand-only meaning; absent or unknown pairs return false.
   * @evidence contracts/development/implementation.md#principled-implementation Explicit operation demand determines whether constructing otherwise unused analytic source data serves a real consumer, independently of its mathematical admissibility.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One type gate and two weak lookups inspect actual active requests without creating a new source or issuing authority.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Neither source nor projection is invoked, inspected through a proxy, marked native or trusted as a numerical answer; this only avoids unnecessary work.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time and no allocation precede source rate/snapshot construction.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reads current demand without caching eligibility or callback results.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains no argument or result and acquires no resource; request owns pair lifetime and release.
   */
  export function wants(source: Parameters<IHumanActionPlan["posture"]>[2], projection: Parameters<IHumanActionPlan["posture"]>[3]): boolean {
    return typeof source === "function" && projection !== undefined &&
      (REQUESTS.get(projection)?.get(source)?.count ?? 0) > 0;
  }

  /**
   * End the prior loan before a new evaluation can fail or reenter.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the synchronous workspace loan and clearing before a new displayed evaluation, including its failure path.
   * @evidence contracts/development/implementation.md#principled-implementation A source/pose pair belongs to one completed evaluation, so starting another releases the old pairing before any authored callback or numerical work.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One private weak deletion shares the capture/consume owner's lifetime policy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Changes no pose, rate, fit, callback count, physical gate or acceptance policy.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant weak-map work performs no numerical computation or copying.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This lifetime operation shares no numerical result.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Drops the sole source/pose references immediately, retains no previous loan and acquires no resource or task.
   */
  export function release(owner: prepareHumanSegmentPose.IPrepared): void {
    CAPTURED.delete(owner);
  }

  /**
   * Capture genuine derivative data from the original single action read.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines actual original raw/reader/unclamped local seconds and final displayed pose, same-body workspace and one replaceable synchronous loan; unknown sources or readers clear an older loan.
   * @evidence contracts/development/implementation.md#principled-implementation The actual native dispatcher owns its open middle branch and copied clock/COM/goal construction; only its own reader or the exact refusal wrapper carries those facts. Matching that phase's time-to-share law with this current rate source closes arbitrary outer-wrapper crossing mutations. readCaptured separately verifies exact articulation and all numerical gates.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read actual raw-source and constructor-owned phase facts, verify open unclamped local time and exact share/duration conversion, then replace or clear one workspace slot after the final displayed operation without evaluating an action again.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No arbitrary callback is invoked, registered, sampled twice or inferred constant. Unknown wrappers have no constructor-issued phase facts even if their instantaneous raw values coincide. Capturing a source does not approve physical derivative gates or unsupported composition.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant map work and a two-reference record add no pose copy or numerical work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the same original displayed evaluation supplies this source and final pose; no previous timestamp or settled-pose cache provides derivative evidence.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A weak workspace owns at most one current source/pose loan, overwritten or cleared by the next capture and deleted before consumption; no per-time collection, callback or handle is retained.
   */
  export function capture(owner: prepareHumanSegmentPose.IPrepared, raw: IHumanPosture, pose: IAutoMoviePose,
    reader: IHumanActionPlan["posture"], localSeconds: number): void {
    const source: ISource | undefined = SOURCES.get(raw);
    if (source === undefined || source.body !== owner.body) {
      CAPTURED.delete(owner);
      return;
    }
    const phase: prepareJumpPosture.IPhase | undefined = prepareJumpPosture.phase(reader);
    if (phase === undefined ||
      !(localSeconds > phase.from && localSeconds < phase.to && localSeconds > 0 && localSeconds < phase.duration) ||
      !Object.is(source.rates.share, (localSeconds - phase.from) / phase.flightSeconds) ||
      !Object.is(source.rates.duration, phase.flightSeconds)) CAPTURED.delete(owner);
    else CAPTURED.set(owner, { source, pose });
  }

  /**
   * Consume the original displayed evaluation's source without another raw
   * posture call. Exact original pose identity pairs the synchronous loan;
   * actual scalar/FK/ROM and branch gates remain mandatory in readSource.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States same-evaluation pairing, destructive loan read, rootless actual-pose comparison, clinical degree/task metre-radian units and strict-interior numerical fallback. The caller excludes layers, carries, contacts, cuts and phase events; missing source returns undefined.
   * @evidence contracts/development/implementation.md#principled-implementation The actual native displayed evaluator supplies source and final pose once, preserving public callback effects and throw order. On a supported interior smooth six-coordinate branch, the chain rule gives J qdot=goalRate; existing HumanJacobian provides actual clinical twists, uncontrolled authored-coordinate twists are subtracted, and solved/direct twists sum into every actual bone-origin velocity.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Get/delete the workspace loan, pair its original completed pose, then admit live source/pose, form current geometric columns, solve two square leg tasks and reduce demanded segment twists. FK, ROM, quaternion derivatives and LU retain their existing owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Identity only pairs an operation and never proves physical correctness or temporal smoothness. Actual live rig, exact joints, strict box/cone or swing-twist-radius interiors and roundoff-sized task equations remain mandatory. Missing rates, boundaries, singular or inaccurate solves return undefined without damping, clipping, finite differences or a relaxed physical contract; a miss invokes no callback.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant loan work removes a duplicate plan.posture call. Admitted work includes one O(B) current FK, O(J) geometric columns, two six-by-six solves and O(BJ) segment reduction; gains and independent displayed-momentum qualification remain unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares only this original construction and completed pose. After live-source admission, a genuine same-body operation clamp lends its actual joint-projection metadata to HumanJacobian; unknown, wrapped or other-body functions retain ordinary preparation, and every actual projected tuple must still equal the current one. Current geometric columns serve task prefix subtraction and final bone rates; no previous timestamp, anchor derivative, numerical history or approximate match supplies an answer.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Deletes the sole workspace loan before validation or numerical failure. O(B+J) current maps and fixed-size matrices end synchronously; only a fresh demanded rate map with independent vectors escapes. No pose/source loan survives consumption.
   */
  export function readCaptured(body: IHumanBody, owner: prepareHumanSegmentPose.IPrepared, pose: IAutoMoviePose,
    requested: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>): ReadonlyMap<AutoMovieHumanoidBone, resolveAutoMovieBoneRates.IRate> | undefined {
    const captured: { source: ISource; pose: IAutoMoviePose } | undefined = CAPTURED.get(owner);
    CAPTURED.delete(owner);
    return captured?.pose === pose ? readSource(body, captured.source, pose, requested, owner.clamp) : undefined;
  }

  /**
   * Link the actual immutable free-curve producer's current output to its
   * current canonical solve and exact derivatives; no foreign callback is
   * inspected or marked. Endpoints and unavailable derivatives acquire none.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines constructor-only ownership, current goal frame, nullable admission and independent captured solve/rates.
   * @evidence contracts/development/implementation.md#principled-implementation A genuine strict-interior canonical cell fixes its local seed construction; actual engine-issued orientation-root facts require one local algebraic trial and one physical admission per leg, matching the current branch/swivel exactly. This restricts the local implicit-root policy without claiming global C1. Rigid placement leaves articulation unchanged; removing fixed heading/translation expresses the actual foot demands in the root frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the same current phase, directed cell interior and actual left/current/right branches, then actual unique-root provenance, live rig and fresh canonical flat scalars. Record the two current goals and their analytic rates independently, without materializing or cloning a full pose.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Cell absence, seams, query-local refinement, cold/near fallback, multiple root trials, ties, root/seed mismatch and invalid duration acquire no source. No global C1, arbitrary callback purity, cached-counter verdict or prior pose is inferred, and no actual IK target is replaced. Only the actual jump construction calls this internal seam.
   * @evidence contracts/development/implementation.md#efficient-algorithms Captures O(J) current joint scalars plus fixed-size goal/rate records; runtime gain remains unmeasured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This current solve snapshot creates no cross-time numerical reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each weak raw key owns O(J) copied numerical data and one rig guard until that raw output is released; no history, task, reader or external handle is retained.
   */
  export function issued(body: IHumanBody, raw: IHumanPosture,
    prepared: HumanPosturePreparation.IPrepared, rates: IAuthored | undefined): void {
    if (rates === undefined || raw.rotation !== undefined || raw.pitch !== 0 || raw.roll !== 0) return;
    const cell: prepareHumanFreeCurve.ICell | undefined = prepareHumanFreeCurve.cell(prepared);
    if (cell === undefined || !Object.is(cell.share, rates.share) || !(rates.duration > 0 && Number.isFinite(rates.duration)) ||
      !(cell.share > Math.min(cell.from, cell.to) && cell.share < Math.max(cell.from, cell.to))) return;
    const roots: ReturnType<typeof HumanPosturePreparation.orientationRoots> = HumanPosturePreparation.orientationRoots(prepared);
    if (roots === undefined) return;
    for (const limb of ["leftLeg", "rightLeg"] as const) {
      const left: typeof cell.left[typeof limb] = cell.left[limb];
      const current: typeof cell.current[typeof limb] = cell.current[limb];
      const right: typeof cell.right[typeof limb] = cell.right[limb];
      if (left === undefined || left === null || current === undefined || current === null || right === undefined || right === null ||
        !Object.is(left.branch, current.branch) || !Object.is(current.branch, right.branch) ||
        ![left.swivel, current.swivel, right.swivel].every(Number.isFinite)) return;
      const root: typeof roots[typeof limb] = roots[limb];
      if (root === undefined || root.trials !== 1 || root.accepted !== 1 ||
        !Number.isSafeInteger(root.proposals) || root.proposals < root.trials ||
        !Object.is(root.branch, current.branch) || !Object.is(root.swivel, current.swivel)) return;
    }
    const unchanged: (() => boolean) | undefined = prepareHumanPostureRigCheck(body);
    if (unchanged === undefined || !unchanged()) return;
    const observation: HumanPosturePreparation.IObservation | undefined = HumanPosturePreparation.source(prepared, NO_BONES);
    if (observation === undefined) return;
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, raw.yaw));
    const goalAt: (side: "left" | "right") => ISource["goals"]["left"] | undefined = (side: "left" | "right"): ISource["goals"]["left"] | undefined => {
      const goal: IHumanPosture.IGoal | undefined = raw.limbs[`${side}Leg`];
      if (goal?.rotation === undefined || goal.bend === undefined) return undefined;
      return {
        point: Quaternion.rotateVector(inverse, Vector3.subtract(goal.point, raw.root)),
        bend: Quaternion.rotateVector(inverse, Vector3.subtract(goal.bend, raw.root)),
        rotation: Quaternion.multiply(inverse, goal.rotation),
      };
    };
    const left: ISource["goals"]["left"] | undefined = goalAt("left");
    const right: ISource["goals"]["right"] | undefined = goalAt("right");
    if (left === undefined || right === undefined) return;
    const goals: ISource["goals"] = { left, right };
    SOURCES.set(raw, { body, snapshot: { names: observation.names, values: observation.values }, goals,
      rates: structuredClone(rates), authored: structuredClone(raw.joints), cell, unchanged });
  }

  /** Admit the current native mathematical source independently of transport. */
  function readSource(body: IHumanBody, source: ISource, pose: IAutoMoviePose,
    requested: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    projection: prepareHumanSegmentPose.IPrepared["clamp"]): ReadonlyMap<AutoMovieHumanoidBone, resolveAutoMovieBoneRates.IRate> | undefined {
    if (source.body !== body || !source.unchanged() || !sameJoints(source.snapshot, pose)) return undefined;
    const clamp: Parameters<typeof HumanJacobian.read>[4] = prepareHumanPostureProjection.joints(body, projection);
    const current: IAutoMoviePose = { ...pose, root: null };
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, current);
    const joints: IHumanPosture["joints"] = {};
    const variables: HumanJacobian.IVariable[] = [];
    const rates: number[] = [];
    const controlled: ReadonlyMap<AutoMovieHumanoidBone, readonly number[]> = new Map<AutoMovieHumanoidBone, readonly number[]>([
      ["leftUpperLeg", [0, 1, 2]], ["leftLowerLeg", [0]], ["leftFoot", [0, 1]],
      ["rightUpperLeg", [0, 1, 2]], ["rightLowerLeg", [0]], ["rightFoot", [0, 1]],
    ]);
    for (const joint of current.joints) {
      joints[joint.bone] = [joint.flexion ?? 0, joint.abduction ?? 0, joint.twist ?? 0];
      const authored: readonly [number, number, number] | undefined = source.rates.joints[joint.bone];
      if (authored === undefined) return undefined;
      for (const axis of [0, 1, 2] as const) {
        const value: number | null = [joint.flexion, joint.abduction, joint.twist][axis]!;
        const name: "flexion" | "abduction" | "twist" = ["flexion", "abduction", "twist"][axis] as "flexion" | "abduction" | "twist";
        if (value === null && (HUMANOID_REST_FRAME[joint.bone]?.[name]?.neutral ?? 0) !== 0) return undefined;
        const fitted: readonly number[] | undefined = controlled.get(joint.bone);
        if (fitted === undefined) {
          if (authored[axis] === 0) continue;
          if (!Object.is(value, source.authored[joint.bone]?.[axis] ?? 0) || !interior(body, current, joint.bone, [axis])) return undefined;
        } else if (!fitted.includes(axis)) continue;
        variables.push({ kind: "angle", bone: joint.bone, axis });
        rates.push(authored[axis]);
      }
    }
    const posture: IHumanPosture = { root: ZERO, yaw: 0, pitch: 0, roll: 0, joints, limbs: {} };
    const reading: ReturnType<typeof HumanJacobian.read> = HumanJacobian.read(body, posture, bones, variables, clamp);
    for (const [bone, projected] of reading.clamped) {
      const actual: readonly [number, number, number] | undefined = joints[bone];
      if (actual === undefined || !Object.is(actual[0], projected.flexion ?? 0) ||
        !Object.is(actual[1], projected.abduction ?? 0) || !Object.is(actual[2], projected.twist ?? 0)) return undefined;
    }
    const motions: HumanJacobian.IMotion[] = reading.motions;
    for (const side of ["left", "right"] as const) {
      const upper: AutoMovieHumanoidBone = `${side}UpperLeg`;
      const lower: AutoMovieHumanoidBone = `${side}LowerLeg`;
      const footName: AutoMovieHumanoidBone = `${side}Foot`;
      const foot: IAutoMovieResolvedBone | undefined = bones.get(footName);
      const hip: IAutoMovieResolvedBone | undefined = bones.get(upper);
      const knee: IAutoMovieResolvedBone | undefined = bones.get(lower);
      if (foot === undefined || hip === undefined || knee === undefined) return undefined;
      const length: number = Vector3.distance(hip.worldPosition, knee.worldPosition) + Vector3.distance(knee.worldPosition, foot.worldPosition);
      const roundoff: number = 256 * Number.EPSILON;
      if (!(length > 0) || Vector3.distance(foot.worldPosition, source.goals[side].point) > length * roundoff ||
        rotationDifference(foot.worldRotation, source.goals[side].rotation) > roundoff) return undefined;
      const aim: IAutoMovieVector3 = Vector3.subtract(source.goals[side].point, hip.worldPosition);
      const distance: number = Vector3.length(aim);
      if (!(distance > 0)) return undefined;
      const axis: IAutoMovieVector3 = Vector3.scale(aim, 1 / distance);
      const kneeOffset: IAutoMovieVector3 = Vector3.subtract(knee.worldPosition, hip.worldPosition);
      const poleOffset: IAutoMovieVector3 = Vector3.subtract(source.goals[side].bend, hip.worldPosition);
      const offKnee: IAutoMovieVector3 = Vector3.subtract(kneeOffset, Vector3.scale(axis, Vector3.dot(kneeOffset, axis)));
      const offPole: IAutoMovieVector3 = Vector3.subtract(poleOffset, Vector3.scale(axis, Vector3.dot(poleOffset, axis)));
      if (!(Vector3.dot(offKnee, offPole) > 0)) return undefined;
      const selected: number[] = [];
      for (const [bone, axes] of [[upper, [0, 1, 2]], [lower, [0]], [footName, [0, 1]]] as const) {
        if (!interior(body, current, bone, axes)) return undefined;
        if (axes.length !== 3) {
          const actual: IAutoMovieJointPose = current.joints.find((value: IAutoMovieJointPose): boolean => value.bone === bone)!;
          const fixed: readonly (number | null)[] = [actual.flexion, actual.abduction, actual.twist];
          const definition: IHumanBody["skeleton"]["bones"][number] | undefined = body.skeleton.bones.find((value: IHumanBody["skeleton"]["bones"][number]): boolean => value.bone === bone);
          const constraint: IAutoMovieJointConstraint | null = getConstraint(bone, definition?.constraint ?? null);
          const limits: readonly (IAutoMovieJointConstraint["flexion"] | undefined)[] = [constraint?.flexion, constraint?.abduction, constraint?.twist];
          for (const axis of [0, 1, 2] as const)
            if (!(axes as readonly number[]).includes(axis) && (limits[axis] !== null || fixed[axis] !== null && fixed[axis] !== 0)) return undefined;
        }
        for (const axis of axes) {
          const index: number = variables.findIndex((variable: HumanJacobian.IVariable): boolean => variable.kind === "angle" && variable.bone === bone && variable.axis === axis);
          if (index < 0) return undefined;
          selected.push(index);
        }
      }
      const matrix: number[][] = Array.from({ length: 6 }, (): number[] => []);
      for (const index of selected) {
        const twist: HumanJacobian.ITwist = HumanJacobian.twist(motions[index]!, footName, foot.worldPosition);
        const column: number[] = components(twist);
        for (let row: number = 0; row < 6; ++row) matrix[row]!.push(column[row]!);
      }
      const right: number[] = components(source.rates.legs[side]);
      for (let index: number = 0; index < motions.length; ++index) {
        if (selected.includes(index) || rates[index] === 0) continue;
        const column: number[] = components(HumanJacobian.twist(motions[index]!, footName, foot.worldPosition));
        for (let row: number = 0; row < 6; ++row) right[row] = right[row]! - column[row]! * rates[index]!;
      }
      const solved: solveResolvedRate.IResult = solveResolvedRate(matrix, right, [length, length, length, 1, 1, 1]);
      if (solved.status !== "solved" || solved.inverseDefect >= 1 ||
        solved.conditionEstimate * Number.EPSILON >= Math.sqrt(Number.EPSILON) ||
        solved.normwiseBackwardError > roundoff) return undefined;
      for (let index: number = 0; index < selected.length; ++index) rates[selected[index]!] = solved.velocity[index]!;
    }
    const result: Map<AutoMovieHumanoidBone, resolveAutoMovieBoneRates.IRate> = new Map();
    for (const [name, bone] of requested) {
      let linear: IAutoMovieVector3 = { ...ZERO };
      let angular: IAutoMovieVector3 = { ...ZERO };
      for (let index: number = 0; index < motions.length; ++index) {
        if (rates[index] === 0) continue;
        const twist: HumanJacobian.ITwist = HumanJacobian.twist(motions[index]!, name, bone.worldPosition);
        linear = Vector3.add(linear, Vector3.scale(twist.linear, rates[index]!));
        angular = Vector3.add(angular, Vector3.scale(twist.angular, rates[index]!));
      }
      if (![linear.x, linear.y, linear.z, angular.x, angular.y, angular.z].every(Number.isFinite)) return undefined;
      result.set(name, { linear, angular });
    }
    return source.unchanged() ? result : undefined;
  }

  /** The common root frame has no placement derivative. */
  const ZERO: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

  /** Derivative source capture needs clinical scalars, without world FK outputs. */
  const NO_BONES: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>();

  /** Exact canonical articulation comparison avoids instantaneous pose guessing. */
  function sameJoints(a: ISource["snapshot"], b: IAutoMoviePose): boolean {
    if (a.names.length !== b.joints.length) return false;
    for (let index: number = 0; index < a.names.length; ++index) {
      const other: IAutoMovieJointPose | undefined = b.joints[index];
      if (other === undefined || other.bone !== a.names[index] || !Object.is(a.values[3 * index], other.flexion) ||
        !Object.is(a.values[3 * index + 1], other.abduction) || !Object.is(a.values[3 * index + 2], other.twist)) return false;
    }
    return true;
  }

  /** Strict box/cone interiors exclude active-set and unsupported coupled gates. */
  function interior(body: IHumanBody, pose: IAutoMoviePose, bone: AutoMovieHumanoidBone, mobile: readonly number[]): boolean {
    const joint: IAutoMovieJointPose | undefined = pose.joints.find((value: IAutoMovieJointPose): boolean => value.bone === bone);
    const definition: IHumanBody["skeleton"]["bones"][number] | undefined = body.skeleton.bones.find((value: IHumanBody["skeleton"]["bones"][number]): boolean => value.bone === bone);
    const constraint: IAutoMovieJointConstraint | null = getConstraint(bone, definition?.constraint ?? null);
    if (joint === undefined || constraint === null) return false;
    if (constraint.swingTwist !== undefined && constraint.swingTwist !== null) {
      const frame: swingTwistRange.IJoint | undefined = swingTwistRange.of(bone, body.skeleton);
      if (frame !== undefined) {
        const rotation: IAutoMovieQuaternion = jointToQuaternion(joint, frame.axes, frame.frame);
        const reading: swingTwistRange.IReading = swingTwistRange.read(rotation, frame);
        const radius: number = swingTwistRange.radius(constraint, frame, reading.azimuth);
        const twist: number = nearestAngleAlias(reading.twist, constraint.swingTwist.twist);
        return reading.swing < 180 && reading.swing < radius &&
          twist > constraint.swingTwist.twist.min && twist < constraint.swingTwist.twist.max;
      }
    }
    const values: readonly (number | null)[] = [joint.flexion, joint.abduction, joint.twist];
    const ranges: readonly (IAutoMovieJointConstraint["flexion"])[] = [constraint.flexion, constraint.abduction, constraint.twist];
    for (let axis: number = 0; axis < 3; ++axis) {
      const value: number | null = values[axis]!;
      const range: IAutoMovieJointConstraint["flexion"] = ranges[axis]!;
      if (mobile.includes(axis)) {
        if (value === null || range === null || !(value > range.min && value < range.max)) return false;
      } else if (range === null ? value !== null && value !== 0 : value !== null && !(value >= range.min && value <= range.max)) return false;
    }
    return constraint.swingDeg === undefined || constraint.swingDeg === null || swingConeAngle(joint.flexion ?? 0, joint.abduction ?? 0) < constraint.swingDeg;
  }

  /** Task rows consistently order origin metres before spatial radians. */
  function components(rate: resolveAutoMovieBoneRates.IRate): number[] {
    return [rate.linear.x, rate.linear.y, rate.linear.z, rate.angular.x, rate.angular.y, rate.angular.z];
  }

  /** Sign-aligned component distance retains roundoff-scale orientation resolution. */
  function rotationDifference(from: IAutoMovieQuaternion, into: IAutoMovieQuaternion): number {
    const a: IAutoMovieQuaternion = Quaternion.normalize(from);
    const b: IAutoMovieQuaternion = Quaternion.normalize(into);
    const sign: number = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w < 0 ? -1 : 1;
    return Math.hypot(a.x - sign * b.x, a.y - sign * b.y, a.z - sign * b.z, a.w - sign * b.w);
  }
}
