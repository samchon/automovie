import { AutoMovieHumanGrounding, AutoMovieHumanRigControls, type AutoMovieHumanClinicalIk, type AutoMovieHumanSkeleton, type AutoMovieHumanSupportFrame, type IAutoMovieHumanPose } from "@automovie/human";
import type { IAutoMovieMesh } from "@automovie/interface";
import * as THREE from "three";
import { InspectionPerson } from "../InspectionPerson";
import { addInspectionGloves } from "../addInspectionGloves";
import { addInspectionOutfit } from "../addInspectionOutfit";
import { displayedSurface } from "../displayedSurface";
import { fitInspectionPose } from "../fitInspectionPose";
import { inspectPersonGeometry } from "../inspectPersonGeometry";
import { MotionAction } from "../motion/core/MotionAction";
import { labGuard } from "./labGuard";
import { prepareLabHuman } from "./prepareLabHuman";
import { fitLabGuard } from "./fitLabGuard";
import { LabFitPlan } from "./LabFitPlan";
import { inspectLabSeed } from "./inspectLabSeed";
import { labSupportTargets } from "./labSupportTargets";
import { LabBodyStage } from "./LabBodyStage";
import { LabClinicalWitnesses } from "./LabClinicalWitnesses";
import { LabStance } from "./LabStance";
import type { LabArmWriter } from "./LabArmWriter";
import { LabFailure } from "./LabFailure";
import { LabActorSupport } from "./LabActorSupport";
import { LabPlacement } from "./LabPlacement";

/**
 * Actual original polygon actor consumed by every laboratory case.
 *
 * @evidence contracts/common.md#implementation-and-ownership Reuses geometry-only public Human polygon helpers. Sample effectors drive the same real hand and leg bones displayed on screen; public Grounding consumes all original foot vertices. Solver limits remain observable.
 * @evidence contracts/common.md#authoring-interface Scene roots and support witnesses use world metres; action targets remain actor-local metres. Each actor owns its independent root and retained stance, with no bout timeline imports.
 */
export class LabActor {
  /** At most four immutable fits across two leads and fighter/official equipment roles. */
  private static readonly baselines: Map<string, ReturnType<typeof fitInspectionPose>> = new Map();
  /** Separate construction and initial fitting CPU cost for the real bottleneck. */
  public readonly construction: { anatomicalPreparationMs: number; preparationReused: boolean; publicPreparationBuilds: number; drawingAndEquipmentMs: number; guardFitMs: number; guardReused: boolean; resetMs: number };
  /** Complete anatomical input/options key, independent of palette or actor name. */
  private readonly anatomicalKey: string;
  /** Original polygon and its real bone-bound equipment. */
  public readonly person: InspectionPerson;
  /** Own immutable fitted guard used for action sampling. */
  public basePose!: IAutoMovieHumanPose;
  /** Latest pose actually consumed by the displayed polygon. */
  public pose!: IAutoMovieHumanPose;
  /** Independently authored scene root before action offsets. */
  public readonly origin: THREE.Vector3 = new THREE.Vector3();
  /** Fixed laboratory heading; no opposing root is copied. */
  public yaw: number = 0;
  /** Current anatomical lead, retained independently of actor identity. */
  public leadSide: MotionAction.Side = "left";
  /** Actual face population version used by the full-cloud physical query. */
  private cloudRevision: number = -1;
  /** Last exact public support result, including unresolved outcomes. */
  public support: AutoMovieHumanGrounding.IResult | undefined;
  /** Latest requested sample, detached from module-owned inputs. */
  public sample: MotionAction.Sample | undefined;
  /** Latest effector fit errors in metres. */
  public readonly errors: { bone: string; role: MotionAction.Effector["role"]; constraint: "hard" | "soft"; target: MotionAction.Vec3; actual: MotionAction.Vec3; error: number }[] = [];
  /** Actual initial compact-guard pad residuals, retained even when unresolved. */
  public guardErrors: number[] = [];
  /** Actual loaded-side ground witnesses, independent of scalar load intent. */
  private loadChecks: LabActorSupport.LoadCheck[] = [];
  /** Raw public joint/floor outcome before the independent loaded-ground role check. */
  private solverStatus: AutoMovieHumanGrounding.IResult["status"] | undefined;
  /** Native numerical termination, retained before independent load admission. */
  private solverReason: AutoMovieHumanGrounding.IResult["reason"] | undefined;
  /** Every actual body/equipment vertex in its original rigid carrier frame. */
  private surfacePoints: LabActorSupport.Cloud = [];
  /** Whole-body fixed-floor query for general contact and airborne samples. */
  private bodyGrounding!: AutoMovieHumanGrounding.IPrepared;
  /** Distinct CPU phases; pose application includes its public FK and matrix refresh. */
  public costs: { ikMs: number; groundingMs: number; poseAndMatricesMs: number; supportPlanning?: LabActor["supportPlanning"] } = { ikMs: 0, groundingMs: 0, poseAndMatricesMs: 0 };
  /** Cumulative nonmutating source support work, retained even after an atomic failure. */
  public readonly supportPlanning: { calls: number; milliseconds: number; iterations: number; last?: LabActorSupport.PlanningCost } = { calls: 0, milliseconds: 0, iterations: 0 };
  /** Actual low plantar and forefoot witnesses retained per side. */
  public patches!: Record<MotionAction.Side, { low: MotionAction.SupportPatch; pivot: MotionAction.SupportPatch }>;
  /** Actual initial positions of the same forefoot vertices later requested on the floor. */
  public pivotStarts!: Record<MotionAction.Side, MotionAction.Vec3>;
  /** Full actual source-foot geometry prepared once. */
  private grounding!: AutoMovieHumanGrounding.IPrepared;
  /** Current immutable stance planner; older contexts retain their own captured closure. */
  private supportPlanner!: NonNullable<MotionAction.Context["prepareSupport"]>;
  /** Complete original bone-bound plantar points, independent of pose or palette. */
  private readonly plantarPoints: Record<MotionAction.Side, AutoMovieHumanSupportFrame.IPoint[]> = { left: [], right: [] };
  /** Owned glove and outfit retirement operations. */
  private readonly equipment: (() => void)[];
  /** Immutable baseline FK reused by both side-specific action contexts. */
  private guardOutput!: AutoMovieHumanSkeleton.IOutput;
  /** Actual world goals retained before the joint solve, so root fitting cannot move the oracle. */
  private worldTargets: AutoMovieHumanClinicalIk.ITarget[] = [];
  /** Requested root and all hard/soft support goals are frozen before fitting. */
  private requestedRoot: AutoMovieHumanGrounding.IRoot | undefined;
  /** Actual support frame goals, including orientation witnesses on their own bone. */
  private supportTargets: AutoMovieHumanClinicalIk.ITarget[] = [];
  /** Exact selected controls and the public finite work budget of the latest completed sample. */
  private fitPlan: LabFitPlan.Selection | undefined;
  /** Every raw hard goal keeps its normalized solver-equation index. */
  private hardGoalMapping: ReturnType<typeof LabFitPlan.hardTargets> | undefined;
  /** A failed request is separate from the restored displayed sample. */
  private failedAttempt: { message: string; request: MotionAction.Sample; plan?: LabFitPlan.Selection; hardGoals?: LabActor["hardGoalMapping"]; observed?: object } | undefined;
  private bodyPreparation: { requested: MotionAction.BodyPlacement; realized?: MotionAction.BodyPlacement; bodyTasks: LabActorSupport.BodyTask[]; observation: object } | undefined;

