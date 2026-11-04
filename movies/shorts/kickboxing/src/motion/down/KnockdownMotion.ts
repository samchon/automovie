import { Quaternion } from "@automovie/engine";
import { AutoMovieHumanRigControls, type AutoMovieHumanSkeleton, type AutoMovieHumanSupportFrame, type IAutoMovieHumanPose } from "@automovie/human";
import type { IAutoMovieQuaternion } from "@automovie/interface";
import { MotionAction } from "../core/MotionAction";
import { DownGrounding } from "./DownGrounding";

/**
 * Articulated loss of balance, supported side descent and an unsuccessful rise.
 *
 * @evidence contracts/common.md#implementation-and-ownership The immutable actual entry joins knee flexion, asymmetric hip folding, cervical protection and independently delayed trunk/arm settling. Original-surface rolling placement supplies ground requests; it never simulates unconsciousness or a carotid mechanism. Timings and joint amplitudes are staging decisions, not medical measurements. Film policy and count duration remain outside this module.
 * @evidence contracts/common.md#authoring-interface A matched actual incoming contact and complete original rigid surface are required. Public same-body FK validates native bounds. Local seconds start at the receiving event; the foreign attack timestamp is retained unchanged. Sampled kinematic rolling is not an impact-force, balance, containment or continuous collision proof.
 */
export class KnockdownMotion {
  /** Detached authoring metadata and borrowed same-body FK. */
  private readonly config: KnockdownMotion.Config;
  /** Owned exact actual entry; never replaced by a canonical guard. */
  private readonly entry: MotionAction.Sample;
  /** Geometry-derived canonical rolling placement. */
  private readonly ground: DownGrounding;
  /** Authored timing, copied before any callback is retained. */
  public readonly timing: Readonly<KnockdownMotion.Timing>;
  /** Entire local track, independent of any film clock. */
  public readonly duration: number;
  /** Stable receiving actor. */
  public readonly actorId: string;
  /** Actual attack receipt remains in its originating clock. */
  public readonly impact: MotionAction.Immutable<MotionAction.ContactEvent>;
  /** Exact rolling preparation cost; real host fitting/drawing remain separate stages. */
  public readonly preparation: DownGrounding["preparation"];

  /**
   * Build one immutable descent from the actual displayed impact configuration.
   * Copies identity, entry, event, optional measured rates and frame; public same-body FK remains borrowed. A single finite rolling track is prepared once, including held-pose cache reuse. Recipient mismatch, malformed world receipt, unordered timings, invalid native articulation or an ungrounded initial state throw before any live actor is changed.
   * Supply original complete rigid geometry and exact applied entry. Optional degree rates preserve supplied clinical entry tangents through the initial Hermite correction; omission explicitly leaves rate continuity unverified. The incoming impact can change momentum, but this authoring module does not calculate that impulse or claim root velocity continuity.
   */
  public constructor(config: KnockdownMotion.Config) {
    if (!config.actorId.trim() || config.impact.targetId !== config.actorId || config.impact.actorId === config.actorId || !config.impact.actionId.trim() || !Number.isFinite(config.impact.time) || ![config.impact.point, config.impact.normal].every((value: MotionAction.Vec3): boolean => value.length === 3 && value.every(Number.isFinite)) || Math.abs(Math.hypot(...config.impact.normal) - 1) > .000001)
      throw new Error("Knockdown requires the matched incoming actual contact and its unit WORLD normal");
    if (config.side !== "left" && config.side !== "right") throw new Error("Knockdown requires an anatomical descent side");
    this.actorId = config.actorId;
    this.config = { ...config, entry: structuredClone(config.entry), impact: structuredClone(config.impact), timing: config.timing ? { ...config.timing } : undefined, entryRates: config.entryRates ? structuredClone(config.entryRates) : undefined, context: { ...config.context, frame: structuredClone(config.context.frame) } };
    this.entry = structuredClone(config.entry);
    const impact: MotionAction.ContactEvent = structuredClone(config.impact);
    Object.freeze(impact.point); Object.freeze(impact.normal);
    this.impact = Object.freeze(impact);
    this.timing = Object.freeze({ buckling: .18, descent: .92, settle: .5, attemptStart: 8, attemptDuration: 2.4, ...config.timing });
    const timing: KnockdownMotion.Timing = this.timing;
    this.duration = config.duration ?? 30;
    if (!Object.values(timing).every((value: number): boolean => Number.isFinite(value) && value > 0) || !Number.isFinite(this.duration) || this.duration < timing.attemptStart + timing.attemptDuration || timing.attemptStart < timing.buckling + timing.descent + timing.settle)
      throw new Error("Knockdown requires positive ordered collapse, settling, attempted rise and final rest");
    MotionAction.validateSupport(this.entry.support);
    MotionAction.validateRootRotation(this.entry.rootRotation);
    if (!config.context.frame.origin.every(Number.isFinite) || !Number.isFinite(config.context.frame.yawRadians)) throw new Error("Knockdown needs the actual fixed actor frame");
    if (config.entryRates) {
      const paths: Set<AutoMovieHumanRigControls.DegreeChannel> = new Set();
      for (const rate of config.entryRates) {
        if (!AutoMovieHumanRigControls.isChannel(rate.channel) || paths.has(rate.channel) || !Number.isFinite(rate.degreesPerSecond)) throw new Error("Knockdown entry rates require unique finite canonical degrees per second");
        paths.add(rate.channel);
      }
    }
    this.ground = new DownGrounding({ points: config.context.points, evaluate: config.context.evaluatePose, shape: (seconds: number): DownGrounding.Shape => this.shape(seconds), duration: this.duration, floorY: config.context.floorY - config.context.frame.origin[1], entryRoot: [...this.entry.rootOffset], samplesPerSecond: config.samplesPerSecond ?? 60 });
    this.preparation = this.ground.preparation;
  }

