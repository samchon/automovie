import { rigidTransformVelocity } from "@automovie/engine";
import { AutoMovieHumanRigControls, type AutoMovieHumanSkeleton, type IAutoMovieHumanPose } from "@automovie/human";
import type { IAutoMovieTransform } from "@automovie/interface";
import * as THREE from "three";
import type { MotionAction } from "../motion/core/MotionAction";
import type { LabActor } from "./LabActor";
import type { PunchAction } from "../motion/punch/PunchAction";
import type { DefenseContinuation } from "../motion/defense/DefenseContinuation";
import { RoundhouseContinuation } from "../motion/kick/RoundhouseContinuation";

/**
 * Measure actual fitted motion at fixed canonical times rather than renderer history.
 * @evidence contracts/common.md#implementation-and-ownership Reads the same final drawn bone/root transforms and the exact pose plus clamp receipt from that actor's latest public evaluation. Public Engine finite rigid velocity and Human applied scalar reading supply rates at h and h/2; both use one declared contact branch and never raw target or RAF differences.
 * @evidence contracts/common.md#authoring-interface The caller owns a deterministic actual sampler with atomic restoration. Rates are finite secants, not analytic derivatives; their h/h2 disagreement and pre/post-contact side are retained. Unknown or failed actual states refuse rather than becoming zero velocity.
 */
export namespace LabActualMotion {
  /**
   * One actual state and the public clinical values applied at that same time.
   * @evidence contracts/common.md#implementation-and-ownership All fields are detached from native actor matrices and evaluator storage after a completed admitted fit; no source goal is substituted for a displayed point.
   * @evidence contracts/common.md#authoring-interface Transform translations use WORLD metres and rotations WORLD quaternions. Controls retain public degrees. branch identifies the actual action/contact lifetime on this side of impact.
   */
  export interface Snapshot {
    /** Canonical local display time. */ seconds: number;
    /** Explicit observed contact branch. */ branch: string;
    /** Applied source pose with its matching clamp receipt already read. */ pose: IAutoMovieHumanPose;
    /** Same actual actor-frame body placement. */ placement: MotionAction.BodyPlacement;
    /** Actual world actor, torso and selected glove-pad frames. */ frames: { root: Pick<IAutoMovieTransform, "translation" | "rotation">; torso: Pick<IAutoMovieTransform, "translation" | "rotation">; pad: Pick<IAutoMovieTransform, "translation" | "rotation"> };
    /** Every relevant canonical applied arm/body degree value. */ controls: { channel: AutoMovieHumanRigControls.DegreeChannel; value: number }[];
    /** Actual rigid frames for original foot carriers, retained for entry-frame tangent authoring. */ feet: Record<string, Pick<IAutoMovieTransform, "translation" | "rotation">>;
  }

  /**
   * One-sided actual tangent with an independently sampled half-step estimate.
   * @evidence contracts/common.md#implementation-and-ownership Three fixed actual snapshots provide h and h/2 secants without crossing their declared contact branch. Scalar and world-transform differences remain separate; no convergence claim follows from merely obtaining finite values.
   * @evidence contracts/common.md#authoring-interface Entry is the exact requested canonical state. rates use the h/2 estimate and report h/h2 disagreement. Body/root/support are copied from that entry, not inferred from a terminal task.
   */
  export interface Measurement {
    /** Actual state at the declared entry. */ entry: Snapshot;
    /** Same three fixed actual observations; no resampling is needed for other source foot points. */ samples: { half: Snapshot; full: Snapshot };
    /** Applied degree rates, including measured stationary channels. */ rates: { channel: AutoMovieHumanRigControls.DegreeChannel; degreesPerSecond: number; halfStepDifference: number }[];
    /** Original declared load-intent rates, not measured contact forces. */ loadRates: Record<MotionAction.Side, { perSecond: number; halfStepDifference: number }>;
    /** Actual world finite velocities at h/2. */ velocity: { root: ReturnType<typeof rigidTransformVelocity>; torso: ReturnType<typeof rigidTransformVelocity>; pad: ReturnType<typeof rigidTransformVelocity> };
    /** Fixed sampling and approximation disclosure. */ provenance: { h: number; h2: number; oneSided: "before" | "after"; contactBranch: string; actualTime: number; maximumRateDifference: number; maximumLinearDifference: number; maximumAngularDifference: number };
  }