  /** Construct one 180 cm fictional adult; 80 kg is identity metadata, not inferred mass. */
  public constructor(public readonly id: string, private readonly role: "a" | "b" | "referee", x: number, yaw: number, lead: MotionAction.Side = "left", z: number = 0) {
    const anatomy: ReturnType<typeof prepareLabHuman> = prepareLabHuman(LabActorSupport.profile(role).parameters);
    this.anatomicalKey = anatomy.diagnostics.key;
    const polygonStarted: number = performance.now();
    this.person = new InspectionPerson(anatomy.parameters, role === "a" ? 0xb98367 : 0x75523f, anatomy.evaluate);
    this.equipment = [...(role === "referee" ? [] : [addInspectionGloves(this.person, role === "a" ? 0xdc3545 : 0x24d9df)]), addInspectionOutfit(this.person, role)];
    this.construction = { anatomicalPreparationMs: anatomy.diagnostics.anatomicalPreparationMs, preparationReused: anatomy.diagnostics.reused, publicPreparationBuilds: anatomy.diagnostics.builds, drawingAndEquipmentMs: performance.now() - polygonStarted, guardFitMs: 0, guardReused: false, resetMs: 0 };
    this.reset(x, yaw, lead, z);
  }

  /**
   * Reuse this same actor/drawing with an independent clean baseline and world placement.
   * @evidence contracts/common.md#implementation-and-ownership Clears prior action/contact goals and applies an owned fitted stance keyed by the complete anatomical preparation and lead side. All world anchors and frames are remeasured from this actor's actual unchanged geometry after its new root; no opposing actor state is copied.
   * @evidence contracts/common.md#authoring-interface X is metres and yaw is a scene +Y angle in radians. Shared preparation never shares mutable actor pose, matrices, equipment or query events; the host may borrow actors but must reset before a new case.
   */
  public reset(x: number, yaw: number, lead: MotionAction.Side, z: number = 0): void {
    const resetStarted: number = performance.now();
    this.sample = undefined;
    this.errors.length = 0;
    this.loadChecks = [];
    this.solverStatus = undefined;
    this.solverReason = undefined;
    this.fitPlan = undefined; this.hardGoalMapping = undefined; this.failedAttempt = undefined; this.bodyPreparation = undefined;
    this.worldTargets = [];
    this.requestedRoot = undefined;
    this.supportTargets = [];
    this.person.object.position.set(0, 0, 0);
    this.person.object.quaternion.identity();
    const guardStarted: number = performance.now();
    const baselineKey: string = `${this.anatomicalKey}:${lead}:${this.role === "referee" ? "official" : "compact-cheek-v1"}`;
    const cached: ReturnType<typeof fitInspectionPose> | undefined = LabActor.baselines.get(baselineKey);
    const fitted: ReturnType<typeof fitInspectionPose> = cached ? structuredClone(cached) : this.role === "referee" ? fitInspectionPose(this.person, labGuard(lead), false) : fitLabGuard(this.person, labGuard(lead));
    if (!cached) { if (LabActor.baselines.size >= 4) LabActor.baselines.clear(); LabActor.baselines.set(baselineKey, structuredClone(fitted)); }
    else { this.person.pose(fitted.support.pose); this.person.object.position.set(...fitted.support.root.translation); }
    this.construction.guardFitMs = performance.now() - guardStarted;
    this.construction.guardReused = Boolean(cached);
    this.guardErrors = [...fitted.guardErrors];
    this.basePose = structuredClone(fitted.support.pose);
    this.guardOutput = this.person.output;
    this.pose = structuredClone(this.basePose);
    this.person.object.position.set(x, this.person.object.position.y, z);
    this.person.object.rotation.y = yaw;
    this.person.object.updateWorldMatrix(true, true);
    this.origin.copy(this.person.object.position);
    this.yaw = yaw;
    this.leadSide = lead;
    this.measureStance();
    this.surfacePoints = LabActorSupport.cloud(this.person);
    this.bodyGrounding = AutoMovieHumanGrounding.prepare(this.person.evaluate, this.surfacePoints);
    this.cloudRevision = this.person.geometryRevision;
    this.support = fitted.support;
    this.construction.resetMs = performance.now() - resetStarted;
  }

