import { AutoMovieHumanRigControls } from "@automovie/human";
import * as THREE from "three";
import { ActionClock } from "../motion/core/ActionClock";
import { ActionVariation } from "../motion/core/ActionVariation";
import type { MotionAction } from "../motion/core/MotionAction";
import { DefenseMotion } from "../motion/defense/DefenseMotion";
import { FootworkMotion } from "../motion/defense/FootworkMotion";
import { ContactResponse } from "../motion/interaction/ContactResponse";
import { ContactTrace } from "../motion/interaction/ContactTrace";
import { RoundhouseAction } from "../motion/kick/RoundhouseAction";
import { PunchAction } from "../motion/punch/PunchAction";
import { PunchTiming } from "../motion/punch/PunchTiming";
import { PunchArm } from "../motion/punch/PunchArm";
import { displayedSurface } from "../displayedSurface";
import { LabActor } from "./LabActor";
import type { LabSettings } from "./LabSettings";
import { createLabApproach } from "./createLabApproach";
import { labFootworkSample } from "./labFootworkSample";
import { LabBodyStage } from "./LabBodyStage";
import type { LabFootworkStance } from "./LabFootworkStance";
import { labShinWitness } from "./labShinWitness";
import { labDefenseConfig } from "./labDefenseConfig";
import { LabFailure } from "./LabFailure";
import { labContactFrame } from "./labContactFrame";
import { LabActualMotion } from "./LabActualMotion";
import { LabSharedBody } from "./LabSharedBody";
import { LabPunchRecovery } from "./LabPunchRecovery";
import { LabReceiving } from "./LabReceiving";
import type { LabRecovery } from "./LabRecovery";
import { DefenseContinuation } from "../motion/defense/DefenseContinuation";

/**
 * Real reusable-module composition with a geometry-derived first-contact trace.
 *
 * @evidence contracts/common.md#implementation-and-ownership One action-local request drives either man through the same punch, kick or footwork definitions. Both actual articulated drawings are sampled before public Engine contact inspection. An observed stop feeds exact fitted states into recovery and independent normal compliance.
 * @evidence contracts/common.md#authoring-interface Settings describe a module case, never a film schedule. Timing sources and authored choices are explicit; finite mesh sampling, unresolved support and impact-force limits remain in inspect rather than becoming success labels.
 */
export class LabCase {
  /** Exact reproducible controls adopted for this case. */
  public readonly settings: LabSettings;
  /** Independently owned actors, indexed only at composition. */
  public readonly actors: Record<"a" | "b", LabActor>;
  /** A Viewer pool borrows actors; standalone portable cases own their instances. */
  private readonly ownsActors: boolean;
  /** Caller namespace for independent trace stages; absent retains laboratory identities. */
  private readonly tracePrefix: string | undefined;
  /** Local display duration, including all nominal recovery and compliance. */
  public duration: number = 1;
  /** A refused configuration remains visible, inspectable and selectable instead of deleting its actors. */
  public admissionError: string | null = null;
  /** Actual finite collision inspection; absent for a footwork-only exercise. */
  public trace: ContactTrace.Result | undefined;
  /** Same immutable punch instance used by this case's body, arm and contact clocks. */
  public readonly punchAction: PunchAction.Instance | undefined;
  /** Separate actual full-surface entry clearance, with no permitted impacts. */
  private entryInspection: ContactTrace.Result | undefined;
  /** Actual full-surface clearance while the receiver establishes its check. */
  private readyInspection: ContactTrace.Result | undefined;
  /** Actual attacking and receiving men for this independent placement. */
  private readonly attacker: LabActor;
  /** Receiver never follows the attacker's root as a pair. */
  private readonly receiver: LabActor;
  /** One independent locally timed technique placement. */
  private request!: MotionAction.Request;
  /** Variation-resolved timings consumed by the real technique. */
  private timing!: MotionAction.Timing;
  /** Actual measured guard/target geometry for the active actor. */
  private context!: MotionAction.Context;
  /** Original world aim fixed before entry or independent receiving motion. */
  private originalWorldAim: MotionAction.Vec3 | undefined;
  /** Same definition dispatch used by trace, seek and playback. */
  private attack!: (seconds: number, context: MotionAction.Context, placement?: MotionAction.BodyPlacement, bodyResponse?: Readonly<MotionAction.Vec3>) => MotionAction.Sample;
  /** Punches realize support before the arm receives its actual body frame. */
  private planBody: ((seconds: number, context: MotionAction.Context, bodyResponse?: Readonly<MotionAction.Vec3>) => MotionAction.BodyPlacement) | undefined;
  /** Exact source-owned eligible arm controls, unchanged by the host stage. */
  private armChannels: readonly AutoMovieHumanRigControls.DegreeChannel[] = [];
  /** Actual first-contact pose/root plus original recovery support tasks and separate observed support. */
  private stopped: { attacker: MotionAction.ContactState; receiver: MotionAction.ContactState; observedSupport: Record<"attacker" | "receiver", MotionAction.Support> } | undefined;
  /** Receiving local-time action uses its own geometry and identity. */
  private defenseRequest!: MotionAction.Request;
  /** Fixed receiving witnesses measured from the actual guard drawing. */
  private defenseConfig!: DefenseMotion.Config;
  /** Actual source tangent for this receiver's independently timed next defense. */
  private defenseContinuation: DefenseContinuation | undefined;
  /** Borrowed outgoing arm clock, consumed by this receiver's single body. */
  private readonly receivingCarry: LabReceiving.Carry | undefined;
  /** Earlier released punch arms continue on this kick's single supported body. */ private readonly attackingCarry: LabReceiving.Carry | undefined;
  /** Detached actual entry evidence for both performers, in the unchanged actor frames. */
  private readonly entryMotion: { attacker: LabActualMotion.Measurement; receiver: LabActualMotion.Measurement } | undefined;
  /** Independent support sequence for the footwork-only exercise. */
  private readonly footwork: FootworkMotion | undefined;
  /** Last exact sampled action-local time. */
  private seconds: number = 0;
  /** Construction and collision preparation CPU cost, distinct from playback. */
  private preparationMs: number = 0;
  /** Exact current footwork phase, distinct from the laboratory's review-window clock. */
  private route: FootworkMotion.Sample | undefined;
  /** Explicit entry composition has its own local clock and independent sole route. */
  private entry: ReturnType<typeof createLabApproach> | undefined;
  /** Actual immutable entry source survives adoption of its fitted endpoint. */
  private entrySource: LabFootworkStance | undefined;
  /** Source frame shift applied only after its visible supported route has completed. */
  private entryOffset: MotionAction.Vec3 = [0, 0, 0];
  /** Seconds spent in actual entry, separate from technique-local phase times. */
  public entrySeconds: number = 0;
  /** Visible independent defensive preparation before a low-kick/check exchange. */
  public readySeconds: number = 0;
  /** Geometric range evidence is necessary but never sufficient for clinical or contact admission. */
  private reach: object | undefined;
  /** True only after a complete composition exists, including its original geometry. */
  private operational: boolean = false;
  /** Frozen actor baselines belong to this case, independently of later borrowed-case adoption. */
  private activate: (() => void) | undefined;
  /** Failed preparation evidence is separate from the restored displayed stance. */
  private failureSnapshot: object | undefined;
  /** A rejected seek never becomes the committed case clock. */
  private failedEvaluation: { seconds: number; message: string; actors: object[]; context: object } | undefined;

