import { AutoMovieHumanRigControls, type AutoMovieHumanSkeleton, type IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";
import { MotionAction } from "../core/MotionAction";
import type { RoundhouseAction } from "./RoundhouseAction";

/**
 * Actual body and leg entry joins an unchanged original roundhouse preparation.
 * @evidence contracts/common.md#implementation-and-ownership A compact cubic correction removes actual clinical/root/load value and finite-rate discrepancies before the original first unload. Arms remain owned by their continuing writers. Original WORLD support and sole tasks, strike endpoint and action/contact clocks never change; no solver or geometry is introduced.
 * @evidence contracts/common.md#authoring-interface Requires standing actual entry in the same fixed actor frame, complete applied body/leg/toe rates and explicit h/h2 provenance. The two original canonical samples establish the nominal initial finite tangent. This source bridge does not prove fitted C1, balance or contact; the real host retains its full native admission.
 */
export class RoundhouseContinuation {
  /** Detached actual boundary; later caller mutation cannot retarget this placement. */
  private readonly entry: RoundhouseContinuation.Entry;
  /** Exact original zero-time source configuration and its finite forward tangent sample. */
  private readonly canonical: [RoundhouseAction.Sample, RoundhouseAction.Sample];

  /**
   * Admit actual values/rates without taking ownership of either continuing arm.
   * Requires complete existing public body/leg/toe channels, unchanged standing support anchors and fixed root orientation. Each own array slot must contain one finite rate; unknown, duplicate, foreign or missing channels refuse before retention. Original nominal preparation samples remain detached from achieved consumer geometry.
   * first is at local zero and next at provenance.h2 inside the correction window. Entry root rates use actor-fixed metres/second and radians/second. Nonzero angular root motion is explicitly unsupported rather than discarded.
   */
  public constructor(first: RoundhouseAction.Sample, next: RoundhouseAction.Sample, source: RoundhouseContinuation.Entry) {
    const h: number = source.provenance.h2;
    if (first.elapsed !== 0 || next.elapsed !== h || !Number.isFinite(source.windowSeconds) || source.windowSeconds <= h || !Number.isFinite(source.provenance.h) || source.provenance.h <= 0 || Math.abs(h * 2 - source.provenance.h) > 1e-12 || !["before", "after"].includes(source.provenance.oneSided) || !source.provenance.contactBranch.trim()) throw new Error("Roundhouse entry requires canonical zero/h2, a positive window and actual one-sided provenance");
    for (const support of [source.sample.support, first.support]) { MotionAction.validateSupport(support); if (support.kind === "airborne" || support.kind === "contacts") throw new Error("Roundhouse entry requires standing foot support"); }
    for (const rotation of [source.sample.rootRotation, first.rootRotation]) MotionAction.validateRootRotation(rotation);
    const actual: readonly number[] = source.sample.rootRotation ?? [0, 0, 0, 1];
    const original: readonly number[] = first.rootRotation ?? [0, 0, 0, 1];
    if (!finite(source.rootVelocity) || !finite(source.rootAngularVelocity) || !finite(source.sample.rootOffset) || !finite(first.rootOffset) || Math.hypot(...source.rootAngularVelocity) > 1e-8 || Math.min(...[1, -1].map((sign: number): number => Math.hypot(...actual.map((value: number, index: number): number => value - sign * original[index]!)))) > 1e-10) throw new Error("Roundhouse entry requires the same fixed orientation and known finite root rates");
    const required: AutoMovieHumanRigControls.DegreeChannel[] = RoundhouseContinuation.channels();
    const remaining: Set<AutoMovieHumanRigControls.DegreeChannel> = new Set(required);
    if (!Array.isArray(source.channelRates) || source.channelRates.length !== required.length) throw new Error("Roundhouse entry requires each applied body/leg/toe rate exactly once, without arms");

    // Indexed own-slot admission cannot skip a hole or borrow an inherited rate.
    for (let index: number = 0; index < required.length; index++) {
      const row: RoundhouseContinuation.Rate | undefined = source.channelRates[index];
      if (!Object.hasOwn(source.channelRates, index) || !row || typeof row !== "object" || !Number.isFinite(row.degreesPerSecond) || !remaining.delete(row.channel)) throw new Error("Roundhouse entry requires each applied body/leg/toe rate exactly once, without arms");
    }
    if (![source.loadRates.left, source.loadRates.right].every(Number.isFinite) || Math.abs(source.loadRates.left + source.loadRates.right) > 1e-8) throw new Error("Roundhouse entry requires finite complementary load-intent rates");
    for (const patch of source.sample.support.patches ?? []) {
      if (patch.mode === "free") continue;
      if (!(first.support.patches ?? []).some((candidate: MotionAction.SupportPatch): boolean => candidate.mode !== "free" && candidate.side === patch.side && candidate.bone === patch.bone && same(candidate.localPoint, patch.localPoint) && same(candidate.world, patch.world))) throw new Error("Roundhouse entry cannot replace an actual retained ground anchor");
    }
    this.entry = structuredClone(source);
    this.canonical = [structuredClone(first), structuredClone(next)];
  }

  /**
   * Preserve actual entry and rejoin the original source before its first unload.
   * @evidence contracts/common.md#implementation-and-ownership Cubic value/rate errors decay to exactly zero. Original external tasks are converted against the changed requested root so their WORLD points remain unchanged. Clinical witnesses are recomputed through the same public FK; arms, support patches and native limits remain untouched.
   * @evidence contracts/common.md#authoring-interface Local seconds and the original phase clock are retained. Beyond the finite window the original sample is returned verbatim by value. Out-of-range corrected clinical values or load shares refuse instead of clamping; final host fitting still independently verifies original WORLD goals and full geometry.
   */
  public apply(nominal: RoundhouseAction.Sample, seconds: number, evaluate: AutoMovieHumanSkeleton.PoseEvaluator): RoundhouseAction.Sample {
    if (!Number.isFinite(seconds) || seconds < 0 || nominal.elapsed !== seconds) throw new Error("Roundhouse continuation needs matching finite nonnegative local seconds");
    if (seconds >= this.entry.windowSeconds) return structuredClone(nominal);
    const [first, next]: [RoundhouseAction.Sample, RoundhouseAction.Sample] = this.canonical;
    const h: number = this.entry.provenance.h2;
    const u: number = seconds / this.entry.windowSeconds;
    const a: number = 1 - 3 * u ** 2 + 2 * u ** 3;
    const b: number = u - 2 * u ** 2 + u ** 3;
    const correction: (initial: number, zero: number, following: number, rate: number) => number = (initial: number, zero: number, following: number, rate: number): number => a * (initial - zero) + b * this.entry.windowSeconds * (rate - (following - zero) / h);
    const output: RoundhouseAction.Sample = structuredClone(nominal);
    for (const row of this.entry.channelRates) write(output.pose, row.channel, AutoMovieHumanRigControls.readApplied(output.pose, row.channel, []) + correction(AutoMovieHumanRigControls.readApplied(this.entry.sample.pose, row.channel, []), AutoMovieHumanRigControls.readApplied(first.pose, row.channel, []), AutoMovieHumanRigControls.readApplied(next.pose, row.channel, []), row.degreesPerSecond));
    for (const row of this.entry.channelRates) {
      const range: ReturnType<typeof AutoMovieHumanRigControls.bounds> = AutoMovieHumanRigControls.bounds(row.channel, output.pose);
      const value: number = AutoMovieHumanRigControls.readApplied(output.pose, row.channel, []);
      if (value < range.minimum || value > range.maximum) throw new Error(`Roundhouse entry exceeds native bounds at ${row.channel}`);
    }
    const root: MotionAction.Vec3 = [0, 1, 2].map((axis: number): number => correction(this.entry.sample.rootOffset[axis]!, first.rootOffset[axis]!, next.rootOffset[axis]!, this.entry.rootVelocity[axis]!)) as MotionAction.Vec3;
    for (const axis of [0, 1, 2] as const) output.rootOffset[axis] += root[axis];
    output.effectors = output.effectors.map((task: MotionAction.Effector): MotionAction.Effector => ({ ...task, target: task.target.map((value: number, axis: number): number => value - root[axis]!) as MotionAction.Vec3 }));
    if (output.support.kind === "contacts" || output.support.kind === "airborne") throw new Error("Roundhouse preparation changed its standing support variant");
    output.support.left += correction(this.entry.sample.support.left, first.support.left, next.support.left, this.entry.loadRates.left);
    output.support.right = 1 - output.support.left;
    if (output.support.left < 0 || output.support.right < 0 || !Number.isFinite(output.support.left)) throw new Error("Roundhouse entry load continuation is infeasible");
    if (output.diagnostics.clinical.length) {
      const actual: AutoMovieHumanSkeleton.IOutput = evaluate(output.pose);
      if (actual.clamped.some((row: AutoMovieHumanSkeleton.IClamp): boolean => this.entry.channelRates.some((rate: RoundhouseContinuation.Rate): boolean => rate.channel === row.path))) throw new Error("Roundhouse entry has an owned public clinical clamp", { cause: structuredClone(actual.clamped) });
      output.diagnostics.clinical = output.diagnostics.clinical.map((point: MotionAction.Effector): MotionAction.Effector => {
        const bone: AutoMovieHumanSkeleton.IPlacement | undefined = actual.posed.find((item: AutoMovieHumanSkeleton.IPlacement): boolean => item.bone === point.bone);
        if (!bone) throw new Error(`Roundhouse entry lost clinical carrier ${point.bone}`);
        return { ...point, target: new THREE.Vector3(...(point.localPoint ?? [0, 0, 0])).applyQuaternion(new THREE.Quaternion(...bone.rotation)).add(new THREE.Vector3(...bone.position)).toArray() };
      });
    }
    output.diagnostics.continuation = this.inspect();
    return output;
  }

  /**
   * Read actual finite-rate provenance and separately retained canonical planning work.
   * @evidence contracts/common.md#implementation-and-ownership Returns detached actual boundary data and the two original source planning reports already computed for nominal value/tangent. It performs no solve or resampling to produce diagnostics.
   * @evidence contracts/common.md#authoring-interface Canonical reports can each contain two existing bounded plant calls; they occur once per changed action/context cache, separately from current and unload/loaded endpoint planning. Rates remain secants and do not certify post-fit C1.
   */
  public inspect(): object { return structuredClone({ entry: this.entry, canonicalPlanning: this.canonical.map((sample: RoundhouseAction.Sample): object => ({ seconds: sample.elapsed, planting: sample.diagnostics.planting })), limits: "Finite source continuation; original native support, full-floor, actual tangent and moving-image admission remain independent" }); }
}

/**
 * Actual body/leg boundary, explicitly excluding continuing arm ownership.
 * Reuses public Human channels and existing MotionAction samples. Original effectors in sample are observational only; the original roundhouse independently retains its WORLD leg tasks.
 * The producer converts WORLD root rates into the same fixed actor heading once. Every body/leg/toe tangent, complementary scalar load rate and one-sided h/h2 provenance must be supplied from actual applied states.
 */
export namespace RoundhouseContinuation {
  /**
   * One known actual canonical degree tangent.
   * @evidence contracts/common.md#implementation-and-ownership Names an existing public body or leg channel; unknown and foreign rates refuse at construction.
   * @evidence contracts/common.md#authoring-interface degreesPerSecond is the actual applied finite estimate, including explicit stationary zero values.
   */
  export interface Rate { channel: AutoMovieHumanRigControls.DegreeChannel; degreesPerSecond: number }
  /**
   * Actual supported entry and measured fixed-time tangents.
   * @evidence contracts/common.md#implementation-and-ownership Keeps full actual pose for observation while the bridge owns only body/legs/root/load. Another arm writer retains its own original action clock and contact lifetime.
   * @evidence contracts/common.md#authoring-interface Root translation uses actor-fixed metres/second and angular velocity radians/second. windowSeconds ends before the first original unload; provenance records actual one-sided h/h2 and branch rather than playback deltas.
   */
  export interface Entry { sample: MotionAction.Sample; channelRates: Rate[]; rootVelocity: MotionAction.Vec3; rootAngularVelocity: MotionAction.Vec3; loadRates: { left: number; right: number }; provenance: { h: number; h2: number; oneSided: "before" | "after"; contactBranch: string }; windowSeconds: number }

  /**
   * Enumerate exactly the existing single-body and two-leg degree ownership.
   * @evidence contracts/common.md#implementation-and-ownership Public canonical chains provide pelvis, spine, neck, both legs and every toe; no arm channel is admitted or inferred from IK selection.
   * @evidence contracts/common.md#authoring-interface Returns a fresh unique list for the actual-rate producer and strict source admission. Finger, wrist and arm continuation remain separately owned.
   */
  export function channels(): AutoMovieHumanRigControls.DegreeChannel[] {
    const result: AutoMovieHumanRigControls.DegreeChannel[] = [...AutoMovieHumanRigControls.chain({ region: "pelvis" }), ...AutoMovieHumanRigControls.chain({ region: "spine" }), ...AutoMovieHumanRigControls.chain({ region: "neck" })];
    for (const side of ["left", "right"] as const) { result.push(...AutoMovieHumanRigControls.chain({ region: "leg", side })); for (const digit of ["hallux", "second", "third", "fourth", "fifth"] as const) result.push(...AutoMovieHumanRigControls.chain({ region: "toe", side, digit })); }
    return [...new Set(result)];
  }
}

/** Sparse or nonfinite triples cannot silently supply zero translation or rates. */
function finite(value: readonly number[]): boolean { return value.length === 3 && [0, 1, 2].every((axis: number): boolean => Number.isFinite(value[axis])); }
/** Anchor compatibility is geometric identity, not a solver tolerance exemption. */
function same(left: readonly number[], right: readonly number[]): boolean { return left.length === right.length && left.every((value: number, index: number): boolean => Math.abs(value - right[index]!) < 1e-10); }
/** Write one validated body/leg leaf while retaining every other actual region. */
function write(pose: IAutoMovieHumanPose, channel: AutoMovieHumanRigControls.DegreeChannel, value: number): void {
  const parts: string[] = channel.split(".");
  let object: object = pose;
  for (const part of parts.slice(0, -1)) { if (Reflect.get(object, part) === undefined) Reflect.set(object, part, {}); object = Reflect.get(object, part) as object; }
  Reflect.set(object, parts.at(-1)!, value);
}