  /**
   * Adopt the actual fitted entry endpoint as the next technique's anatomical origin.
   * @evidence contracts/common.md#implementation-and-ownership Copies the applied pose, root and current FK, preserving any upright WORLD yaw and the original declared loaded point/frame goals. Current geometry supplies future roll witnesses without moving those active goals to achieved residuals.
   * @evidence contracts/common.md#authoring-interface The host preserves its old entry for replay. Adoption resets local root offsets and relative yaw to zero; a tilted root refuses before mutation and remains usable through explicit sample rootRotation for contact performance.
   */
  public adopt(): void {
    const up: THREE.Vector3 = new THREE.Vector3(0, 1, 0).applyQuaternion(this.person.object.quaternion);
    if (up.distanceTo(new THREE.Vector3(0, 1, 0)) > 1e-10) throw new Error("Standing adoption requires an upright root; tilted contact performances retain their explicit sample rootRotation");
    const forward: THREE.Vector3 = new THREE.Vector3(1, 0, 0).applyQuaternion(this.person.object.quaternion);
    const retained: MotionAction.SupportPatch[] | undefined = this.sample?.support.patches ? LabActorSupport.adoptedPatches(this.guardOutput, this.person.output, this.yaw, Math.atan2(-forward.z, forward.x), this.sample.support.patches) : undefined;
    this.yaw = Math.atan2(-forward.z, forward.x);
    this.basePose = structuredClone(this.pose);
    this.guardOutput = this.person.output;
    this.origin.copy(this.person.object.position);
    this.requestedRoot = undefined;
    this.supportTargets = [];
    this.sample = undefined;
    this.errors.length = 0;
    this.worldTargets = [];
    this.measureStance();
    if (retained) {
      for (const side of ["left", "right"] as const) {
        const low: MotionAction.SupportPatch | undefined = retained.find((patch: MotionAction.SupportPatch): boolean => patch.side === side && patch.mode === "planted");
        if (low) this.patches[side].low = low;
      }
      this.capturePlanner();
    }
  }

  /** Measure the unchanged original stance through its geometry-only owner. */
  private measureStance(): void {
    const stance: LabStance.Result = LabStance.measure(this.person, this.basePose, this.guardOutput);
    this.patches = stance.patches; this.pivotStarts = stance.pivotStarts;
    this.plantarPoints.left = stance.plantarPoints.left; this.plantarPoints.right = stance.plantarPoints.right;
    if (!this.grounding) this.grounding = AutoMovieHumanGrounding.prepare(this.person.evaluate, stance.vertices);
    this.capturePlanner();
  }

  /** Freeze the current same-body frame without retaining later mutable actor state. */
  private capturePlanner(): void { this.supportPlanner = LabActorSupport.planner(this.person.evaluate, this.person.neutral, this.guardOutput, this.origin.toArray(), this.yaw, [...this.plantarPoints.left, ...this.plantarPoints.right], (cost: LabActorSupport.PlanningCost): void => { this.supportPlanning.calls++; this.supportPlanning.milliseconds += cost.milliseconds; this.supportPlanning.iterations += cost.iterations; this.supportPlanning.last = { ...cost }; this.costs.supportPlanning = structuredClone(this.supportPlanning); }); }

  /** Current rigid attachments decide the full-cloud query's lifetime. */
  private refreshSurface(): void { if (this.cloudRevision === this.person.geometryRevision) return; this.surfacePoints = LabActorSupport.cloud(this.person); this.bodyGrounding = AutoMovieHumanGrounding.prepare(this.person.evaluate, this.surfacePoints); this.cloudRevision = this.person.geometryRevision; }

  /**
   * Measure technique inputs from this actor's real guard and neutral anatomy.
   *
   * @evidence contracts/common.md#implementation-and-ownership Reads public FK endpoints and actual glove transform and scale; no nominal arm reach or detached glove replaces them.
   * @evidence contracts/common.md#authoring-interface Return is an owned actor-local geometry record for the selected anatomical side; missing actual bones refuse.
   */
  public context(side: MotionAction.Side, target: MotionAction.Vec3): MotionAction.Context {
    return LabActorSupport.context(this.person, this.basePose, this.guardOutput, this.origin.toArray(), this.yaw, this.plantarPoints, this.patches, this.supportPlanner, side, target);
  }

  /**
   * Read an owned baseline landmark without repeating anatomical preparation or FK.
   * @evidence contracts/common.md#implementation-and-ownership Reads this actor's latest reset guard snapshot and copies its tuple; no live actor or another actor's output is returned by reference.
   * @evidence contracts/common.md#authoring-interface Bone identity is canonical and coordinates are baseline body-frame metres before the scene root. Reset replaces this baseline consistently with the actor's support witnesses.
   */
  public basePoint(bone: AutoMovieHumanRigControls.Joint): MotionAction.Vec3 {
    return LabActorSupport.basePoint(this.guardOutput, bone);
  }

  /**
   * Copy every emitted original vertex carried by the selected foot subtree.
   * @evidence contracts/common.md#implementation-and-ownership Returns the same complete bone-local point population prepared for whole-foot Grounding, including actual independently bound toe meshes. No reduced proxy, floor offset or actor-specific shared geometry cache is substituted.
   * @evidence contracts/common.md#authoring-interface Anatomical side selects this actor's immutable source geometry. The result and all tuples are caller-owned, so technique-side public FK measurements cannot mutate this actor's full-floor evidence.
   */
  public footPoints(side: MotionAction.Side): AutoMovieHumanSupportFrame.IPoint[] { return structuredClone(this.plantarPoints[side]); }

  /** Original WORLD support tasks without requiring striking equipment or an arm context.
   * @evidence contracts/common.md#implementation-and-ownership Reuses the same original FK/foot population and target constructor as the actor's actual fitting host.
   * @evidence contracts/common.md#authoring-interface Returns detached WORLD targets, with original carrier and actual vertex admission; equipment is irrelevant to support.
   */
  public supportGoals(patch: MotionAction.Immutable<MotionAction.SupportPatch>): AutoMovieHumanClinicalIk.ITarget[] { return labSupportTargets(this.guardOutput, this.yaw, [...this.plantarPoints.left, ...this.plantarPoints.right], patch); }