  /** Bind a real case; preserved entry borrows adopted actors, a caller-unique ID and optional explicit phase seconds. */
  public constructor(settings: LabSettings, actors?: Record<"a" | "b", LabActor>, options: { preserveEntry?: boolean; actionId?: string; timing?: MotionAction.Timing; defenseTiming?: MotionAction.Timing; receivingCarry?: LabReceiving.Carry; attackingCarry?: LabReceiving.Carry; entryMotion?: { attacker: LabActualMotion.Measurement; receiver: LabActualMotion.Measurement }; stopAt?: "last-clear" | "first-witness" } = {}) {
    const begun: number = performance.now();
    if (!["jab", "cross", "hook", "uppercut", "low-kick", "body-kick", "high-kick", "step"].includes(settings.action) || !["a", "b"].includes(settings.actor) || !["left", "right"].includes(settings.side) || !["guard", "body", "head", "leg", "miss"].includes(settings.target) || !["cover", "catch", "parry", "slip", "weave", "check", "none"].includes(settings.defense)) throw new Error("Unknown laboratory action, actor, side, target or defense");
    if (!Number.isFinite(settings.distance) || settings.distance < .4 || settings.distance > 2.5 || !Number.isFinite(settings.timingScale) || settings.timingScale < .25 || settings.timingScale > 3 || !Number.isFinite(settings.direction) || Math.abs(settings.direction) > 1) throw new Error("Invalid laboratory distance, timing scale or direction");
    if (options.preserveEntry && !actors) throw new Error("Preserved entry requires borrowed adopted actors");
    if (options.actionId !== undefined && (typeof options.actionId !== "string" || !options.actionId.trim())) throw new Error("An action ID must be a nonempty string");
    if ((options.timing || options.defenseTiming) && settings.action === "step") throw new Error("Footwork owns its explicit route phases rather than technique timing");
    if (options.entryMotion && (settings.entry || settings.action === "step")) throw new Error("Actual entry continuation requires a directly placed strike");
    if (options.entryMotion && settings.defense === "check") throw new Error("Actual entry continuation cannot wait through an independent check preparation");
    if (options.attackingCarry && (!settings.action.endsWith("kick") || !options.entryMotion || settings.entry)) throw new Error("Attacking arm carry requires an actual directly placed kick entry");
    this.tracePrefix = options.actionId;
    this.receivingCarry = options.receivingCarry ? Object.freeze({ port: options.receivingCarry.port, offsetSeconds: options.receivingCarry.offsetSeconds }) : undefined;
    this.attackingCarry = options.attackingCarry ? Object.freeze({ ...options.attackingCarry }) : undefined;
    this.entryMotion = options.entryMotion ? structuredClone(options.entryMotion) : undefined;
    this.settings = { ...structuredClone(settings), entry: settings.entry ?? false };
    const lead: MotionAction.Side = settings.action === "cross" ? opposite(settings.side) : settings.side;
    this.ownsActors = actors === undefined;
    this.actors = actors ?? { a: new LabActor("a", "a", -settings.distance / 2, 0, settings.actor === "a" ? lead : "left"), b: new LabActor("b", "b", settings.distance / 2, Math.PI, settings.actor === "b" ? lead : "left") };
    if (actors && !options.preserveEntry) { actors.a.reset(-settings.distance / 2, 0, settings.actor === "a" ? lead : "left"); actors.b.reset(settings.distance / 2, Math.PI, settings.actor === "b" ? lead : "left"); }
    this.attacker = this.actors[settings.actor];
    this.receiver = this.actors[settings.actor === "a" ? "b" : "a"];
    if (this.receivingCarry) LabReceiving.validate(this.receivingCarry, this.receiver.id);
    if (this.attackingCarry) LabReceiving.validate(this.attackingCarry, this.attacker.id);
    const restore: (() => void)[] = Object.values(this.actors).map((actor: LabActor): (() => void) => actor.checkpoint());
    let originalContext: MotionAction.Context | undefined;
    try {
      const nominal: MotionAction.Timing = options.timing ? structuredClone(options.timing) : this.defaultTiming();
      if (settings.action === "low-kick" && !["leg", "guard", "miss"].includes(settings.target)) throw new Error("A low kick requires leg, guard or explicit miss aim; body/head targets belong to their named kick families");
      this.request = { id: options.actionId ?? "laboratory-action", actorId: this.attacker.id, targetId: this.receiver.id, side: settings.side, leadSide: this.attacker.leadSide, direction: [1, 0, settings.direction], timing: nominal, variation: { seed: settings.seed, aimMetres: settings.aim, timingFraction: settings.timingVariation, amplitudeFraction: .03 } };

      // Entry clearance already names the receiver's anatomical side.
      this.defenseRequest = { ...structuredClone(this.request), id: options.actionId ? `${options.actionId}:defense` : "laboratory-defense", actorId: this.receiver.id, targetId: this.attacker.id, side: opposite(settings.side), leadSide: this.receiver.leadSide };
      const target: MotionAction.Vec3 = this.target();
      this.context = this.attacker.context(settings.side, target);
      originalContext = this.context;
      this.originalWorldAim = new THREE.Vector3(...target).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.attacker.yaw).add(this.attacker.origin).toArray();
      const kick: boolean = settings.action.endsWith("kick");
      if (kick) {
        const bone: string = `${settings.side}LowerLeg`;
        const shin: THREE.Mesh = this.attacker.mesh(bone);
        let knee: THREE.Vector3 = new THREE.Vector3(...this.attacker.person.point(bone));
        let ankle: THREE.Vector3 = new THREE.Vector3(...this.attacker.person.point(`${settings.side}Foot`));
        const worldTarget: THREE.Vector3 = new THREE.Vector3(...target).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.attacker.yaw).add(this.attacker.origin);
        let witness: ReturnType<typeof labShinWitness> = labShinWitness(shin, knee, ankle, worldTarget, .85);
        const other: MotionAction.Side = opposite(settings.side);
        const maximum: number = this.context.geometry.thighMetres! + knee.distanceTo(new THREE.Vector3(...witness.world));
        this.prepareEntry(this.context.geometry.hip!, maximum);
        knee = new THREE.Vector3(...this.attacker.person.point(bone));
        ankle = new THREE.Vector3(...this.attacker.person.point(`${settings.side}Foot`));
        witness = labShinWitness(shin, knee, ankle, worldTarget, .85);
        const initialSupport: MotionAction.Support = this.entryMotion ? structuredClone(this.entryMotion.attacker.entry.placement.support) as MotionAction.Support : { left: .5, right: .5, patches: [this.attacker.patches.left.low, this.attacker.patches.right.low] };
        const action: RoundhouseAction = new RoundhouseAction(this.request, { height: settings.action === "low-kick" ? "low" : settings.action === "body-kick" ? "body" : "high", kneePoint: this.attacker.local(knee.toArray()), kickingFoot: this.attacker.local(ankle.toArray()), shinPoint: this.attacker.local(witness.world), shinLocalPoint: witness.local, supportingFoot: this.attacker.local(this.attacker.person.point(`${other}Foot`)), supportPivot: this.attacker.patches[other].pivot, supportPivotStart: this.attacker.pivotStarts[other], initialSupport }, this.entryMotion ? LabActualMotion.kickEntry(this.entryMotion.attacker, this.context, ActionVariation.create(this.request).timing.preparation * .25) : undefined);
        this.reach = { ...action.reach(this.context), witness, originalRootDistance: settings.distance };
        this.timing = action.timing;
        this.attack = (seconds: number, context: MotionAction.Context): MotionAction.Sample => action.sample(context, seconds);
      } else if (settings.action === "step") {
        this.timing = nominal;
        const feet: Record<MotionAction.Side, MotionAction.Vec3> = { left: this.attacker.local(this.attacker.patches.left.low.world), right: this.attacker.local(this.attacker.patches.right.low.world) };
        const displacement: MotionAction.Vec3 = [.25, 0, settings.direction * .25];
        const projection: number = displacement[0] * (feet.left[0] - feet.right[0]) + displacement[2] * (feet.left[2] - feet.right[2]);
        this.footwork = new FootworkMotion(this.attacker.id, feet, [{ start: 0, unload: .08 * settings.timingScale, swing: .24 * settings.timingScale, load: .08 * settings.timingScale, follow: .24 * settings.timingScale, settle: .1 * settings.timingScale, first: projection >= 0 ? "left" : "right", displacement, clearance: .04, variation: this.request.variation }]);
        this.attack = (seconds: number): MotionAction.Sample => this.stepSample(seconds);
      } else {
        const original: PunchAction.Instance = PunchAction.create(settings.action as "jab" | "cross" | "hook" | "uppercut", this.request);
        const terminal: MotionAction.Vec3 = new THREE.Vector3(...this.context.target).add(new THREE.Vector3(...original.aimOffset)).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.attacker.yaw).add(this.attacker.origin).toArray();
        const action: PunchAction.Instance = this.entryMotion ? PunchAction.create(original.kind, this.request, LabActualMotion.punchEntry(this.entryMotion.attacker, settings.side, original.timing.preparation + original.timing.delivery, terminal)) : original;
        this.punchAction = action;
        this.armChannels = action.armChannels;
        this.prepareEntry(this.context.geometry.shoulder!, this.context.geometry.upperArmMetres! + this.context.geometry.forearmMetres! + this.context.geometry.gloveOffsetMetres!);
        this.reach = action.inspect(this.context);
        this.timing = action.timing;
        const body: LabSharedBody.Instance | undefined = this.entryMotion ? LabSharedBody.create(this.entryMotion.attacker, original, this.context) : undefined;
        this.planBody = (seconds: number, context: MotionAction.Context, bodyResponse?: Readonly<MotionAction.Vec3>): MotionAction.BodyPlacement => body ? body.sample(seconds, context.contact, bodyResponse) : action.planBody(seconds, context, bodyResponse);
        this.attack = (seconds: number, context: MotionAction.Context, placement?: MotionAction.BodyPlacement, bodyResponse?: Readonly<MotionAction.Vec3>): MotionAction.Sample => action.sample(seconds, context, placement, undefined, bodyResponse);
      }
      this.defenseRequest.timing = { ...this.timing, preparation: 0, delivery: Math.max(.08, this.timing.preparation + this.timing.delivery * .85), retraction: .18 * settings.timingScale, recovery: .1 * settings.timingScale };
      if (settings.defense === "check") {
        this.defenseRequest.timing = { preparation: .10 * settings.timingScale, delivery: .16 * settings.timingScale, contact: .04 * settings.timingScale, retraction: .20 * settings.timingScale, recovery: .10 * settings.timingScale };
      }
      if (options.defenseTiming) this.defenseRequest.timing = structuredClone(options.defenseTiming);
      const defenseTiming: MotionAction.Timing = ActionVariation.create(this.defenseRequest).timing;
      if (settings.defense === "check") {
        this.readySeconds = defenseTiming.preparation + defenseTiming.delivery;
      }
      this.defenseConfig = this.defenseGeometry();
      if (this.entryMotion) {
        const kind: DefenseMotion.Kind = settings.defense === "none" ? "guard" : settings.defense;
        const context: MotionAction.Context = this.receiver.context(this.defenseRequest.side, [0, 0, 0]);
        const canonical: DefenseMotion.Sample = DefenseMotion.sample(kind, this.defenseRequest, context, 0, this.defenseConfig);
        const resolved: MotionAction.Timing = ActionVariation.create(this.defenseRequest).timing;
        this.defenseContinuation = new DefenseContinuation(canonical, LabActualMotion.defenseEntry(this.entryMotion.receiver, canonical, context, this.defenseRequest.side, resolved.preparation + resolved.delivery));
      }
      this.duration = settings.action === "step" ? this.footwork!.duration : this.entrySeconds + this.readySeconds + Math.max(ActionClock.duration(this.timing), ActionClock.duration(this.defenseRequest.timing)) + .3;
      this.operational = true;
      if (settings.action !== "step") {
        if (this.entry?.admissionError) throw new Error(`Entry has no admitted actual corridor: ${this.entry.admissionError}`);
        if (this.readySeconds) this.readyInspection = ContactTrace.resolve({ actionId: this.tracePrefix ? `${this.tracePrefix}:check-ready` : "laboratory-check-ready", actorId: this.attacker.id, targetId: this.receiver.id, start: 0, end: this.readySeconds, stepSeconds: 1 / 60, refinementSteps: 8, maximumCaptures: 80, grazeCosine: .25, capture: (seconds: number): ContactTrace.Frame => {
          this.applyAttack(-1, this.context);
          LabReceiving.apply(this.receiver, this.defend(seconds, false, true), this.entrySeconds + seconds, this.receivingCarry);
          const sample: MotionAction.Sample = this.attacker.constrained(); sample.elapsed = seconds;
          const frame: ContactTrace.Frame = this.snapshot(sample);
          for (const surface of frame.attacks) surface.role = "clearance";
          return frame;
        } });
        this.trace = ContactTrace.resolve({ actionId: this.request.id, actorId: this.attacker.id, targetId: this.receiver.id, start: this.timing.preparation, end: this.timing.preparation + this.timing.delivery, stepSeconds: 1 / 60, refinementSteps: 8, maximumCaptures: 160, grazeCosine: .25, stopAt: options.stopAt, capture: (seconds: number): ContactTrace.Frame => this.capture(seconds) });
        if (this.trace.event && this.trace.constrainedSample) {
          this.capture(this.trace.event.time);
          // Contact geometry remains observed; its recovery keeps the original support requests.
          const receiving: MotionAction.Sample = this.receiver.constrained();
          this.stopped = { attacker: { event: this.trace.event, sample: { ...structuredClone(this.trace.constrainedSample), support: structuredClone(this.attacker.sample!.support) } }, receiver: { event: this.trace.event, sample: { ...receiving, support: structuredClone(this.receiver.sample!.support) } }, observedSupport: { attacker: structuredClone(this.trace.constrainedSample.support), receiver: structuredClone(receiving.support) } };
        }
      }
      this.evaluate(0);
      const entry: (() => void)[] = Object.values(this.actors).map((actor: LabActor): (() => void) => actor.checkpoint());
      this.activate = (): void => { for (const restoreEntry of entry) restoreEntry(); };
      this.preparationMs = performance.now() - begun;
    } catch (error: unknown) {
      this.operational = false;
      this.admissionError = error instanceof Error ? error.message : String(error);
      this.failureSnapshot = { actors: Object.values(this.actors).map((actor: LabActor): object => actor.inspect()), context: this.context && { frame: this.context.frame, target: this.context.target }, originalWorldAim: this.originalWorldAim, entry: this.entry, trace: this.trace, producerCause: error instanceof Error ? error.cause : undefined };
      for (const rollback of restore) rollback();
      if (originalContext) this.context = originalContext;
      this.preparationMs = performance.now() - begun;
    }
  }

  /**
   * Sample the same reusable definitions for trace, arbitrary seek or normal playback.
   *
   * @evidence contracts/common.md#implementation-and-ownership Contact feedback is immutable and sampled by local time; both normal compliance vectors are converted through their own roots before the same public actor fitter. No previous-frame integration or paired root rule participates.
   * @evidence contracts/common.md#authoring-interface Technique/contact clocks exclude entry and check preparation; an outgoing arm carry consumes the complete case clock in every prefix and strike sample. Precontact remains nominal, first contact begins from the retained actual state and misses create no reaction. Response gain is an authored displacement choice, not force or injury measurement.
   */
  public evaluate(seconds: number): void {
    if (!this.operational) throw new Error(`No action is loaded: ${this.admissionError ?? "preparation incomplete"}`);
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > this.duration) throw new Error("Case time must remain within its complete duration");
    const restore: (() => void)[] = Object.values(this.actors).map((actor: LabActor): (() => void) => actor.checkpoint());
    const route: FootworkMotion.Sample | undefined = this.route;
    try {
      this.activate?.();
      this.sampleAt(seconds);
      const unresolved: string[] = Object.values(this.actors).filter((actor: LabActor): boolean => actor.support?.status !== "admitted").map((actor: LabActor): string => `${actor.id}: ${actor.support?.reason ?? "no support result"}, hard ${actor.support?.supportError}m, floor ${actor.support?.floorMinimum}m`);
      if (unresolved.length) throw new Error(`Actual physical fit is unresolved at ${seconds}s: ${unresolved.join("; ")}`);
      this.seconds = seconds; this.failedEvaluation = undefined;
    }
    catch (error: unknown) {
      this.failedEvaluation = { seconds, message: error instanceof Error ? error.message : String(error), actors: Object.values(this.actors).map((actor: LabActor): object => actor.inspect()), context: { frame: this.context.frame, target: this.context.target } };
      for (const rollback of restore) rollback();
      this.route = route;
      throw LabFailure.error("evaluation", error, this.failedEvaluation);
    }
  }

  /**
   * Preserve actual case time and both actors around canonical tangent sampling.
   * @evidence contracts/common.md#implementation-and-ownership Reuses the same actor transaction boundaries and preserves route, failed evaluation and committed clock without a second fit or recalibration.
   * @evidence contracts/common.md#authoring-interface A synchronous restore belongs to this case lifetime. It never changes immutable action/contact bindings or converts failed observations into displayed states.
   */
  public checkpoint(): () => void {
    const restore: (() => void)[] = Object.values(this.actors).map((actor: LabActor): (() => void) => actor.checkpoint());
    const seconds: number = this.seconds;
    const route: FootworkMotion.Sample | undefined = this.route;
    const failed: LabCase["failedEvaluation"] = this.failedEvaluation;
    return (): void => { for (const rollback of restore) rollback(); this.seconds = seconds; this.route = route; this.failedEvaluation = failed; };
  }

  /**
   * Read the exact original action clock for shared picture and sound timing.
   * @evidence contracts/common.md#implementation-and-ownership Returns detached frozen phase values already fixed by the real action, with its entry/check prefix. It creates no second timing model or numerical solve.
   * @evidence contracts/common.md#authoring-interface startSeconds is case-local action zero and timing contains resolved phase seconds. Footwork has its own route clock and returns no strike entry.
   */
  public actionClocks(): readonly { actionId: string; startSeconds: number; timing: MotionAction.Timing }[] {
    if (!this.operational) throw new Error("No admitted action clock is available");
    return this.settings.action === "step" ? [] : Object.freeze([Object.freeze({ actionId: this.request.id, startSeconds: this.entrySeconds + this.readySeconds, timing: Object.freeze(structuredClone(this.timing)) })]);
  }

  /**
   * Borrow this exact punch's released clinical return for an opposing counter.
   * @evidence contracts/common.md#implementation-and-ownership Captures the existing immutable instance, original context and actual stop through the pure recovery adapter. The returned port performs no whole-actor restore and preserves original action/contact clocks.
   * @evidence contracts/common.md#authoring-interface Only admitted punch cases support this port. The new receiver must realize its own single body before requesting strictly post-release arm writers in its explicit consuming frame.
   */
  public recoveryPort(): LabRecovery {
    if (!this.operational || !this.punchAction) throw new Error("An admitted punch is required for an arm recovery port");
    return LabPunchRecovery.create([{ action: this.punchAction, context: this.context, contact: this.stopped?.attacker, startSeconds: this.entrySeconds + this.readySeconds }]);
  }

  /** Apply both independent actors inside the public atomic case-time boundary. */
  private sampleAt(seconds: number): void {
    if (this.entry?.route && seconds < this.entrySeconds) {
      this.route = this.entry.route.sample(seconds);
      this.attacker.apply(labFootworkSample(this.attacker, this.route, seconds, this.entrySeconds, this.entrySource));
      LabReceiving.apply(this.receiver, this.defend(-1, false), seconds, this.receivingCarry);
      return;
    }
    if (seconds < this.entrySeconds + this.readySeconds) {
      this.applyAttack(-1, this.context);
      LabReceiving.apply(this.receiver, this.defend(seconds - this.entrySeconds, false, true), seconds, this.receivingCarry);
      return;
    }
    const local: number = seconds - this.entrySeconds - this.readySeconds;
    const context: MotionAction.Context = { ...this.context, contact: this.stopped?.attacker };
    const receiving: MotionAction.Sample = this.defend(local, true);
    let displacement: MotionAction.Vec3 = [0, 0, 0];
    if (this.trace?.event && local >= this.trace.event.time) {
      const response: ContactResponse.Sample = ContactResponse.sample(this.trace, local - this.trace.event.time, { attackerSeconds: .18, receiverSeconds: .3, attackerGainSeconds: .003, bodyGainSeconds: .008, guardGainSeconds: .004, grazeFraction: .4, maximumMetres: .035 });
      displacement = response.attacker;
      addWorldOffset(receiving, response.receiver, this.receiver.yaw);
    }
    this.applyAttack(local, context, displacement);
    LabReceiving.apply(this.receiver, receiving, seconds, this.receivingCarry);
  }

  /**
   * Detached actual actor measurements and exact collision sampling conditions.
   * @evidence contracts/common.md#implementation-and-ownership Reports actual source input, separate entry/action clocks, geometric reach, both displayed bodies and all query participants/limits. Construction refusal restores the original actual stance and retains separate failed-preparation evidence. Failed evaluation restores both actors and leaves the committed case time unchanged.
   * @evidence contracts/common.md#authoring-interface Contact time is technique-local; add entrySeconds plus readySeconds for the Viewer clock. A finite trace or radial reach result never establishes whole-body CCD, force or continuous-viewing approval.
   */
  public inspect(): object {
    const clinicalArmWitnesses: PunchArm.Witness[] | undefined = ["jab", "cross", "hook", "uppercut"].includes(this.settings.action) && this.context && this.attacker.sample ? PunchArm.witnesses(this.context, this.attacker.sample.pose, this.settings.side) : undefined;
    return structuredClone({ defense: { request: this.defenseRequest, continuation: this.defenseContinuation?.inspect() }, entryMotion: this.entryMotion, clinicalArmWitnesses, operational: this.operational, failureSnapshot: this.failureSnapshot, failedEvaluation: this.failedEvaluation, seconds: this.seconds, actionSeconds: this.seconds - this.entrySeconds - this.readySeconds, ready: { duration: this.readySeconds, clearance: this.readyInspection, staging: "An independently prepared check is held across the original standing mid-thigh threat until attack clearance; .55 shaft fraction and prefix durations are authored choices" }, aim: this.context && { originalWorld: this.originalWorldAim, techniqueLocal: this.context.target, world: new THREE.Vector3(...this.context.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.context.frame?.yawRadians ?? this.attacker.yaw).add(new THREE.Vector3(...(this.context.frame?.origin ?? this.attacker.origin.toArray()))).toArray(), frame: this.context.frame }, admissionError: this.admissionError, request: this.request, resolvedTiming: this.settings.action === "step" ? null : this.timing, route: this.route, entry: { enabled: this.settings.entry, duration: this.entrySeconds, offset: this.entryOffset, reason: this.entry?.reason, attempts: this.entry?.attempts, clearance: this.entryInspection }, reach: this.reach, timingBasis: "PunchTiming owns the bag-study means. Lead-hook use adapts rear-hook data; uppercut arm is unspecified. These and the paired moving-target encounter are authored adaptations. Setup, dwell ceiling, settling, kick, defense and step defaults are authored. Footwork duration is variation-resolved.", trace: this.trace, preparationCpuMs: this.preparationMs, actors: { a: this.actors.a.inspect(), b: this.actors.b.inspect() }, stopped: this.stopped, limits: ["finite explicitly listed full-limb and receiver mesh sampling, not complete articulated CCD", "all original foot vertices checked; point support is not COM/balance proof", "kinematic compliance, no force simulation", "module playback has not been continuously watched or heard"] });
  }

  /**
   * Readable real phase/contact/support outcomes; none is a hardcoded success.
   * @evidence contracts/common.md#implementation-and-ownership Formats current actual case error, entry phase, collision result and joint residuals without converting requests into acceptance.
   * @evidence contracts/common.md#authoring-interface Contact times use the technique clock and support status is the finite combined solver outcome; a displayed failure remains inspectable.
   */
  public summary(): string {
    if (this.admissionError) return `${this.settings.action} · ${this.attacker.id}/${this.settings.side} → ${this.receiver.id} · ${this.attacker.sample?.phase ?? "idle"}\nMovement preview; this starting position has no verified exchange.\nOpen measurements to inspect the contact or support cause.`;
    if (this.seconds < this.entrySeconds) return `Supported entry · ${this.attacker.id} independent ${this.route?.phase ?? "stance"} · ${this.seconds.toFixed(3)} / ${this.entrySeconds.toFixed(3)} s\n${this.entry?.reason}`;
    if (this.seconds < this.entrySeconds + this.readySeconds) return `${this.receiver.id} prepares a supported shin check · ${this.receiver.sample?.phase ?? "guard"}\nThe attacker holds its independent guard; the original thigh aim remains fixed.`;
    return `${this.settings.action} · ${this.attacker.id}/${this.settings.side} → ${this.receiver.id} · ${this.attacker.sample?.phase ?? "uninitialized"}\nContact: ${this.trace?.outcome ?? "not applicable"}${this.trace?.event ? ` at ${this.trace.event.time.toFixed(4)} s (${this.trace.event.relation})` : ""} · Support A: ${this.actors.a.support?.status ?? "none"}, B: ${this.actors.b.support?.status ?? "none"}\nActual effector errors: ${this.attacker.errors.map((item: { bone: string; error: number }): string => `${item.bone} ${(item.error * 1000).toFixed(1)} mm`).join(", ")}`;
  }

  /**
   * Borrowed actor parents are added once by the laboratory scene owner.
   * @evidence contracts/common.md#implementation-and-ownership Returns the two actual separately owned polygon parents, including when a case was refused.
   * @evidence contracts/common.md#authoring-interface The host borrows these objects; this case retains their disposal responsibility.
   */
  public objects(): THREE.Group[] { return [this.actors.a.person.object, this.actors.b.person.object]; }

  /**
   * Retire only these independently owned actors and their equipment.
   * @evidence contracts/common.md#implementation-and-ownership Attempts both actor disposers and aggregates failures, so one failed retirement cannot leak the other actor by omission.
   * @evidence contracts/common.md#authoring-interface Terminal case cleanup does not stop a server or dispose external scene resources.
   */
  public dispose(): void {
    this.operational = false;
    this.activate = undefined;
    this.trace = undefined;
    this.entryInspection = undefined;
    this.readyInspection = undefined;
    this.stopped = undefined;
    if (!this.ownsActors) return;
    const failures: unknown[] = [];
    for (const actor of Object.values(this.actors)) try { actor.dispose(); } catch (error: unknown) { failures.push(error); }
    if (failures.length) throw new AggregateError(failures, "Laboratory pair disposal failed");
  }

  /** Explicit source-specific timing, with unmeasured phases labelled as staging. */
  private defaultTiming(): MotionAction.Timing {
    const kind: LabSettings["action"] = this.settings.action;
    const profile: PunchTiming.Measurement | undefined = kind === "jab" || kind === "cross" || kind === "hook" || kind === "uppercut" ? PunchTiming.measurement(kind) : undefined;
    const measured: [number, number] = profile ? [profile.delivery, profile.retraction] : [kind === "high-kick" ? .296 : .26, kind === "high-kick" ? .65 : .45];
    const scale: number = this.settings.timingScale;
    return { preparation: .08 * scale, delivery: measured[0] * scale, contact: .025 * scale, retraction: measured[1] * scale, recovery: .12 * scale };
  }

  /** Measured target on the actual receiver; miss deliberately retains the original un-evaded line. */
  private target(): MotionAction.Vec3 {
    const kind: LabSettings["target"] = this.settings.target;
    const mesh: THREE.Mesh = kind === "guard" ? this.receiver.glove(opposite(this.settings.side)) : this.receiver.mesh(kind === "body" ? "chest" : kind === "leg" ? `${opposite(this.settings.side)}UpperLeg` : "head");
    let from: THREE.Vector3 = new THREE.Vector3(...this.attacker.person.point(kind === "leg" ? `${this.settings.side}LowerLeg` : kind === "body" ? "chest" : "head"));
    if (kind === "leg") {
      const upper: THREE.Vector3 = new THREE.Vector3(...this.receiver.person.point(`${opposite(this.settings.side)}UpperLeg`));
      const knee: THREE.Vector3 = new THREE.Vector3(...this.receiver.person.point(`${opposite(this.settings.side)}LowerLeg`));
      const middle: THREE.Vector3 = upper.lerp(knee, .55);
      const outward: THREE.Vector3 = from.sub(middle); outward.y = 0;
      from = middle.add(outward.normalize().multiplyScalar(.2));
    }
    const world: THREE.Vector3 = displayedSurface.nearest(mesh, from);
    const local: MotionAction.Vec3 = this.attacker.local(world.toArray());
    local[2] += this.settings.direction * .12;
    return local;
  }

  /** Share original actor geometry with standalone defense without changing its tasks. */
  private defenseGeometry(): DefenseMotion.Config {
    return labDefenseConfig(this.receiver, this.defenseRequest, this.settings.defense, this.settings.target, this.readySeconds, this.settings.action.endsWith("kick") ? "kick" : "punch");
  }

  /** Actual receiver sample uses a separate identity, own guard and optional matched recovery. */
  private defend(seconds: number, feedback: boolean, checkPrefix: boolean = false): MotionAction.Sample {
    const kind: DefenseMotion.Kind = this.settings.target === "miss" ? "slip" : this.settings.defense === "none" || this.settings.action === "step" ? "guard" : this.settings.defense;
    const context: MotionAction.Context = this.receiver.context(this.defenseRequest.side, [0, 0, 0]);
    const config: DefenseMotion.Config = { ...this.defenseConfig };
    if (feedback && this.stopped && seconds >= this.stopped.receiver.event.time) {
      context.contact = this.stopped.receiver;
      config.contactElapsed = seconds - this.stopped.receiver.event.time;
    }
    const local: number = kind !== "check" || checkPrefix || seconds < 0 ? seconds : this.readySeconds + Math.max(0, seconds - ActionClock.duration(this.timing));
    return DefenseMotion.sample(kind, this.defenseRequest, context, local, config, this.defenseContinuation);
  }

  /** Capture actual fitted triangles, never nominal target proxies. */
  private capture(seconds: number): ContactTrace.Frame {
    this.applyAttack(seconds, this.context);
    LabReceiving.apply(this.receiver, this.defend(seconds, false), this.entrySeconds + this.readySeconds + seconds, this.receivingCarry);
    const constrained: MotionAction.Sample = this.attacker.constrained();
    return this.snapshot(constrained);
  }

  /** Share the unchanged full actual surface registry with overlapping action cases. */
  private snapshot(sample: MotionAction.Sample): ContactTrace.Frame {
    return labContactFrame(this.attacker, this.receiver, sample, this.settings, this.defenseRequest.side);
  }

  /** Apply support before punch authoring; all other modules retain their declared single-stage path. */
  private applyAttack(seconds: number, context: MotionAction.Context, displacement: MotionAction.Vec3 = [0, 0, 0]): void {
    if (!this.planBody) { const sample: MotionAction.Sample = this.attack(seconds, context); addWorldOffset(sample, displacement, this.attacker.yaw); if (this.attackingCarry) LabReceiving.attack(this.attacker, sample, seconds, this.attackingCarry); else this.attacker.apply(sample); return; }
    const response: MotionAction.Vec3 = new THREE.Vector3(...displacement).applyAxisAngle(new THREE.Vector3(0, 1, 0), -this.attacker.yaw).toArray();
    const planned: MotionAction.Sample = LabBodyStage.sample(this.planBody(seconds, context, response));
    const placement: MotionAction.BodyPlacement = this.attacker.prepareBody(planned);
    this.attacker.applyArm(this.attack(seconds, context, placement, response), placement, this.settings.side, this.armChannels);
  }

  /** Convert independent sole route goals into the shared real-bone sample contract. */
  private stepSample(seconds: number): MotionAction.Sample {
    const route: FootworkMotion.Sample = this.footwork!.sample(seconds);
    this.route = route;
    return labFootworkSample(this.attacker, route, seconds, this.footwork!.duration);
  }

  /** Bind range entry as visible independent steps; technique targets retain the same world aim. */
  private prepareEntry(point: MotionAction.Vec3, maximum: number): void {
    const worldAim: MotionAction.Vec3 = new THREE.Vector3(...this.context.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.attacker.yaw).add(this.attacker.origin).toArray();
    this.entrySource = { pose: structuredClone(this.attacker.basePose), origin: this.attacker.origin.toArray(), patches: { left: structuredClone(this.attacker.patches.left.low), right: structuredClone(this.attacker.patches.right.low) } };
    this.entry = createLabApproach(this.attacker, this.receiver, point, this.context.target, maximum, this.settings.timingScale, this.settings.entry!, (route: FootworkMotion): ContactTrace.Result => ContactTrace.resolve({ actionId: this.tracePrefix ? `${this.tracePrefix}:entry` : "laboratory-entry", actorId: this.attacker.id, targetId: this.receiver.id, start: 0, end: route.duration, stepSeconds: 1 / 30, refinementSteps: 8, maximumCaptures: Math.ceil(route.duration * 60) + 32, grazeCosine: .25, capture: (seconds: number): ContactTrace.Frame => {
      this.attacker.apply(labFootworkSample(this.attacker, route.sample(seconds), seconds, route.duration, this.entrySource));
      LabReceiving.apply(this.receiver, { pose: structuredClone(this.receiver.basePose), rootOffset: [0, 0, 0], support: { left: .5, right: .5, patches: [this.receiver.patches.left.low, this.receiver.patches.right.low] }, effectors: [], phase: "idle", elapsed: seconds, progress: 0 }, seconds, this.receivingCarry);
      if (this.attacker.support?.status !== "admitted" || this.receiver.support?.status !== "admitted") throw new Error(`Entry physical fit unresolved at ${seconds}s: attacker ${this.attacker.support?.supportError}m, receiver ${this.receiver.support?.supportError}m`);
      const frame: ContactTrace.Frame = this.snapshot(this.attacker.constrained());
      for (const surface of frame.attacks) surface.role = "clearance";
      return frame;
    } }));
    this.entryInspection = this.entry.inspection;
    this.entryOffset = this.entry.offset;
    this.entrySeconds = this.entry.route?.duration ?? 0;
    if (this.entry.route) {
      this.attacker.apply(labFootworkSample(this.attacker, this.entry.route.sample(this.entrySeconds), this.entrySeconds, this.entrySeconds, this.entrySource));
      this.attacker.adopt();
      this.context = this.attacker.context(this.settings.side, this.attacker.local(worldAim));
    }
  }
}

/**
 * Anatomical opposite, independent of actor identity or camera placement.
 */
function opposite(side: MotionAction.Side): MotionAction.Side { return side === "left" ? "right" : "left"; }

/**
 * Convert one world compliance vector through its own actor's fixed heading once.
 */
function addWorldOffset(sample: MotionAction.Sample, world: MotionAction.Vec3, yaw: number): void {
  const local: THREE.Vector3 = new THREE.Vector3(...world).applyAxisAngle(new THREE.Vector3(0, 1, 0), -yaw);
  sample.rootOffset[0] += local.x;
  sample.rootOffset[1] += local.y;
  sample.rootOffset[2] += local.z;
}