  /**
   * Read one independently owned local-time request without integrating playback.
   *
   * @evidence contracts/common.md#implementation-and-ownership Clinical shape and rolling placement use the same clamped local time. The lowest original emitted vertex becomes a named instantaneous pivot with one normalized load-intent share. An unsupported head/neck minimum refuses instead of being relabeled as trunk or hidden by proxy shrinkage. All effectors are removed after impact, so no attack task survives into ground reaction.
   * @evidence contracts/common.md#authoring-interface Negative time returns the exact impact entry; zero preserves its pose/orientation. Requested contact WORLD coordinates use the actual fixed origin/heading exactly once. Stable material identities include their bone-local coordinate; these changing rolling witnesses do not claim one permanently planted anchor. The host independently checks complete-body floor and each original target.
   */
  public sample(seconds: number): KnockdownMotion.Sample {
    if (!Number.isFinite(seconds)) throw new Error("Knockdown time must be finite local seconds");
    if (seconds < 0) return { ...structuredClone(this.entry), downPhase: "impact", elapsed: seconds, contacts: [], canonicalStepSeconds: this.ground.stepSeconds };
    const time: number = Math.min(this.duration, seconds);
    const shape: DownGrounding.Shape = this.shape(time);
    const placement: DownGrounding.Placement = this.ground.sample(time);
    const ground: MotionAction.GroundContact = this.contact(placement);
    const downPhase: KnockdownMotion.Phase = time < this.timing.buckling ? "buckling" : time < this.timing.buckling + this.timing.descent ? "descent" : time < this.timing.buckling + this.timing.descent + this.timing.settle ? "settling" : time >= this.timing.attemptStart && time < this.timing.attemptStart + this.timing.attemptDuration ? "attempted-rise" : "resting";
    return { pose: shape.pose, rootRotation: [...shape.rootRotation], rootOffset: placement.rootOffset, support: { kind: "contacts", left: 0, right: 0, contacts: [ground] }, effectors: [], phase: seconds >= this.duration ? "complete" : "recovery", elapsed: seconds, progress: Math.min(1, time / this.duration), downPhase, contacts: [{ actorId: this.actorId, targetId: "floor", relation: ground.region, localSeconds: time, pointWorld: [...ground.world], materialId: ground.id }], canonicalStepSeconds: placement.canonicalStepSeconds };
  }