  /** Nonmutating support preparation from this immutable stance, usable without gloves.
   * @evidence contracts/common.md#implementation-and-ownership Calls the same captured original-foot planner exposed to action contexts, retaining raw native outcome and measured bounded work.
   * @evidence contracts/common.md#authoring-interface Input WORLD support goals remain unchanged and the returned realized pose/root is detached; source support is independently admitted by the final consumer.
   */
  public planSupport(plan: MotionAction.BodyPlacement): MotionAction.BodyPlacement { return this.supportPlanner(plan); }

  /** Copy actual rigid surface vertices, including equipment/current face.
   * @evidence contracts/common.md#implementation-and-ownership Copies the captured actual bone-bound polygon/equipment population rather than a reduced collision proxy.
   * @evidence contracts/common.md#authoring-interface Bone omission returns the complete current cloud in carrier-local metres; a face population revision invalidates the retained cloud before this read.
   */
  public bodyPoints(bone?: AutoMovieHumanRigControls.Joint): LabActorSupport.Cloud { this.refreshSurface(); return structuredClone(bone === undefined ? this.surfacePoints : this.surfacePoints.filter((point: AutoMovieHumanSupportFrame.IPoint): boolean => point.bone === bone)); }

  /**
   * Retain a reversible state boundary for this same independently owned actor.
   * @evidence contracts/common.md#implementation-and-ownership Captures the actor's owned baseline, requested/applied pose, root, plantar metadata, solver diagnostics and cache counters. Restoring reapplies the original real bone graph without constructing another actor or recalibrating anatomy. Retained records are never modified in place except the explicitly copied arrays and counters.
   * @evidence contracts/common.md#authoring-interface The returned synchronous restore belongs to this actor's lifetime and is used for an atomic apply or pooled case replacement. It restores display identity and goals together; callers retain failed-attempt evidence separately before rollback.
   */
  public checkpoint(): () => void {
    const leadSide: MotionAction.Side = this.leadSide;
    const bodyPreparation: LabActor["bodyPreparation"] = this.bodyPreparation;
    const solverReason: LabActor["solverReason"] = this.solverReason;
    const supportPlanner: LabActor["supportPlanner"] = this.supportPlanner;
    const surface: { points: LabActor["surfacePoints"]; grounding: LabActor["bodyGrounding"] } = { points: this.surfacePoints, grounding: this.bodyGrounding };
    const state: { basePose: IAutoMovieHumanPose; pose: IAutoMovieHumanPose; origin: MotionAction.Vec3; yaw: number; position: MotionAction.Vec3; rotation: [number, number, number, number]; patches: LabActor["patches"]; pivotStarts: LabActor["pivotStarts"]; guardOutput: AutoMovieHumanSkeleton.IOutput; plantar: LabActor["plantarPoints"]; support: LabActor["support"]; sample: LabActor["sample"]; errors: LabActor["errors"]; guardErrors: number[]; loadChecks: LabActor["loadChecks"]; solverStatus: LabActor["solverStatus"]; worldTargets: LabActor["worldTargets"]; requestedRoot: LabActor["requestedRoot"]; supportTargets: LabActor["supportTargets"]; fitPlan: LabActor["fitPlan"]; hardGoalMapping: LabActor["hardGoalMapping"]; failedAttempt: LabActor["failedAttempt"]; construction: LabActor["construction"]; costs: LabActor["costs"] } = {
      basePose: this.basePose, pose: this.pose, origin: this.origin.toArray(), yaw: this.yaw, position: this.person.object.position.toArray(), rotation: this.person.object.quaternion.toArray(), patches: this.patches, pivotStarts: this.pivotStarts, guardOutput: this.guardOutput, plantar: { ...this.plantarPoints }, support: this.support, sample: this.sample, errors: structuredClone(this.errors), guardErrors: this.guardErrors, loadChecks: this.loadChecks, solverStatus: this.solverStatus, worldTargets: this.worldTargets, requestedRoot: this.requestedRoot, supportTargets: this.supportTargets, fitPlan: this.fitPlan, hardGoalMapping: this.hardGoalMapping, failedAttempt: this.failedAttempt, construction: { ...this.construction }, costs: { ...this.costs },
    };
    return (): void => {
      this.leadSide = leadSide;
      this.bodyPreparation = bodyPreparation;
      this.solverReason = solverReason;
      this.supportPlanner = supportPlanner;
      this.surfacePoints = surface.points; this.bodyGrounding = surface.grounding;
      this.basePose = state.basePose; this.pose = state.pose; this.origin.set(...state.origin); this.yaw = state.yaw; this.patches = state.patches; this.pivotStarts = state.pivotStarts; this.guardOutput = state.guardOutput;
      this.plantarPoints.left = state.plantar.left; this.plantarPoints.right = state.plantar.right;
      this.support = state.support; this.sample = state.sample; this.errors.splice(0, this.errors.length, ...state.errors); this.guardErrors = state.guardErrors; this.loadChecks = state.loadChecks; this.solverStatus = state.solverStatus;
      this.worldTargets = state.worldTargets; this.requestedRoot = state.requestedRoot; this.supportTargets = state.supportTargets; this.fitPlan = state.fitPlan; this.hardGoalMapping = state.hardGoalMapping; this.failedAttempt = state.failedAttempt;
      Object.assign(this.construction, state.construction); this.costs = { ...state.costs };
      this.person.object.position.set(...state.position); this.person.object.quaternion.set(...state.rotation); this.person.pose(state.pose);
    };
  }

  /**
   * Apply module targets to actual articulated geometry and inspect exact support.
   *
   * @evidence contracts/common.md#implementation-and-ownership One public Grounding configuration simultaneously fits frozen world limb/frame/contact goals and every original foot vertex from the same authored clinical pose. Vertical root fitting is explicit; requested and applied roots remain separately observable, and a moved root never changes expected world targets. It never conditionally replaces a technique's leg seed.
   * @evidence contracts/common.md#authoring-interface Effectors map through the requested actor frame once. Priority is independent of support mode: an unloaded hard free frame is a trajectory, never certified ground support. Only target-ancestor arm/leg controls participate; the same authored toe articulation remains fixed while every original foot vertex still participates in floor inspection. Actual unresolved outcomes retain unchanged .25mm hard-target and 1µm floor limits; authored preserved controls remain fixed.
   */
  public apply(sample: MotionAction.Sample): void { this.applyStage(sample); }