  /**
   * Read the latest actual admitted actor at one canonical time.
   * @evidence contracts/common.md#implementation-and-ownership Native world matrices supply root, chest and the real Hand-bound pad position. Public readApplied reads all selected arm, wrist, finger, body, leg and toe values against person.output.clamped from that same pose evaluation.
   * @evidence contracts/common.md#authoring-interface Requires a completed admitted sample; no application or solver is run here. Missing native bones or inconsistent public clamp provenance throws.
   */
  export function capture(actor: LabActor, side: MotionAction.Side, seconds: number, branch: string): Snapshot {
    if (actor.support?.status !== "admitted" || !actor.sample) throw new Error("Actual motion requires an admitted displayed sample");
    actor.person.object.updateWorldMatrix(true, true);
    const frame: (object: THREE.Object3D, local?: MotionAction.Vec3) => Pick<IAutoMovieTransform, "translation" | "rotation"> = (object: THREE.Object3D, local?: MotionAction.Vec3): Pick<IAutoMovieTransform, "translation" | "rotation"> => {
      const position: THREE.Vector3 = local ? object.localToWorld(new THREE.Vector3(...local)) : object.getWorldPosition(new THREE.Vector3());
      const rotation: THREE.Quaternion = object.getWorldQuaternion(new THREE.Quaternion());
      return { translation: { x: position.x, y: position.y, z: position.z }, rotation: { x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w } };
    };
    const hand: THREE.Group | undefined = actor.person.drawing.bones.get(`${side}Hand`);
    const chest: THREE.Group | undefined = actor.person.drawing.bones.get("chest");
    if (!hand || !chest) throw new Error("Actual root/torso/Hand frames are required");
    const controls: Snapshot["controls"] = channels(side).map((channel: AutoMovieHumanRigControls.DegreeChannel): Snapshot["controls"][number] => ({ channel, value: AutoMovieHumanRigControls.readApplied(actor.pose, channel, actor.person.output.clamped) }));
    if (actor.person.output.clamped.some((clamp: AutoMovieHumanSkeleton.IClamp): boolean => !controls.some((control: Snapshot["controls"][number]): boolean => control.channel === clamp.path))) throw new Error("Actual entry contains an unobserved applied clamp");
    const applied: IAutoMovieHumanPose = structuredClone(actor.pose);
    for (const control of controls) write(applied, control.channel, control.value);
    const feet: Snapshot["feet"] = {};
    for (const [bone, group] of actor.person.drawing.bones) if (/^(left|right)(Foot|Subtalar|Midfoot|Hallux.*|Toe.*)$/u.test(bone)) feet[bone] = frame(group);
    const rootRotation: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -actor.yaw).multiply(actor.person.object.quaternion);
    return structuredClone({ seconds, branch, pose: applied, placement: { pose: applied, rootOffset: actor.person.object.position.clone().sub(actor.origin).applyAxisAngle(new THREE.Vector3(0, 1, 0), -actor.yaw).toArray(), rootRotation: rootRotation.toArray(), preservedChannels: actor.sample.preservedChannels, support: actor.sample.support }, frames: { root: frame(actor.person.object), torso: frame(chest), pad: frame(hand, actor.glove(side).position.toArray()) }, controls, feet });
  }

  /**
   * Sample exactly h/h2 on one side of an actual contact branch.
   * @evidence contracts/common.md#implementation-and-ownership The supplied canonical sampler is called at three fixed times, never a render-frame delta. Both finite estimates use the same entry and branch; invalid intervals, failed fits, topology differences or a contact branch change refuse.
   * @evidence contracts/common.md#authoring-interface The caller retains and restores case state around sampling. h is a declared positive seconds interval and before/after must be chosen from actual contact lifetime; this function does not invent unknown rates.
   */
  export function measure(sample: (seconds: number) => Snapshot, seconds: number, h: number, oneSided: "before" | "after"): Measurement {
    if (!Number.isFinite(h) || h <= 0 || !["before", "after"].includes(oneSided)) throw new Error("Actual tangent requires an explicit positive fixed interval and side");
    const sign: number = oneSided === "before" ? -1 : 1;
    const entry: Snapshot = sample(seconds);
    const half: Snapshot = sample(seconds + sign * h / 2);
    const full: Snapshot = sample(seconds + sign * h);
    if (entry.branch !== half.branch || entry.branch !== full.branch) throw new Error("Canonical actual tangent crosses a contact branch");
    const difference: (a: Snapshot, dt: number) => Measurement["velocity"] = (a: Snapshot, dt: number): Measurement["velocity"] => {
      const velocity: (name: keyof Snapshot["frames"]) => ReturnType<typeof rigidTransformVelocity> = (name: keyof Snapshot["frames"]): ReturnType<typeof rigidTransformVelocity> => sign < 0 ? rigidTransformVelocity(a.frames[name], entry.frames[name], dt) : rigidTransformVelocity(entry.frames[name], a.frames[name], dt);
      return { root: velocity("root"), torso: velocity("torso"), pad: velocity("pad") };
    };
    const velocity: Measurement["velocity"] = difference(half, h / 2);
    const coarse: Measurement["velocity"] = difference(full, h);
    const rates: Measurement["rates"] = entry.controls.map((control: Snapshot["controls"][number], index: number): Measurement["rates"][number] => {
      if (half.controls[index]?.channel !== control.channel || full.controls[index]?.channel !== control.channel) throw new Error("Actual tangent control topology changed");
      const fine: number = (half.controls[index]!.value - control.value) / (sign * h / 2);
      const rough: number = (full.controls[index]!.value - control.value) / (sign * h);
      return { channel: control.channel, degreesPerSecond: fine, halfStepDifference: Math.abs(fine - rough) };
    });
    const vectorDifference: (a: {x:number;y:number;z:number}, b: {x:number;y:number;z:number}) => number = (a: {x:number;y:number;z:number}, b: {x:number;y:number;z:number}): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    const loadRate: (side: MotionAction.Side) => Measurement["loadRates"]["left"] = (side: MotionAction.Side): Measurement["loadRates"]["left"] => {
      const fine: number = (half.placement.support[side] - entry.placement.support[side]) / (sign * h / 2);
      const rough: number = (full.placement.support[side] - entry.placement.support[side]) / (sign * h);
      return { perSecond: fine, halfStepDifference: Math.abs(fine - rough) };
    };
    return { entry, samples: { half, full }, rates, loadRates: { left: loadRate("left"), right: loadRate("right") }, velocity, provenance: { h, h2: h / 2, oneSided, contactBranch: entry.branch, actualTime: seconds, maximumRateDifference: Math.max(...rates.map((rate: Measurement["rates"][number]): number => rate.halfStepDifference)), maximumLinearDifference: Math.max(...(["root", "torso", "pad"] as const).map((name: keyof Snapshot["frames"]): number => vectorDifference(velocity[name].linear, coarse[name].linear))), maximumAngularDifference: Math.max(...(["root", "torso", "pad"] as const).map((name: keyof Snapshot["frames"]): number => vectorDifference(velocity[name].angular, coarse[name].angular))) } };
  }

  /**
   * Bind an actual owned arm and its measured tangent to an unchanged original WORLD strike.
   * @evidence contracts/common.md#implementation-and-ownership Copies every measured owned channel, actual pad position/rate and finite sampling provenance into the existing punch continuation type. Original terminal data remains a separate caller-owned authoring decision.
   * @evidence contracts/common.md#authoring-interface endSeconds is the new action's join deadline; measurement time remains the original actual source time. Only known free/pre-contact/post-contact branches are accepted. This conversion performs no fitting or actor mutation.
   */
  export function punchEntry(measurement: Measurement, side: MotionAction.Side, endSeconds: number, terminal: MotionAction.Vec3): PunchAction.Continuation {
    const arm: NonNullable<IAutoMovieHumanPose["arms"]>["left"] | undefined = measurement.entry.pose.arms?.[side];
    if (!arm) throw new Error("Continuation requires the actual owned arm");
    const pad: Snapshot["frames"]["pad"] = measurement.entry.frames.pad;
    const velocity: Measurement["velocity"]["pad"]["linear"] = measurement.velocity.pad.linear;
    const branch: string = measurement.entry.branch;
    if (branch !== "free" && branch !== "pre-contact" && branch !== "post-contact") throw new Error("Unknown actual contact branch");
    return { arm: structuredClone(arm), rates: measurement.rates.filter((rate: Measurement["rates"][number]): boolean => rate.channel.startsWith(`arms.${side}.`)).map((rate: Measurement["rates"][number]): PunchAction.Continuation["rates"][number] => ({ channel: rate.channel, degreesPerSecond: rate.degreesPerSecond })), from: { pointWorld: [pad.translation.x, pad.translation.y, pad.translation.z], velocityWorld: [velocity.x, velocity.y, velocity.z] }, terminal: { pointWorld: [...terminal], velocityWorld: [0, 0, 0] }, endSeconds, provenance: { time: measurement.provenance.actualTime, h: measurement.provenance.h, h2: measurement.provenance.h2, oneSided: measurement.provenance.oneSided, branch, velocityError: measurement.provenance.maximumLinearDifference } };
  }

  /**
   * Express actual defensive entry and external-point rates in the same fixed actor frame.
   * @evidence contracts/common.md#implementation-and-ownership Reads actual applied canonical poses at h/h2 through the same public fixed-body FK. Each new external task keeps its bone/local identity but starts at that actual point; its unchanged nominal terminal remains owned by DefenseContinuation. Original WORLD support anchors are copied from the actual state.
   * @evidence contracts/common.md#authoring-interface The frame must be unchanged across the source observations and new defense. Rates are finite one-sided secants, not analytic velocities. Nonzero root angular motion is passed explicitly for the standing-only continuation to admit or refuse; no unknown rate becomes zero.
   */
  export function defenseEntry(measurement: Measurement, canonical: MotionAction.Sample, context: MotionAction.Context, side: MotionAction.Side, windowSeconds: number): DefenseContinuation.Entry {
    if (!context.evaluatePose || !context.frame) throw new Error("Defensive continuation needs the original fixed actor evaluator and frame");
    const point: (snapshot: Snapshot, task: MotionAction.Effector) => MotionAction.Vec3 = (snapshot: Snapshot, task: MotionAction.Effector): MotionAction.Vec3 => {
      const row: AutoMovieHumanSkeleton.IPlacement | undefined = context.evaluatePose!(snapshot.pose).posed.find((placement: AutoMovieHumanSkeleton.IPlacement): boolean => placement.bone === task.bone);
      if (!row) throw new Error(`Actual defensive task has no native carrier ${task.bone}`);
      return new THREE.Vector3(...(task.localPoint ?? [0, 0, 0])).applyQuaternion(new THREE.Quaternion(...row.rotation)).add(new THREE.Vector3(...row.position)).toArray();
    };
    const effectors: MotionAction.Effector[] = canonical.effectors.map((task: MotionAction.Effector): MotionAction.Effector => ({ ...structuredClone(task), target: point(measurement.entry, task) }));
    const sign: number = measurement.provenance.oneSided === "before" ? -1 : 1;
    const taskRates: DefenseContinuation.Entry["taskRates"] = canonical.effectors.map((task: MotionAction.Effector): DefenseContinuation.Entry["taskRates"][number] => {
      const entry: MotionAction.Vec3 = point(measurement.entry, task);
      const half: MotionAction.Vec3 = point(measurement.samples.half, task);
      const velocity: MotionAction.Vec3 = half.map((value: number, index: number): number => (value - entry[index]!) / (sign * measurement.provenance.h2)) as MotionAction.Vec3;
      return { bone: task.bone, localPoint: task.localPoint ? [...task.localPoint] : undefined, velocity };
    });
    const rotation: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -context.frame.yawRadians);
    const vector: (value: { x: number; y: number; z: number }) => MotionAction.Vec3 = (value: { x: number; y: number; z: number }): MotionAction.Vec3 => new THREE.Vector3(value.x, value.y, value.z).applyQuaternion(rotation).toArray();
    return { side, sample: { ...structuredClone(canonical), pose: structuredClone(measurement.entry.pose), rootOffset: [...measurement.entry.placement.rootOffset], rootRotation: measurement.entry.placement.rootRotation ? [...measurement.entry.placement.rootRotation] : undefined, support: structuredClone(measurement.entry.placement.support) as MotionAction.Support, preservedChannels: measurement.entry.placement.preservedChannels ? [...measurement.entry.placement.preservedChannels] : undefined, effectors }, channelRates: measurement.rates.map((rate: Measurement["rates"][number]): DefenseContinuation.Entry["channelRates"][number] => ({ channel: rate.channel, degreesPerSecond: rate.degreesPerSecond })), rootVelocity: vector(measurement.velocity.root.linear), rootAngularVelocity: vector(measurement.velocity.root.angular), taskRates, provenance: { h: measurement.provenance.h, h2: measurement.provenance.h2, oneSided: measurement.provenance.oneSided, contactBranch: measurement.entry.branch }, windowSeconds };
  }

  /**
   * Convert actual replanted body and leg rates into the original kick's fixed frame.
   * @evidence contracts/common.md#implementation-and-ownership Copies actual applied body, original WORLD support anchors and complete non-arm rates. WORLD root velocity is rotated once into the same actor heading; continuing arms retain their own separate owner and clocks.
   * @evidence contracts/common.md#authoring-interface Both original feet must already be planted for the kick source to admit this boundary. Load rates are declared load-intent secants, not measured forces. The original kick independently owns its unchanged sole and strike tasks; finite h/h2 provenance does not certify fitted continuity.
   */
  export function kickEntry(measurement: Measurement, context: MotionAction.Context, windowSeconds: number): RoundhouseContinuation.Entry {
    if (!context.frame) throw new Error("Kick continuation requires the original actor frame");
    const required: AutoMovieHumanRigControls.DegreeChannel[] = RoundhouseContinuation.channels();
    const vector: (value: { x: number; y: number; z: number }) => MotionAction.Vec3 = (value: { x: number; y: number; z: number }): MotionAction.Vec3 => new THREE.Vector3(value.x, value.y, value.z).applyAxisAngle(new THREE.Vector3(0, 1, 0), -context.frame!.yawRadians).toArray();
    return { sample: { pose: structuredClone(measurement.entry.pose), rootOffset: [...measurement.entry.placement.rootOffset], rootRotation: measurement.entry.placement.rootRotation ? [...measurement.entry.placement.rootRotation] : undefined, support: structuredClone(measurement.entry.placement.support) as MotionAction.Support, preservedChannels: measurement.entry.placement.preservedChannels ? [...measurement.entry.placement.preservedChannels] : undefined, effectors: [], elapsed: 0, phase: "preparation", progress: 0 }, channelRates: measurement.rates.filter((row: Measurement["rates"][number]): boolean => required.includes(row.channel)).map((row: Measurement["rates"][number]): RoundhouseContinuation.Rate => ({ channel: row.channel, degreesPerSecond: row.degreesPerSecond })), rootVelocity: vector(measurement.velocity.root.linear), rootAngularVelocity: vector(measurement.velocity.root.angular), loadRates: { left: measurement.loadRates.left.perSecond, right: measurement.loadRates.right.perSecond }, provenance: { h: measurement.provenance.h, h2: measurement.provenance.h2, oneSided: measurement.provenance.oneSided, contactBranch: measurement.entry.branch }, windowSeconds };
  }

  /** Include every active owned arm control and the single body's canonical controls. */
  function channels(side: MotionAction.Side): AutoMovieHumanRigControls.DegreeChannel[] {
    const result: AutoMovieHumanRigControls.DegreeChannel[] = [...AutoMovieHumanRigControls.chain({ region: "arm", side }), AutoMovieHumanRigControls.channel(`arms.${side}.wrist.flexion`), AutoMovieHumanRigControls.channel(`arms.${side}.wrist.radialDeviation`), ...AutoMovieHumanRigControls.chain({region:"pelvis"}), ...AutoMovieHumanRigControls.chain({region:"spine"}), ...AutoMovieHumanRigControls.chain({region:"neck"})];
    for (const digit of ["thumb", "index", "middle", "ring", "little"] as const) result.push(...AutoMovieHumanRigControls.chain({region:"finger",side,digit}));
    for (const leg of ["left", "right"] as const) {
      result.push(...AutoMovieHumanRigControls.chain({region:"leg",side:leg}));
      for (const digit of ["hallux", "second", "third", "fourth", "fifth"] as const) result.push(...AutoMovieHumanRigControls.chain({region:"toe",side:leg,digit}));
    }
    return [...new Set(result)];
  }

  /** Record the public applied scalar in the owned entry pose, preserving raw requests elsewhere. */
  function write(pose: IAutoMovieHumanPose, channel: AutoMovieHumanRigControls.DegreeChannel, value: number): void {
    const parts: string[] = channel.split(".");
    let object: object = pose;
    for (const part of parts.slice(0, -1)) { if (Reflect.get(object, part) === undefined) Reflect.set(object, part, {}); object = Reflect.get(object, part) as object; }
    Reflect.set(object, parts.at(-1)!, value);
  }
}