  /** Author linked limb folding before the trunk finishes its side rotation. */
  private shape(seconds: number): DownGrounding.Shape {
    const buckle: number = ease(seconds / this.timing.buckling);
    const descent: number = ease((seconds - this.timing.buckling) / this.timing.descent);
    const settle: number = ease((seconds - this.timing.buckling - this.timing.descent) / this.timing.settle);
    const attemptTime: number = (seconds - this.timing.attemptStart) / this.timing.attemptDuration;
    const attempt: number = attemptTime > 0 && attemptTime < 1 ? Math.sin(Math.PI * attemptTime) ** 4 : 0;
    const sign: number = this.config.side === "left" ? 1 : -1;
    const opposite: MotionAction.Side = this.config.side === "left" ? "right" : "left";
    const folded: IAutoMovieHumanPose = structuredClone(this.entry.pose);
    folded.legs = {
      left: { ...folded.legs?.left, hip: { flexion: 50, abduction: 8, rotation: 0 }, knee: { flexion: 112, rotation: 0 }, ankle: { dorsiflexion: -8 } },
      right: { ...folded.legs?.right, hip: { flexion: 36, abduction: 12, rotation: 0 }, knee: { flexion: 94, rotation: 0 }, ankle: { dorsiflexion: -12 } },
    };
    if (this.config.side === "right") [folded.legs.left, folded.legs.right] = [folded.legs.right, folded.legs.left];
    folded.spine = { thoracic: { flexion: 16, lateralFlexion: -sign * 4, rotation: sign * 5 }, lumbar: { flexion: 18, lateralFlexion: -sign * 5, rotation: 0 } };
    folded.neck = { ...folded.neck, cervical: { flexion: 12, lateralFlexion: 0, rotation: -sign * 4 }, atlantoOccipital: { flexion: 6 }, atlantoAxial: { rotation: 0 } };
    folded.pelvis = { tilt: 0, obliquity: 0, rotation: this.entry.pose.pelvis?.rotation ?? 0 };
    let pose: IAutoMovieHumanPose = AutoMovieHumanRigControls.blend(this.entry.pose, folded, buckle);
    const resting: IAutoMovieHumanPose = structuredClone(folded);
    resting.legs![this.config.side] = { ...resting.legs![this.config.side], hip: { flexion: 22, abduction: 8, rotation: 0 }, knee: { flexion: 54, rotation: 0 } };
    resting.legs![opposite] = { ...resting.legs![opposite], hip: { flexion: 42, abduction: 12, rotation: 0 }, knee: { flexion: 82, rotation: 0 } };
    resting.arms = {
      left: { ...resting.arms?.left, shoulder: { flexion: 48, abduction: 8, rotation: -10 }, elbow: { flexion: 72 }, forearm: { pronation: 35 }, wrist: { flexion: 0, radialDeviation: 0 } },
      right: { ...resting.arms?.right, shoulder: { flexion: 34, abduction: 12, rotation: -8 }, elbow: { flexion: 95 }, forearm: { pronation: 25 }, wrist: { flexion: 0, radialDeviation: 0 } },
    };
    if (this.config.side === "right") [resting.arms.left, resting.arms.right] = [resting.arms.right, resting.arms.left];
    pose = AutoMovieHumanRigControls.blend(pose, resting, descent);
    if (settle > 0) pose.spine = { thoracic: { flexion: 16 - settle * 3, lateralFlexion: -sign * 4, rotation: sign * (5 - settle * 2) }, lumbar: { flexion: 18 - settle * 4, lateralFlexion: -sign * 5, rotation: 0 } };
    if (attempt > 0) {
      pose.arms![opposite].elbow = { flexion: 95 - 35 * attempt };
      pose.spine!.lumbar!.flexion! += 12 * attempt;
      pose.legs![opposite].hip!.flexion! += 12 * attempt;
    }
    if (seconds < this.timing.buckling && this.config.entryRates) {
      const u: number = Math.max(0, seconds / this.timing.buckling);
      const tangent: number = (u ** 3 - 2 * u ** 2 + u) * this.timing.buckling;
      for (const rate of this.config.entryRates) set(pose, rate.channel, AutoMovieHumanRigControls.readApplied(pose, rate.channel, []) + tangent * rate.degreesPerSecond);
    }
    const roll: number = sign * (88 * descent + 2 * settle - 15 * attempt) * Math.PI / 180;
    const turn: IAutoMovieQuaternion = { x: Math.sin(roll / 2), y: 0, z: 0, w: Math.cos(roll / 2) };
    const initial: AutoMovieHumanRigControls.Rotation = this.entry.rootRotation ?? [0, 0, 0, 1];
    const rotation: IAutoMovieQuaternion = Quaternion.multiply({ x: initial[0], y: initial[1], z: initial[2], w: initial[3] }, turn);
    return { pose, rootRotation: [rotation.x, rotation.y, rotation.z, rotation.w] };
  }