  /**
   * Realize original support tasks before arm authoring uses the actual body.
   * @evidence contracts/common.md#implementation-and-ownership One public body solve retains original support and explicit non-arm leg tasks, freezing their WORLD goals before permitted root fitting. Only an admitted body returns; failure preserves raw observations and restores the previous actor atomically.
   * @evidence contracts/common.md#authoring-interface Returns a detached realized pose/root with original support and retained leg-goal authority. Subsequent arm consumption verifies those same WORLD goals around the realized root; achieved leg points never become replacement targets.
   */
  public prepareBody(plan: MotionAction.BodyPlacement, bodyEffectors: readonly MotionAction.Effector[] = []): MotionAction.BodyPlacement {
    const restore: () => void = this.checkpoint();
    const request: MotionAction.Sample = LabActorSupport.bodyRequest(LabBodyStage.sample(plan, bodyEffectors), this.person.neutral);
    try {
      this.applyStage(request); this.bodyPreparation = { requested: MotionAction.snapshotBodyPlacement(plan), bodyTasks: request.effectors.map((effector: MotionAction.Effector, index: number): LabActorSupport.BodyTask => ({ effector: structuredClone(effector), world: [...this.worldTargets[index]!.position] })), observation: structuredClone({ requestedRoot: this.requestedRoot, appliedRoot: this.person.object.position.toArray(), support: this.support, rawJointSolverStatus: this.solverStatus, rawJointSolverReason: this.solverReason, loadedGround: this.loadChecks, hardGoalMapping: this.hardGoalMapping, fittingPlan: this.fitPlan, cpuCosts: this.costs }) };
      if (this.support?.status !== "admitted") throw this.failure("body", new Error(`Body support is unresolved: ${this.support?.reason}, hard ${this.support?.supportError}, floor ${this.support?.floorMinimum}`));
      const realized: MotionAction.BodyPlacement = MotionAction.snapshotBodyPlacement({ pose: this.pose, rootOffset: this.person.object.position.clone().sub(this.origin).applyAxisAngle(new THREE.Vector3(0, 1, 0), -this.yaw).toArray(), rootRotation: request.rootRotation, preservedChannels: request.preservedChannels, support: request.support });
      this.bodyPreparation.realized = realized; return MotionAction.snapshotBodyPlacement(realized);
    } catch (error: unknown) { const observed: object = this.inspect(); const failure: Error = LabFailure.error("body-preparation", error, observed); restore(); this.failedAttempt = { message: failure.message, request, observed }; throw failure; }
  }

  /**
   * Fit the independently authored arm while holding its realized body and root fixed.
   * @evidence contracts/common.md#implementation-and-ownership Only target-side shoulder controls participate; the realized lower body, trunk and root are copied unchanged. Original raw support points, full-foot floor and every loaded foot are still inspected in the final native configuration.
   * @evidence contracts/common.md#authoring-interface Consumes the same placement returned before arm authoring. It cannot improve an arm task by moving the body or replacing the original world aim, and unresolved final results remain explicit.
   */
  public applyArm(sample: MotionAction.Sample, placement: MotionAction.BodyPlacement, side: MotionAction.Side, channels: readonly AutoMovieHumanRigControls.DegreeChannel[]): void {
    this.applyArms([{ sample, side, channels }], placement);
  }

  /**
   * Apply disjoint arms once while holding the single realized body and support fixed.
   * @evidence contracts/common.md#implementation-and-ownership Duplicate or foreign-side writers refuse before mutation. Both continuing arms share one arm-only native fit with fixed lower body/root and the original support plus retained leg WORLD goals. Source-fit and final native failures retain detached evidence before atomic rollback.
   * @evidence contracts/common.md#authoring-interface Placement must equal this actor's prepareBody result. Original leg tasks are inverse-transformed around that same realized root before merging; one or two arm writers retain independent tasks without whole-arms replacement or a second body fit.
   */
  public applyArms(writers: readonly LabArmWriter[], placement: MotionAction.BodyPlacement): void {
    if (!this.bodyPreparation?.realized || !LabPlacement.same(placement, this.bodyPreparation.realized)) throw new Error("Arm placement must equal this actor's prepared body snapshot");
    const merged: MotionAction.Sample = LabBodyStage.arms(writers, placement, LabActorSupport.retainedBodyEffectors(this.bodyPreparation.bodyTasks, placement, this.origin.toArray(), this.yaw));
    Reflect.set(merged, "armFits", writers.map((writer: LabArmWriter): object => ({ side: writer.side, fit: Reflect.get(writer.sample, "armFit") })));
    const restore: () => void = this.checkpoint();
    try {
      this.applyStage(merged, true, writers.flatMap((writer: LabArmWriter): AutoMovieHumanRigControls.DegreeChannel[] => [...writer.channels]));
      const sourceFailed: boolean = writers.some((writer: LabArmWriter): boolean => { const fit: unknown = Reflect.get(writer.sample, "armFit"); return fit !== undefined && typeof fit === "object" && fit !== null && Reflect.get(fit, "status") === "unresolved"; });
      if (sourceFailed || this.support?.status !== "admitted") throw new Error(sourceFailed ? "Source arm authoring is unresolved" : "Actual arm and shared support are unresolved");
    } catch (error: unknown) {
      const failure: Error = this.failure("arms", error);
      const observed: object = failure.cause as object;
      restore(); this.failedAttempt = { message: failure.message, request: merged, observed };
      throw failure;
    }
  }

