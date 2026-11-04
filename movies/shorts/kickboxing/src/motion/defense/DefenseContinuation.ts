import { Quaternion, sampleClip } from "@automovie/engine";
import {
  AutoMovieHumanRigControls,
  type AutoMovieHumanSkeleton,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import type { IAutoMovieClip } from "@automovie/interface";

import { MotionAction } from "../core/MotionAction";
import type { DefenseMotion } from "./DefenseMotion";

/**
 * One standing defense's actual entry joins its original next-action trajectory.
 *
 * @evidence contracts/common.md#implementation-and-ownership Public glTF cubic sampling decays actual position/rate error to zero value and derivative over one declared window. Only the new arm and single body are corrected; another arm's original action clock remains its writer's responsibility. Original nominal WORLD support goals and terminal tasks stay unchanged.
 * @evidence contracts/common.md#authoring-interface Construction requires actual applied entry values and declared h/h2 one-sided rates for every owned canonical channel and external task. Standing root orientation must agree and angular velocity must be zero. This source interpolation does not prove post-fit C1, collision or balance; the actual consumer must inspect those results.
 */
export class DefenseContinuation {
  /** Positive entry correction duration, seconds. */
  public readonly windowSeconds: number;
  /** Immutable construction-owned actual entry, never exposed to a sampler. */
  private readonly entry: DefenseContinuation.Entry;
  /** Public Engine cubic correction tracks, independent of rendering history. */
  private readonly clip: IAutoMovieClip;
  /** One correction pointer per explicitly owned canonical control. */
  private readonly channels: {
    channel: AutoMovieHumanRigControls.DegreeChannel;
    pointer: string;
  }[];
  /** Three actor-fixed local root correction pointers. */
  private readonly root: string[];
  /** Same original external task topology and correction pointers. */
  private readonly tasks: { key: string; pointers: string[] }[];

  /** Capture detached actual boundary data and the original nominal zero-time sample.
   * Nominal zero has the defense sampler's zero authored tangent; measured entry rates retain h/h2 provenance. Construction validates complete owned rates and standing-root agreement before building the public cubic correction tracks once.
   */
  public constructor(
    canonicalStart: DefenseMotion.Sample,
    entry: DefenseContinuation.Entry,
  ) {
    MotionAction.validateSupport(entry.sample.support);
    MotionAction.validateSupport(canonicalStart.support);
    MotionAction.validateRootRotation(entry.sample.rootRotation);
    MotionAction.validateRootRotation(canonicalStart.rootRotation);
    if (
      canonicalStart.elapsed !== 0 ||
      !Number.isFinite(entry.windowSeconds) ||
      entry.windowSeconds <= 0 ||
      (entry.side !== "left" && entry.side !== "right") ||
      !Number.isFinite(entry.provenance.h) ||
      entry.provenance.h <= 0 ||
      !Number.isFinite(entry.provenance.h2) ||
      entry.provenance.h2 <= 0 ||
      Math.abs(entry.provenance.h2 * 2 - entry.provenance.h) > 1e-12 ||
      !["before", "after"].includes(entry.provenance.oneSided) ||
      !entry.provenance.contactBranch.trim()
    )
      throw new Error(
        "Defense continuation requires nominal zero, finite duration and actual one-sided h/h2 provenance",
      );
    if (
      entry.sample.support.kind === "contacts" ||
      entry.sample.support.kind === "airborne" ||
      canonicalStart.support.kind === "contacts" ||
      canonicalStart.support.kind === "airborne"
    )
      throw new Error(
        "Defense continuation supports standing foot relationships only",
      );
    const actualRotation: readonly number[] = entry.sample.rootRotation ?? [
      0, 0, 0, 1,
    ];
    const originalRotation: readonly number[] = canonicalStart.rootRotation ?? [
      0, 0, 0, 1,
    ];
    const orientationDifference: number = Math.min(
      ...[1, -1].map((sign: number): number =>
        Math.hypot(
          ...actualRotation.map(
            (value: number, index: number): number =>
              value - sign * originalRotation[index]!,
          ),
        ),
      ),
    );
    if (
      !finiteVector(entry.rootVelocity) ||
      !finiteVector(entry.rootAngularVelocity) ||
      !finiteVector(entry.sample.rootOffset) ||
      !finiteVector(canonicalStart.rootOffset) ||
      Math.hypot(...entry.rootAngularVelocity) > 1e-8 ||
      orientationDifference > 1e-10
    )
      throw new Error(
        "Standing defense continuation requires finite roots, the same fixed orientation and zero actual angular rate",
      );
    const required: AutoMovieHumanRigControls.DegreeChannel[] = ownedChannels(
      entry.side,
    );
    if (
      entry.channelRates.length !== required.length ||
      new Set(
        entry.channelRates.map(
          (row: DefenseContinuation.Rate): string => row.channel,
        ),
      ).size !== required.length ||
      entry.channelRates.some(
        (row: DefenseContinuation.Rate): boolean =>
          !required.includes(row.channel) ||
          !Number.isFinite(row.degreesPerSecond),
      )
    )
      throw new Error(
        "Defense continuation requires every owned applied channel rate exactly once",
      );
    this.entry = structuredClone(entry);
    this.windowSeconds = entry.windowSeconds;
    const tracks: IAutoMovieClip["tracks"] = [];
    const correction: (delta: number, rate: number) => string = (
      delta: number,
      rate: number,
    ): string => {
      if (!Number.isFinite(delta) || !Number.isFinite(rate))
        throw new Error("Defense correction values must be finite");
      const pointer: string = `/correction/${tracks.length}`;
      tracks.push({
        channel: { kind: "pointer", pointer, valueType: "scalar" },
        times: [0, entry.windowSeconds],
        values: [0, delta, rate, 0, 0, 0],
        interpolation: "cubicspline",
      });
      return `ptr:${pointer}`;
    };
    this.channels = entry.channelRates.map(
      (
        row: DefenseContinuation.Rate,
      ): {
        channel: AutoMovieHumanRigControls.DegreeChannel;
        pointer: string;
      } => ({
        channel: row.channel,
        pointer: correction(
          AutoMovieHumanRigControls.readApplied(
            entry.sample.pose,
            row.channel,
            [],
          ) -
            AutoMovieHumanRigControls.readApplied(
              canonicalStart.pose,
              row.channel,
              [],
            ),
          row.degreesPerSecond,
        ),
      }),
    );
    this.root = [0, 1, 2].map((axis: number): string =>
      correction(
        entry.sample.rootOffset[axis]! - canonicalStart.rootOffset[axis]!,
        entry.rootVelocity[axis]!,
      ),
    );
    const keys: string[] = canonicalStart.effectors.map(taskKey);
    if (
      new Set(keys).size !== keys.length ||
      entry.taskRates.length !== keys.length ||
      entry.sample.effectors.length !== keys.length ||
      new Set(entry.taskRates.map(taskKey)).size !== keys.length
    )
      throw new Error(
        "Defense continuation requires matching external task identities and rates",
      );
    this.tasks = canonicalStart.effectors.map(
      (task: MotionAction.Effector): { key: string; pointers: string[] } => {
        const key: string = taskKey(task);
        const point: MotionAction.Effector | undefined =
          entry.sample.effectors.find(
            (row: MotionAction.Effector): boolean => taskKey(row) === key,
          );
        const rate: DefenseContinuation.TaskRate | undefined =
          entry.taskRates.find(
            (row: DefenseContinuation.TaskRate): boolean =>
              taskKey(row) === key,
          );
        if (
          !point ||
          !rate ||
          !finiteVector(point.target) ||
          !finiteVector(task.target) ||
          !finiteVector(rate.velocity)
        )
          throw new Error(
            "Defense actual entry is missing an original external point or its finite rate",
          );
        return {
          key,
          pointers: [0, 1, 2].map((axis: number): string =>
            correction(
              point.target[axis]! - task.target[axis]!,
              rate.velocity[axis]!,
            ),
          ),
        };
      },
    );
    this.clip = {
      id: "defense-entry-correction",
      name: null,
      duration: entry.windowSeconds,
      loop: false,
      tracks,
    };
  }

  /**
   * Correct one owned nominal sample without changing its clock or support goals.
   * @evidence contracts/common.md#implementation-and-ownership The existing Engine sampler supplies cubic value/rate decay. Exact window completion returns the original nominal sample. Public canonical bounds are inspected after all control writes; malformed topology or a requested out-of-range correction refuses rather than clipping.
   * @evidence contracts/common.md#authoring-interface Local seconds begin at this new defense's entry. Clinical witness positions are recomputed from its corrected pose through the same public FK; no original external task or WORLD support goal is derived from achieved fitting.
   */
  public apply(
    nominal: DefenseMotion.Sample,
    seconds: number,
    evaluate: AutoMovieHumanSkeleton.PoseEvaluator,
  ): DefenseMotion.Sample {
    if (!Number.isFinite(seconds) || seconds < 0)
      throw new Error(
        "Defense continuation requires nonnegative local seconds",
      );
    if (seconds >= this.entry.windowSeconds) return structuredClone(nominal);
    if (
      nominal.effectors.length !== this.tasks.length ||
      new Set(nominal.effectors.map(taskKey)).size !== this.tasks.length ||
      nominal.effectors.some(
        (task: MotionAction.Effector): boolean =>
          !this.tasks.some(
            (row: { key: string }): boolean => row.key === taskKey(task),
          ),
      )
    )
      throw new Error("Defense continuation external task topology changed");
    const values: ReturnType<typeof sampleClip> = sampleClip(
      this.clip,
      seconds,
    );
    const value: (pointer: string) => number = (pointer: string): number =>
      values.get(pointer)!.value[0]!;
    const output: DefenseMotion.Sample = structuredClone(nominal);
    for (const row of this.channels)
      write(
        output.pose,
        row.channel,
        AutoMovieHumanRigControls.readApplied(output.pose, row.channel, []) +
          value(row.pointer),
      );
    for (const row of this.channels) {
      const bounds: ReturnType<typeof AutoMovieHumanRigControls.bounds> =
        AutoMovieHumanRigControls.bounds(row.channel, output.pose);
      const applied: number = AutoMovieHumanRigControls.readApplied(
        output.pose,
        row.channel,
        [],
      );
      if (applied < bounds.minimum || applied > bounds.maximum)
        throw new Error(
          `Defense entry correction exceeds native bounds at ${row.channel}`,
        );
    }
    for (const axis of [0, 1, 2] as const)
      output.rootOffset[axis] += value(this.root[axis]!);
    output.effectors = output.effectors.map(
      (task: MotionAction.Effector): MotionAction.Effector => {
        const row: { key: string; pointers: string[] } = this.tasks.find(
          (item: { key: string }): boolean => item.key === taskKey(task),
        )!;
        return {
          ...task,
          target: [
            task.target[0] + value(row.pointers[0]!),
            task.target[1] + value(row.pointers[1]!),
            task.target[2] + value(row.pointers[2]!),
          ],
        };
      },
    );
    if (output.clinicalWitnesses?.length) {
      const pose: AutoMovieHumanSkeleton.IOutput = evaluate(output.pose);
      output.clinicalWitnesses = output.clinicalWitnesses.map(
        (point: MotionAction.Effector): MotionAction.Effector => {
          const carrier: AutoMovieHumanSkeleton.IPlacement | undefined =
            pose.posed.find(
              (row: AutoMovieHumanSkeleton.IPlacement): boolean =>
                row.bone === point.bone,
            );
          if (!carrier)
            throw new Error(`Missing corrected clinical witness ${point.bone}`);
          const rotation: readonly number[] = carrier.rotation;
          const local: MotionAction.Vec3 = point.localPoint ?? [0, 0, 0];
          const q: { x: number; y: number; z: number; w: number } = {
            x: rotation[0]!,
            y: rotation[1]!,
            z: rotation[2]!,
            w: rotation[3]!,
          };
          const rotated: ReturnType<typeof Quaternion.rotateVector> =
            Quaternion.rotateVector(q, {
              x: local[0],
              y: local[1],
              z: local[2],
            });
          return {
            ...point,
            target: [
              carrier.position[0] + rotated.x,
              carrier.position[1] + rotated.y,
              carrier.position[2] + rotated.z,
            ],
          };
        },
      );
    }
    return output;
  }

  /** Detached finite-rate approximation provenance retained for actual consumer review.
   * @evidence contracts/common.md#implementation-and-ownership Copies the construction-owned actual entry rather than exposing mutable tracks, rates or sample state.
   * @evidence contracts/common.md#authoring-interface This is a source boundary receipt; it makes no claim that the actual fitted result preserves its finite tangent.
   */
  public inspect(): DefenseContinuation.Entry {
    return structuredClone(this.entry);
  }
}

/** Entry types retain the actual sample and measured canonical rates in the next defense's fixed actor frame. */
export namespace DefenseContinuation {
  /** An applied canonical angular tangent, degrees per second.
   * @evidence contracts/common.md#implementation-and-ownership Names the existing public canonical path instead of a solver-channel index or raw target derivative.
   * @evidence contracts/common.md#authoring-interface The value is a finite measured applied degree rate; a stationary channel must be explicitly measured as zero.
   */
  export interface Rate {
    /** Exact public degree path. */ channel: AutoMovieHumanRigControls.DegreeChannel;
    /** Applied degrees per second. */ degreesPerSecond: number;
  }
  /** A measured named task point's actor-root-relative linear tangent.
   * @evidence contracts/common.md#implementation-and-ownership Bone/local identity matches the next action's original external task; the actual point rate remains separate from the root rate.
   * @evidence contracts/common.md#authoring-interface Local point uses carrier metres and velocity uses actor-root-relative metres per second in the fixed heading frame.
   */
  export interface TaskRate {
    /** Actual canonical carrier. */ bone: MotionAction.Effector["bone"];
    /** Actual point; omission is the carrier origin. */ localPoint?: MotionAction.Vec3;
    /** Relative linear rate, metres per second. */ velocity: MotionAction.Vec3;
  }
  /** Actual entry uses the same fixed actor frame as the nominal next defense.
   * @evidence contracts/common.md#implementation-and-ownership Captures the applied current sample and complete new-arm/body/task tangents without taking ownership of the other continuing arm or its original clock.
   * @evidence contracts/common.md#authoring-interface All positions share the fixed actor frame; h/h2, contact branch and one-sided provenance describe the finite approximation. The correction ends before the next nominal receiving endpoint.
   */
  export interface Entry {
    /** Newly owned receiving arm; the other arm keeps its original writer. */ side: MotionAction.Side;
    /** Applied entry pose/root and actual positions of the new external task points. */ sample: MotionAction.Sample;
    /** Every new-side arm and single-body channel, including measured stationary leaves. */ channelRates: Rate[];
    /** Actor-fixed local root translation tangent, metres per second. */ rootVelocity: MotionAction.Vec3;
    /** Actual angular tangent; this standing adapter accepts zero only. */ rootAngularVelocity: MotionAction.Vec3;
    /** Actual task tangents after subtracting the same root's linear velocity. */ taskRates: TaskRate[];
    /** Canonical actual sampling declaration; finite secants do not prove instantaneous C1. */ provenance: {
      h: number;
      h2: number;
      oneSided: "before" | "after";
      contactBranch: string;
    };
    /** Positive correction lifetime, ending before the original next-action terminal. */ windowSeconds: number;
  }
}

/** Stable exact bone/local task identity, distinguishing a pad from its joint origin. */
function taskKey(point: {
  bone: string;
  localPoint?: MotionAction.Vec3;
}): string {
  if (
    !AutoMovieHumanRigControls.isJoint(point.bone) ||
    (point.localPoint !== undefined && !finiteVector(point.localPoint))
  )
    throw new Error(
      "Defense task requires a canonical carrier and finite local point",
    );
  return JSON.stringify([point.bone, point.localPoint ?? [0, 0, 0]]);
}

/** Inspect every coordinate, including sparse JavaScript arrays. */
function finiteVector(value: unknown): value is MotionAction.Vec3 {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    [0, 1, 2].every((axis: number): boolean => Number.isFinite(value[axis]))
  );
}