  /** Preserve the true carrier identity when naming a supported surface. */
  private contact(placement: DownGrounding.Placement): MotionAction.GroundContact {
    const bone: AutoMovieHumanRigControls.Joint = placement.point.bone;
    const side: MotionAction.Side | undefined = bone.startsWith("left") ? "left" : bone.startsWith("right") ? "right" : undefined;
    let carrier: MotionAction.GroundCarrier;
    if (bone === "hips") carrier = { region: "hip", bone };
    else if (bone === "spine" || bone === "chest") carrier = { region: "trunk", bone };
    else if (side && bone === `${side}UpperLeg`) carrier = { region: "hip", side, bone: `${side}UpperLeg` };
    else if (side && bone === `${side}LowerLeg`) carrier = { region: "knee", side, bone: `${side}LowerLeg` };
    else if (side && bone === `${side}UpperArm`) carrier = { region: "shoulder", side, bone: `${side}UpperArm` };
    else if (side && bone === `${side}LowerArm`) carrier = { region: "forearm", side, bone: `${side}LowerArm` };
    else if (side && /(?:Foot|Subtalar|Midfoot|Hallux|Toe)/.test(bone)) carrier = { region: "foot", side, bone: bone as Extract<MotionAction.GroundCarrier, { region: "foot" }>["bone"] };
    else if (side && /(?:Hand|Thumb|Index|Middle|Ring|Little)/.test(bone)) carrier = { region: "hand", side, bone: bone as Extract<MotionAction.GroundCarrier, { region: "hand" }>["bone"] };
    else throw new Error(`Knockdown would support an unprotected or unrepresented body region: ${bone}`);
    const position: MotionAction.Vec3 = placement.position;
    const yaw: number = this.config.context.frame.yawRadians;
    const origin: MotionAction.Vec3 = this.config.context.frame.origin;
    const world: MotionAction.Vec3 = [origin[0] + Math.cos(yaw) * position[0] + Math.sin(yaw) * position[2], origin[1] + position[1], origin[2] - Math.sin(yaw) * position[0] + Math.cos(yaw) * position[2]];
    return { ...carrier, id: `${this.actorId}:floor:${bone}:${placement.point.localPoint.join(",")}`, share: 1, mode: "pivot", constraint: "hard", localPoint: [...placement.point.localPoint], world };
  }
}

/**
 * Explicit geometry, impact and local timing for one supported descent.
 */