  private applyStage(sample: MotionAction.Sample, armOnly: boolean = false, armChannels?: readonly AutoMovieHumanRigControls.DegreeChannel[]): void {
    const restore: () => void = this.checkpoint();
    try { this.fit(sample, armOnly, armChannels); this.failedAttempt = undefined; if (!armOnly) this.bodyPreparation = undefined; }
    catch (error: unknown) {
      const failure: NonNullable<LabActor["failedAttempt"]> = structuredClone({ message: error instanceof Error ? error.message : String(error), request: sample, plan: this.fitPlan, hardGoals: this.hardGoalMapping });
      const contextual: Error = this.failure(armOnly ? "arm-native" : "native", error);
      failure.observed = contextual.cause as object;
      restore(); this.failedAttempt = failure;
      throw contextual;
    }
  }

  /** Copy already computed solver and source evidence before any transaction is restored. */
  private failure(stage: string, error: unknown): Error {
    return LabFailure.error(stage, error, { id: this.id, request: this.sample, pose: this.pose, requestedRoot: this.requestedRoot, appliedRoot: this.person.object.position.toArray(), support: this.support, rawJointSolverStatus: this.solverStatus, rawJointSolverReason: this.solverReason, worldGoals: this.worldTargets, supportGoals: this.supportTargets, hardGoals: this.hardGoalMapping, fittingPlan: this.fitPlan, loadedGround: this.loadChecks, errors: this.errors, bodyPreparation: this.bodyPreparation, cpuCosts: this.costs });
  }