/** Every active owned control is explicit so an unknown tangent cannot become zero. */
function ownedChannels(
  side: MotionAction.Side,
): AutoMovieHumanRigControls.DegreeChannel[] {
  const result: AutoMovieHumanRigControls.DegreeChannel[] = [
    ...AutoMovieHumanRigControls.chain({ region: "arm", side }),
    AutoMovieHumanRigControls.channel(`arms.${side}.wrist.flexion`),
    AutoMovieHumanRigControls.channel(`arms.${side}.wrist.radialDeviation`),
    ...AutoMovieHumanRigControls.chain({ region: "pelvis" }),
    ...AutoMovieHumanRigControls.chain({ region: "spine" }),
    ...AutoMovieHumanRigControls.chain({ region: "neck" }),
  ];
  for (const digit of ["thumb", "index", "middle", "ring", "little"] as const)
    result.push(
      ...AutoMovieHumanRigControls.chain({ region: "finger", side, digit }),
    );
  for (const leg of ["left", "right"] as const) {
    result.push(
      ...AutoMovieHumanRigControls.chain({ region: "leg", side: leg }),
    );
    for (const digit of [
      "hallux",
      "second",
      "third",
      "fourth",
      "fifth",
    ] as const)
      result.push(
        ...AutoMovieHumanRigControls.chain({ region: "toe", side: leg, digit }),
      );
  }
  return [...new Set(result)];
}

/** Write a validated canonical scalar into the construction-owned pose only. */
function write(
  pose: IAutoMovieHumanPose,
  channel: AutoMovieHumanRigControls.DegreeChannel,
  value: number,
): void {
  const parts: string[] = channel.split(".");
  let object: object = pose;
  for (const part of parts.slice(0, -1)) {
    if (Reflect.get(object, part) === undefined) Reflect.set(object, part, {});
    object = Reflect.get(object, part) as object;
  }
  Reflect.set(object, parts.at(-1)!, value);
}
