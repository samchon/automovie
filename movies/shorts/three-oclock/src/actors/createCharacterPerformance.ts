import type { AutoMovieHumanGrounding, AutoMovieHumanSkeleton, IAutoMovieHumanHandPose, IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import { createFootControls } from "./createFootControls";
import { createArmControls } from "./createArmControls";
import type { createHumanActor } from "./createHumanActor";
import { evaluateExchange } from "./evaluateExchange";
import { evaluateFootContacts } from "./evaluateFootContacts";
import { blendNoteGrip } from "./blendNoteGrip";
import type { IPerformanceIntent } from "./IPerformanceIntent";
import { blendArmSeed } from "./blendArmSeed";
import { blendHandNormal } from "./blendHandNormal";

/** Optional authored controls consumed by the actual hand/body adapters. */
type Action = ReturnType<typeof evaluateExchange> & Partial<Pick<IPerformanceIntent, "gripWeight" | "rightHandRole" | "rightNormal" | "rightNormalWeight" | "rightNormalPolicy" | "rightReach" | "rightSeedFrom" | "bendAmount">>;

/** Original public request/result fields retained without full FK snapshots. */
type ArmDetail = Pick<ReturnType<ReturnType<typeof createArmControls>["fit"]>, "iterations" | "request" | "seed" | "constraintValues" | "constraintsSatisfied" | "orientationAttempt" | "orientationError">;
/** Actual hard/soft support semantics stay distinct in the observation port. */
type FootDetail = Pick<ReturnType<ReturnType<typeof createFootControls>["fit"]>, "status" | "reason" | "iterations" | "supportError" | "softError" | "activeBounds" | "hardTargets" | "softTargets" | "pathError" | "requestedRoot" | "rootAxes" | "rootAdjustment"> & { descriptor: ReturnType<typeof createFootControls>["descriptor"] };

/**
 * Prepare one cast member's deterministic body/support states for the scene.
 *
 * @evidence contracts/common.md#implementation-and-ownership Reuses public full-foot fitting with every actual Human/shoe vertex. Lower caches include explicit acting-knee preferences; they do not assume seed angles were achieved. Carry and free-palm adapters retain distinct original anchors. A strictly earlier actually fitted arm supplies continuous transition seeds, while a quaternion course from its fixed actual normal consumes the requested empty-hand direction without collapsing the60mm marker. Body-derived reach uses the current supported shoulder, not an assumed crouch height. Exact pose/root/point/role/normal requests share bounded results. Complete readiness still refuses hard support or arm residuals above3mm; physical paper contact belongs to the composed scene.
 * @evidence contracts/common.md#authoring-interface Fixed actor/person/duration, optional grip and immutable action evaluator own one bounded24fps cache. Scene calibration/final instances must share the initial neutral preparedFeet; a different actual actor owner refuses. Descriptor identity accompanies every returned support result. Earlier seed references precede the current frame; their calculation resets the current root before its own fitting, so seeking has no hidden pose history. Default essential normal policy preserves the opening. Postrelease free-hand orientation may explicitly be preferred: original attempt/final direction mismatch remain recorded while the actual point still requires3mm. Grip weight opens actual digits; attachment loss remains measured elsewhere. prepare precedes Play/export. Point admission is not global balance, collision or visual approval.
 */
export function createCharacterPerformance(actor: ReturnType<typeof createHumanActor>, person: "carina" | "harry", duration: number, grip?: { hand: IAutoMovieHumanHandPose; forearmPronation: number; anchor: { bone: "rightHand"; localPoint: [number, number, number] } }, actionAt: (person: "carina" | "harry", seconds: number, reference: { left: THREE.Vector3; right: THREE.Vector3 }) => Action = evaluateExchange, preparedFeet?: ReturnType<typeof createFootControls>): {
  apply: (seconds: number) => { frame: number; root: AutoMovieHumanGrounding.IRoot; status: "admitted" | "unresolved"; error: number; floorMinimum: number; armError: number; handRole: "carry" | "free"; knees: { left: number; right: number }; handPoint: number[]; palmNormal?: number[]; footMinimum: { left: number; right: number }; softFootError: number; reason: string; iterations: number; modes: ReturnType<typeof evaluateFootContacts>; footDetail: FootDetail; armDetail?: ArmDetail };
  prepare: (progress?: (done: number, total: number) => void) => Promise<void>;
  snapshot: (seconds: number) => { pose: IAutoMovieHumanPose; root: AutoMovieHumanGrounding.IRoot; heading: number };
} {
  const feet: ReturnType<typeof createFootControls> = preparedFeet ?? createFootControls(actor);
  if (feet.owner !== actor.object) throw new Error("Prepared support belongs to another actual actor");
  const carryArm: ReturnType<typeof createArmControls> = createArmControls(actor, grip?.anchor);
  const freeArm: ReturnType<typeof createArmControls> = grip === undefined ? carryArm : createArmControls(actor);
  const total: number = Math.round(duration * 24);
  type State = { pose: IAutoMovieHumanPose; root: AutoMovieHumanGrounding.IRoot; heading: number; status: "admitted" | "unresolved"; error: number; floorMinimum: number; face: "neutral" | "smirk" | "surprise" | "smile"; visible: boolean; armError: number; handRole: "carry" | "free"; footMinimum: { left: number; right: number }; softFootError: number; reason: string; iterations: number; modes: ReturnType<typeof evaluateFootContacts>; footDetail: FootDetail; armDetail?: ArmDetail };
  const states: Map<number, State> = new Map();
  const lower: Map<string, Omit<State, "face" | "visible" | "heading" | "armError" | "handRole">> = new Map();
  const upper: Map<string, { pose: IAutoMovieHumanPose; error: number; detail: ArmDetail }> = new Map();
  let preparation: Promise<void> | undefined;

  /** Resolve one frame from authored time without retaining previous pose state. */
  function frame(index: number): State {
    const previous: State | undefined = states.get(index);
    if (previous !== undefined) return previous;
    const action: Action = actionAt(person, index / 24, feet.reference);
    const handRole: "carry" | "free" = action.rightHandRole ?? (grip === undefined ? "free" : "carry");
    const arm: ReturnType<typeof createArmControls> = handRole === "free" ? freeArm : carryArm;
    if (grip !== undefined) {
      action.pose.arms!.right.hand = action.gripWeight === undefined || action.gripWeight === 1 ? grip.hand : blendNoteGrip(grip.hand, action.gripWeight);
      if (handRole === "carry") action.pose.arms!.right.forearm = { pronation: grip.forearmPronation };
    }
    let normalGoal: THREE.Vector3 | undefined = action.rightNormal;
    let normalWeight: number | undefined = action.rightNormalWeight;
    if (action.rightSeedFrom !== undefined) {
      const earlier: number = Math.floor(action.rightSeedFrom.seconds * 24 + 1e-7);
      if (!Number.isSafeInteger(earlier) || earlier < 0 || earlier >= index) throw new Error("Arm seed reference must be a strictly earlier scene frame");
      const reference: State = frame(earlier);
      action.pose.arms!.right = blendArmSeed(reference.pose.arms!.right, action.pose.arms!.right, action.rightSeedFrom.blend);
      if (normalGoal !== undefined && freeArm.palmNormal !== undefined) {
        const hand: AutoMovieHumanSkeleton.IPlacement = actor.evaluate(reference.pose).posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === "rightHand")!;
        const rootRotation: THREE.Quaternion = new THREE.Quaternion(...reference.root.rotation);
        const first: THREE.Vector3 = freeArm.palmNormal.clone().applyQuaternion(new THREE.Quaternion(...hand.rotation)).applyQuaternion(rootRotation).normalize();
        normalGoal = blendHandNormal(first, normalGoal, action.rightNormalWeight ?? 1, new THREE.Vector3(1, 0, 0).applyQuaternion(rootRotation));
        normalWeight = 1;
      }
    }
    actor.object.position.copy(action.position);
    actor.object.rotation.set(0, action.heading, 0);
    actor.object.updateMatrixWorld(true);
    const modes: ReturnType<typeof evaluateFootContacts> = evaluateFootContacts(person, index / 24);
    const lowerSeed: IAutoMovieHumanPose = { ...(action.pose.legs === undefined ? {} : { legs: action.pose.legs }), ...(action.pose.pelvis === undefined ? {} : { pelvis: action.pose.pelvis }) };
    const preferredKnees: { left: number; right: number } | undefined = action.bendAmount !== undefined && action.bendAmount > 0 ? { left: lowerSeed.legs?.left?.knee?.flexion ?? 12, right: lowerSeed.legs?.right?.knee?.flexion ?? 12 } : undefined;
    const key: string = JSON.stringify([action.position.toArray(), action.heading, action.left.toArray(), action.right.toArray(), modes, lowerSeed, preferredKnees]);
    let fitted: ReturnType<typeof lower.get> = lower.get(key);
    if (fitted === undefined) {
      const result: ReturnType<typeof feet.fit> = feet.fit(lowerSeed, action.left, action.right, modes, preferredKnees);
      fitted = { pose: result.pose, root: result.root, status: result.contactAdmitted ? "admitted" : "unresolved", error: result.error, floorMinimum: result.floorMinimum,
        footMinimum: result.footMinimum, softFootError: result.softError, reason: result.status !== "admitted" ? result.reason : result.contactAdmitted ? "admitted" : "swing-clearance-unresolved", iterations: result.iterations, modes,
        footDetail: { descriptor: feet.descriptor, requestedRoot: result.requestedRoot, rootAxes: result.rootAxes, rootAdjustment: result.rootAdjustment, status: result.status, reason: result.reason, iterations: result.iterations, supportError: result.supportError, softError: result.softError, activeBounds: result.activeBounds, hardTargets: result.hardTargets, softTargets: result.softTargets, pathError: result.pathError } };
      lower.set(key, fitted);
    }
    const value: State = { ...fitted, heading: action.heading, face: action.face, visible: action.visible, armError: 0, handRole,
      pose: { ...fitted.pose, ...(action.pose.arms === undefined ? {} : { arms: action.pose.arms }), ...(action.pose.head === undefined ? {} : { head: action.pose.head }),
        ...(action.pose.spine === undefined ? {} : { spine: action.pose.spine }), ...(action.pose.neck === undefined ? {} : { neck: action.pose.neck }) } };
    if (action.rightTarget !== undefined || action.rightReach !== undefined || action.rightNormal !== undefined) {
      actor.object.position.fromArray(fitted.root.translation);
      actor.object.updateMatrixWorld(true);
      let target: THREE.Vector3;
      if (action.rightTarget !== undefined) target = action.rightTarget;
      else if (action.rightReach !== undefined) target = arm.reachTarget(value.pose, action.rightReach.towards, action.rightReach.fraction);
      else {
        const placement: AutoMovieHumanSkeleton.IPlacement = actor.evaluate(value.pose).posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === arm.anchor.bone)!;
        target = actor.object.localToWorld(new THREE.Vector3(...arm.anchor.localPoint).applyQuaternion(new THREE.Quaternion(...placement.rotation)).add(new THREE.Vector3(...placement.position)));
      }
      const weight: number = action.rightReach !== undefined && action.rightTarget === undefined ? action.rightReach.weight : action.targetWeight ?? 1;
      const normalPolicy: "essential" | "preferred" = handRole === "free" ? action.rightNormalPolicy ?? "essential" : "essential";
      const armKey: string = JSON.stringify([value.pose, fitted.root, target.toArray(), weight, handRole, normalGoal?.toArray(), normalWeight, normalPolicy]);
      let fit: ReturnType<typeof upper.get> = upper.get(armKey);
      if (fit === undefined) { const solved: ReturnType<typeof arm.fit> = arm.fit(value.pose, target, weight, normalGoal, normalWeight, normalPolicy); fit = { pose: solved.pose, error: solved.error,
        detail: { iterations: solved.iterations, request: solved.request, seed: solved.seed, constraintValues: solved.constraintValues, constraintsSatisfied: solved.constraintsSatisfied, orientationAttempt: solved.orientationAttempt, orientationError: solved.orientationError } }; upper.set(armKey, fit); }
      value.pose = fit.pose;
      value.armError = fit.error;
      value.armDetail = fit.detail;
    }
    states.set(index, value);
    return value;
  }
  return {
    snapshot: (seconds: number): { pose: IAutoMovieHumanPose; root: AutoMovieHumanGrounding.IRoot; heading: number } => {
      const state: State = frame(Math.max(0, Math.min(total, Math.floor(seconds * 24 + 1e-7))));
      return structuredClone({ pose: state.pose, root: state.root, heading: state.heading });
    },
    apply: (seconds: number): { frame: number; root: AutoMovieHumanGrounding.IRoot; status: "admitted" | "unresolved"; error: number; floorMinimum: number; armError: number; handRole: "carry" | "free"; knees: { left: number; right: number }; handPoint: number[]; palmNormal?: number[]; footMinimum: { left: number; right: number }; softFootError: number; reason: string; iterations: number; modes: ReturnType<typeof evaluateFootContacts>; footDetail: FootDetail; armDetail?: ArmDetail } => {
      const index: number = Math.max(0, Math.min(total, Math.floor(seconds * 24 + 1e-7)));
      const state: State = frame(index);
      const arm: ReturnType<typeof createArmControls> = state.handRole === "free" ? freeArm : carryArm;
      actor.object.position.fromArray(state.root.translation);
      actor.object.rotation.set(0, state.heading, 0);
      actor.object.visible = state.visible;
      actor.setPose(state.pose, state.face);
      const normal: THREE.Vector3 | undefined = arm.palmNormal?.clone().transformDirection(actor.drawing.bones.get("rightHand")!.matrixWorld);
      return { frame: index, root: state.root, status: state.status, error: state.error, floorMinimum: state.floorMinimum, armError: state.armError, handRole: state.handRole, knees: { left: state.pose.legs?.left?.knee?.flexion ?? 0, right: state.pose.legs?.right?.knee?.flexion ?? 0 }, handPoint: actor.point(arm.anchor.bone, new THREE.Vector3(...arm.anchor.localPoint)).toArray(), ...(normal === undefined ? {} : { palmNormal: normal.toArray() }),
        footMinimum: state.footMinimum, softFootError: state.softFootError, reason: state.reason, iterations: state.iterations, modes: state.modes, footDetail: state.footDetail, ...(state.armDetail === undefined ? {} : { armDetail: state.armDetail }) };
    },
    prepare: (progress?: (done: number, total: number) => void): Promise<void> => {
      if (preparation === undefined) preparation = (async (): Promise<void> => {
        const failures: { frame: number; error: string }[] = [];
        for (let index: number = 0; index <= total; index++) {
          try { const state: State = frame(index); if (state.status !== "admitted") failures.push({ frame: index, error: `${state.reason}; hard stance/path error=${state.error}m; whole-foot minima=${JSON.stringify(state.footMinimum)}; sole path errors=${JSON.stringify(state.footDetail.pathError)}` }); if (state.armError > 0.003) failures.push({ frame: index, error: `arm target unresolved:${state.armError}m` }); }
          catch (error) { failures.push({ frame: index, error: error instanceof Error ? error.message : String(error) }); }
          progress?.(index + 1, total + 1);
          if (index % 4 === 0) await new Promise<void>((resolve: () => void): void => { setTimeout(resolve, 0); });
        }
        if (failures.length !== 0) throw new Error(`${person} preparation failures: ${JSON.stringify(failures)}`);
      })();
      return preparation;
    },
  };
}