  private fit(sample: MotionAction.Sample, armOnly: boolean, armChannels?: readonly AutoMovieHumanRigControls.DegreeChannel[]): void {
    MotionAction.validateSupport(sample.support); MotionAction.validateRootRotation(sample.rootRotation);
    this.fitPlan = undefined; this.hardGoalMapping = undefined;
    this.sample = structuredClone(sample);
    this.errors.length = 0;
    const ikStarted: number = performance.now();
    const pose: IAutoMovieHumanPose = structuredClone(sample.pose);
    const root: AutoMovieHumanGrounding.IRoot = { translation: new THREE.Vector3(...sample.rootOffset).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw).add(this.origin).toArray(), rotation: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw).multiply(new THREE.Quaternion(...(sample.rootRotation ?? [0, 0, 0, 1]))).toArray() };
    this.requestedRoot = structuredClone(root);
    this.supportTargets = [];
    const patches: MotionAction.SupportPatch[] = sample.support.patches ?? (["left", "right"] as const).filter((side: MotionAction.Side): boolean => sample.support[side] > 0).map((side: MotionAction.Side): MotionAction.SupportPatch => this.patches[side].low);
    for (const patch of patches) { MotionAction.validateSupportFrame(patch); LabActorSupport.requireVertex(this.plantarPoints[patch.side], patch); }
    const contacts: MotionAction.GroundContact[] = sample.support.kind === "contacts" ? sample.support.contacts : [];
    for (const contact of contacts) LabActorSupport.requireVertex(this.surfacePoints, contact);
    const guided: MotionAction.SupportPoint[] = [...patches, ...contacts].filter((patch: MotionAction.SupportPoint): boolean => patch.mode !== "free" || patch.frameRotation !== undefined || MotionAction.supportConstraint(patch) === "hard");
    const retained: MotionAction.SupportPoint[] = guided.filter((patch: MotionAction.SupportPoint): boolean => MotionAction.supportConstraint(patch) === "hard");
    const preserved: Set<AutoMovieHumanRigControls.DegreeChannel> = new Set((sample.preservedChannels ?? []).map((channel: AutoMovieHumanRigControls.DegreeChannel): AutoMovieHumanRigControls.DegreeChannel => AutoMovieHumanRigControls.channel(channel)));
    if (preserved.size !== (sample.preservedChannels?.length ?? 0)) throw new Error("Preserved anatomical channels must be unique");
    for (const channel of preserved) {
      let selected: unknown = sample.pose;
      for (const segment of channel.split(".")) selected = selected !== null && typeof selected === "object" ? Reflect.get(selected, segment) : undefined;
      const value: unknown = selected ?? 0;
      const bounds: ReturnType<typeof AutoMovieHumanRigControls.bounds> = AutoMovieHumanRigControls.bounds(channel, sample.pose);
      if (typeof value !== "number" || !Number.isFinite(value) || value < bounds.minimum || value > bounds.maximum) throw new Error(`Preserved channel ${channel} must be a valid authored clinical value`);
    }
    this.fitPlan = LabFitPlan.select(sample, this.person.neutral, [...guided.map((patch: MotionAction.SupportPoint): string => patch.bone), ...sample.effectors.map((effector: MotionAction.Effector): string => effector.bone)]);
    if (armOnly) { const selected: AutoMovieHumanRigControls.DegreeChannel[] = [...new Set(armChannels ?? [])]; if (selected.some((channel: AutoMovieHumanRigControls.DegreeChannel): boolean => !this.fitPlan!.channels.includes(channel))) throw new Error("Declared arm channels contradict actual ancestry or preserved controls"); this.fitPlan = { ...this.fitPlan, channels: selected, budget: { ...this.fitPlan.budget, count: selected.length, rootAxes: [] } }; }
    const channels: AutoMovieHumanRigControls.DegreeChannel[] = this.fitPlan.channels;
    const general: boolean = sample.support.kind === "contacts" || sample.support.kind === "airborne";
    if ((!channels.length && !general) || channels.length > this.fitPlan.budget.maximum) throw new Error(`Grounding request rejected: selected ${channels.length} controls, allowed1..${this.fitPlan.budget.maximum}; ${JSON.stringify(this.fitPlan)}`);
    this.worldTargets = sample.effectors.map((effector: MotionAction.Effector): AutoMovieHumanClinicalIk.ITarget => ({ bone: effector.bone, localPoint: effector.localPoint, position: new THREE.Vector3(...effector.target).applyQuaternion(new THREE.Quaternion(...root.rotation)).add(new THREE.Vector3(...root.translation)).toArray() }));

    this.costs.ikMs = performance.now() - ikStarted;
    const groundingStarted: number = performance.now();
    {
      const frameTargets: (patch: MotionAction.SupportPoint) => AutoMovieHumanClinicalIk.ITarget[] = (patch: MotionAction.SupportPoint): AutoMovieHumanClinicalIk.ITarget[] => labSupportTargets(this.guardOutput, this.yaw, general ? this.surfacePoints : [...this.plantarPoints.left, ...this.plantarPoints.right], patch);
      const targets: AutoMovieHumanClinicalIk.ITarget[] = retained.flatMap(frameTargets);
      const softTargets: AutoMovieHumanClinicalIk.ITarget[] = guided.filter((patch: MotionAction.SupportPoint): boolean => MotionAction.supportConstraint(patch) === "soft").flatMap(frameTargets);
      this.supportTargets = structuredClone([...targets, ...softTargets]);
      this.worldTargets.forEach((target: AutoMovieHumanClinicalIk.ITarget, index: number): void => { if (sample.effectors[index]!.constraint === "soft") softTargets.push(target); else targets.push(target); });
      this.hardGoalMapping = LabFitPlan.hardTargets(targets);
      if ([...targets, ...softTargets].some((target: AutoMovieHumanClinicalIk.ITarget): boolean => target.position.length !== 3 || !Array.from(target.position).every(Number.isFinite) || target.localPoint !== undefined && (target.localPoint.length !== 3 || !Array.from(target.localPoint).every(Number.isFinite))) || !Array.from(root.translation).every(Number.isFinite)) throw new Error(`Grounding request rejected: nonfinite world goal/root; ${JSON.stringify(this.fitPlan)}`);
      if (general) { this.person.prepareFace(pose); this.refreshSurface(); }
      const fitter: AutoMovieHumanGrounding.IPrepared = general ? this.bodyGrounding : this.grounding;
      const request: AutoMovieHumanGrounding.IRequest = { targets: this.hardGoalMapping.targets, softTargets, channels, rootAxes: armOnly || sample.support.kind === "airborne" ? [] : ["y"], iterations: 16, tolerance: .00025, floorTolerance: .000001 };
      const original: AutoMovieHumanGrounding.IResult = fitter.inspect(pose, root, request);
      const supportGoals: AutoMovieHumanClinicalIk.ITarget[] = retained.flatMap(frameTargets);
      const supportMismatch: boolean = LabActorSupport.error(original.output, root, supportGoals) > .00025 || original.floorMinimum < -.000001;
      const seed: IAutoMovieHumanPose = armOnly || general || !supportMismatch ? pose : LabActorSupport.geometricSeed(this.person.evaluate, pose, root, supportGoals, sample.preservedChannels);
      this.support = sample.support.kind === "airborne" || !channels.length || original.status === "admitted" && !softTargets.length ? original : fitter(seed, root, request);
      this.pose = this.support.pose;
      this.person.object.position.set(...this.support.root.translation);
    }
    this.costs.groundingMs = performance.now() - groundingStarted;
    const poseStarted: number = performance.now();
    this.person.object.quaternion.set(...root.rotation);
    this.person.pose(this.pose);
    this.costs.poseAndMatricesMs = performance.now() - poseStarted;
    this.solverStatus = this.support?.status;
    this.solverReason = this.support?.reason;
    this.loadChecks = LabActorSupport.loads(this.person, sample.support, patches);
    if (this.support && (this.loadChecks.some((check: { grounded: boolean }): boolean => !check.grounded) || general && this.support.output.clamped.length > 0)) this.support = { ...this.support, status: "unresolved", reason: "constraints-violated" };
    sample.effectors.forEach((effector: MotionAction.Effector, index: number): void => {
      const actual: MotionAction.Vec3 = this.effector(effector);
      const target: MotionAction.Vec3 = [...this.worldTargets[index]!.position];
      const error: number = new THREE.Vector3(...target).distanceTo(new THREE.Vector3(...actual));
      this.errors.push({ bone: effector.bone, role: effector.role, constraint: effector.constraint ?? "hard", target, actual, error });
    });
  }

  /**
   * Actual world position of a requested bone-local effector after all fitting.
   * @evidence contracts/common.md#implementation-and-ownership Refreshes the original real bone group and transforms the retained local point through its actual current matrix.
   * @evidence contracts/common.md#authoring-interface Returns world metres; an absent actual drawn bone throws instead of falling back to a nominal target.
   */
  public effector(effector: MotionAction.Effector): MotionAction.Vec3 {
    return LabActorSupport.point(this.person, effector.bone, effector.localPoint ?? [0, 0, 0]);
  }

  /**
   * Exact fitted delivery state for contact-origin retraction, never the unreachable request.
   * @evidence contracts/common.md#implementation-and-ownership Copies the applied clinical pose/root and reads every achieved effector through the actual actor frame; no planned peak replaces the observed stop.
   * @evidence contracts/common.md#authoring-interface Requires an applied sample. The caller maps any composition origin once before supplying this owned action-local recovery state.
   */
  public constrained(): MotionAction.Sample {
    if (!this.sample) throw new Error("No actual sampled configuration");
    const support: MotionAction.Support = structuredClone(this.sample.support);
    support.patches = support.patches?.map((patch: MotionAction.SupportPatch): MotionAction.SupportPatch => LabActorSupport.stopped(this.person, this.guardOutput, this.yaw, patch));
    if (support.kind === "contacts") support.contacts = support.contacts.map((contact: MotionAction.GroundContact): MotionAction.GroundContact => LabActorSupport.stopped(this.person, this.guardOutput, this.yaw, contact));
    return LabClinicalWitnesses.capture(this.person, { ...structuredClone(this.sample), pose: structuredClone(this.pose), support, rootRotation: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -this.yaw).multiply(this.person.object.quaternion).toArray(), rootOffset: this.person.object.position.clone().sub(this.origin).applyAxisAngle(new THREE.Vector3(0, 1, 0), -this.yaw).toArray(), effectors: this.sample.effectors.map((effector: MotionAction.Effector): MotionAction.Effector => ({ ...effector, target: this.person.object.worldToLocal(new THREE.Vector3(...this.effector(effector))).toArray() })) });
  }

  /**
   * Actual world target converted once into this actor's fixed local frame.
   * @evidence contracts/common.md#implementation-and-ownership Subtracts only this independent root origin and applies its inverse fixed yaw; it reads no opposing placement.
   * @evidence contracts/common.md#authoring-interface Input is world metres and output is fixed actor-frame metres, before module root offsets.
   */
  public local(world: MotionAction.Vec3): MotionAction.Vec3 {
    return new THREE.Vector3(...world).sub(this.origin).applyAxisAngle(new THREE.Vector3(0, 1, 0), -this.yaw).toArray();
  }

  /**
   * Current exact displayed mesh; ownership stays with this actor.
   * @evidence contracts/common.md#implementation-and-ownership Looks up the original polygon registry by exact bone identity and refuses a missing part.
   * @evidence contracts/common.md#authoring-interface Returns a borrowed native mesh; callers may inspect it but must not dispose or independently reposition it.
   */
  public mesh(bone: string): THREE.Mesh {
    return LabActorSupport.mesh(this.person, bone);
  }

  /**
   * Current displayed glove, attached to the original Hand group.
   * @evidence contracts/common.md#implementation-and-ownership Retrieves the owned equipment mesh from the actual actor graph rather than constructing a collision-only substitute.
   * @evidence contracts/common.md#authoring-interface Side is anatomical; missing equipment throws and ownership remains with this actor.
   */
  public glove(side: MotionAction.Side): THREE.Mesh {
    return LabActorSupport.glove(this.person, side);
  }

  /**
   * Detached actual world triangles for public Engine collision inspection.
   * @evidence contracts/common.md#implementation-and-ownership Reuses the geometry-only actual-matrix snapshot helper, retaining complete original vertices and triangle indices.
   * @evidence contracts/common.md#authoring-interface Input stays borrowed and the returned world-metre mesh is owned by the caller; it certifies no unqueried surface or swept motion.
   */
  public worldMesh(mesh: THREE.Mesh): IAutoMovieMesh {
    let owner: THREE.Object3D | null = mesh;
    while (owner && owner !== this.person.object) owner = owner.parent;
    if (!owner) throw new Error(`Mesh ${mesh.name || mesh.uuid} does not belong to actor ${this.id}`);
    return displayedSurface.mesh(mesh);
  }

  /**
   * Actual displayed geometry, exact support diagnostics and fit requests.
   * @evidence contracts/common.md#implementation-and-ownership Reads the same real actor and joint solver output, original WORLD goals and separated preparation/fit costs. Four immutable baseline slots cover two leads across fighter/official equipment roles; a cached baseline grants no later admission.
   * @evidence contracts/common.md#authoring-interface Returns one detached owned snapshot, including pose, requests, errors, costs and construction records; later seeks or caller mutation cannot alter another snapshot or this actor. Measurements distinguish full-foot floor, hard/soft goals and unproved balance/force/continuous skin. Pose application includes internal FK and matrix cost together.
   */
  public inspect(): object {
    const authoredSeed: object | undefined = inspectLabSeed(this.person, this.sample, this.requestedRoot, this.guardOutput, this.hardGoalMapping?.rawTargets ?? [], this.plantarPoints);
    const hardGoalResiduals: object[] = LabActorSupport.goals(this.person, this.hardGoalMapping);
    const witnesses: object[] = LabActorSupport.witnesses(this.person, this.sample);
    return structuredClone({ bodyPreparation: this.bodyPreparation, clinicalWitnesses: LabClinicalWitnesses.inspect(this.person, this.sample), authoredSeed, id: this.id, objectUuid: this.person.object.uuid, identity: LabActorSupport.identity(this.role), geometry: inspectPersonGeometry(this.person), requested: this.sample, actualPose: this.pose, actualWorldGoals: this.worldTargets, requestedWorldSupportGoals: this.supportTargets, requestedRoot: this.requestedRoot, appliedRoot: this.person.object.position.toArray(), appliedRootRotation: this.person.object.quaternion.toArray(), rootDelta: this.requestedRoot ? this.person.object.position.clone().sub(new THREE.Vector3(...this.requestedRoot.translation)).toArray() : undefined, supportWitnesses: witnesses, loadedGround: this.loadChecks, rawJointSolverStatus: this.solverStatus, rawJointSolverReason: this.solverReason, support: this.support && { status: this.support.status, reason: this.support.reason, supportError: this.support.supportError, hardTargetsMeaning: "combined support and effectors, all in the same final configuration", softError: this.support.softError, floorMinimum: this.support.floorMinimum, iterations: this.support.iterations, activeBounds: this.support.activeBounds }, effectorErrors: this.errors, initialGuardErrors: this.guardErrors, fittingPlan: this.fitPlan, hardGoalMapping: this.hardGoalMapping, hardGoalResiduals, failedAttempt: this.failedAttempt, construction: this.construction, cpuCosts: this.costs, limitations: ["point support is not balance or force proof", "rigid polygon joint overlaps are not continuous skin", "standing adoption requires an upright root; tilted performances retain explicit sample rootRotation", "public pose application combines FK and internal matrix refresh; poseAndMatricesMs does not isolate those internal costs"] });
  }

  /**
   * Release this actor's equipment and original drawing exactly once at host retirement.
   * @evidence contracts/common.md#implementation-and-ownership Attempts every independently owned equipment and body disposer even after a prior failure, then reports all failures together.
   * @evidence contracts/common.md#authoring-interface This terminal operation removes only this actor; another actor, baseline data cache and external viewers remain untouched.
   */
  public dispose(): void {
    const failures: unknown[] = [];
    for (const dispose of [...this.equipment, (): void => { this.person.dispose(); }]) try { dispose(); } catch (error: unknown) { failures.push(error); }
    if (failures.length) throw new AggregateError(failures, "Laboratory actor disposal failed");
  }
}