export namespace KnockdownMotion {
  /**
   * Separate visible performance phases; no match result is implied.
   * @evidence contracts/common.md#implementation-and-ownership The closed sequence distinguishes knee folding, full-body descent, residual settling, rest and a failed rise rather than resetting to a standing pose.
   * @evidence contracts/common.md#authoring-interface These labels describe the module's local intervals, not an actual contact certificate, medical diagnosis or match result.
   */
  export type Phase = "impact" | "buckling" | "descent" | "settling" | "resting" | "attempted-rise";
  /**
   * Authored seconds; these are not athlete measurements.
   * @evidence contracts/common.md#implementation-and-ownership Positive collapse stages precede one separately placed failed-rise envelope, leaving its period and count policy outside one another.
   * @evidence contracts/common.md#authoring-interface Buckling/descent/settle and attemptDuration are durations; attemptStart is local onset. The attempt must follow settling and finish before the total track duration.
   */
  export interface Timing { /** Knee folding. */ buckling: number; /** Whole-body side descent. */ descent: number; /** Residual trunk settling. */ settle: number; /** Failed-rise onset. */ attemptStart: number; /** Failed-rise envelope. */ attemptDuration: number }
  /**
   * Borrowed actual geometry and independently fixed world frame.
   * @evidence contracts/common.md#implementation-and-ownership The exact original surface and same-body FK author an independent floor-compatible request. A consumer still verifies the displayed matrices and whole cloud, including supplied equipment; face replacement requires recapturing its source.
   * @evidence contracts/common.md#authoring-interface Points are rigid bone-local metres, origin and floorY are WORLD metres, yawRadians is fixed scene heading and evaluatePose consumes clinical Human units. No postsolve geometry or moving camera changes this context.
   */
  export interface Context { /** Same original Human public FK. */ evaluatePose: AutoMovieHumanSkeleton.PoseEvaluator; /** Complete original body and attached equipment vertices. */ points: readonly AutoMovieHumanSupportFrame.IPoint[]; /** Independently authored actor frame. */ frame: { origin: MotionAction.Vec3; yawRadians: number }; /** Fixed WORLD floor, metres. */ floorY: number }
  /**
   * Immutable impact entry and production-selected local durations.
   * @evidence contracts/common.md#implementation-and-ownership A matched externally observed event starts an independent receiving action. Entry and numerical metadata are detached while only the pure evaluator is borrowed. Optional actual clinical rates are Hermite entry tangents, not raw strike-target velocities; no unknown rate is represented as a measured zero.
   * @evidence contracts/common.md#authoring-interface Default duration is 30 seconds, with .18/.92/.5 second collapse stages and an 8-second attempt onset. Callers select anatomical fall side, explicit timing and 30..240Hz quadrature. Full motion, contact velocity, impact mechanics and visual acceptance remain separately inspected.
   */
  export interface Config { /** Receiving identity. */ actorId: string; /** Exact applied impact configuration. */ entry: MotionAction.Sample; /** Actual incoming contact, never inferred from timing. */ impact: MotionAction.ContactEvent; /** Falling own side. */ side: MotionAction.Side; /** Actual surface/FK. */ context: Context; /** Entire local duration, defaults to 30 s. */ duration?: number; /** Explicit authored local timing overrides. */ timing?: Partial<Timing>; /** Known actual clinical entry rates; omitted means rate continuity remains unverified. */ entryRates?: { channel: AutoMovieHumanRigControls.DegreeChannel; degreesPerSecond: number }[]; /** Fixed rolling quadrature, default 60 Hz. */ samplesPerSecond?: number }
  /**
   * Observable requested state; its contact is ground intent, never a new strike.
   * @evidence contracts/common.md#implementation-and-ownership Extends the existing sample with a local performance label, explicit floor participant relationship and quadrature spacing. No event claims a new hit or exempts collision inspection.
   * @evidence contracts/common.md#authoring-interface Contacts contain WORLD metre witnesses and receiver-local seconds, while materialId retains the emitting bone/vertex identity. Changing rolling pivots are not permanently planted points. The host admits the raw requested contacts independently.
   */
  export interface Sample extends MotionAction.Sample { /** Current performance unit. */ downPhase: Phase; /** Explicit floor participants and local time. */ contacts: { actorId: string; targetId: "floor"; relation: MotionAction.GroundCarrier["region"]; localSeconds: number; pointWorld: MotionAction.Vec3; materialId: string }[]; /** Finite quadrature spacing. */ canonicalStepSeconds: number }
}

/** Saturated zero-end-slope cubic for authored phase envelopes. */
function ease(value: number): number { const u: number = Math.max(0, Math.min(1, value)); return u * u * (3 - 2 * u); }

/** Change only the admitted canonical clinical leaf in an owned pose. */
function set(pose: IAutoMovieHumanPose, channel: AutoMovieHumanRigControls.DegreeChannel, value: number): void {
  const keys: string[] = channel.split(".");
  let object: Record<string, unknown> = pose as Record<string, unknown>;
  for (const key of keys.slice(0, -1)) { object[key] ??= {}; object = object[key] as Record<string, unknown>; }
  object[keys[keys.length - 1]!] = value;
}
