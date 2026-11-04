import { Quaternion } from "@automovie/engine";
import {
  AutoMovieHumanRigControls,
  type IAutoMovieHumanPose,
} from "@automovie/human";

import type { MotionAction } from "../core/MotionAction";

/**
 * Continue one owned arm from an immutable actual entry, without restarting another action.
 * @evidence contracts/common.md#implementation-and-ownership A cubic endpoint bridge joins actual WORLD pad position/rate to an independently supplied original terminal task. Clinical corrections join every declared owned channel value/rate to its original curve; solver selection is a separate concern. Body/support and action clocks remain with their existing owners.
 * @evidence contracts/common.md#authoring-interface WORLD metres, metres/second, local seconds and canonical Human degrees/second are explicit. Entry rates come from fixed-time actual applied samples; unknown rates refuse instead of becoming zero. No achieved fitting result replaces the terminal goal.
 */
export namespace PunchContinuation {
  /**
   * Immutable actual entry for one anatomical arm.
   * @evidence contracts/common.md#implementation-and-ownership Contains only this arm, its measured rates and actual entry pad p/v. The producer owns canonical one-sided h/h2 actual fitting; no render-loop delta or generic whole-pose EntryState is introduced. Clinical guard return does not invent a fixed WORLD terminal.
   * @evidence contracts/common.md#authoring-interface endSeconds is the finite bridge interval; an ongoing return keeps its existing deadline. Every numeric entry channel and observed active channel needs a known rate, including girdle/forearm/wrist/fingers outside the four solver channels. Finite secants approximate a tangent; actual C1 remains independently inspected.
   */
  export interface Entry {
    /** Already applied owned arm, including its original finger articulation. */ arm: NonNullable<
      IAutoMovieHumanPose["arms"]
    >["left"];
    /** Actual active or explicitly stationary canonical owned-channel rates; undefined means unknown. */ rates: {
      channel: AutoMovieHumanRigControls.DegreeChannel;
      degreesPerSecond: number | undefined;
    }[];
    /** Actual entry pad WORLD position and velocity. */ from: {
      pointWorld: MotionAction.Vec3;
      velocityWorld: MotionAction.Vec3;
    };
    /** Bridge duration from the new action's zero local second. */ endSeconds: number;
    /** Actual applied sampling provenance, independent of playback FPS. */ provenance: {
      time: number;
      h: number;
      h2: number;
      oneSided: "before" | "after";
      branch: "free" | "pre-contact" | "post-contact";
      velocityError: number;
    };
  }

  /**
   * Actual entry joined to an original independent WORLD strike terminal.
   * @evidence contracts/common.md#implementation-and-ownership Extends the small owned entry only for an external strike trajectory. Clinical guard return uses Entry directly and never invents a fixed WORLD guard goal.
   * @evidence contracts/common.md#authoring-interface Terminal metres and metres/second remain the unchanged original strike task. They are not fitted geometry substituted after a failure.
   */
  export interface Input extends Entry {
    /** Original independent terminal WORLD position and velocity. */ terminal: {
      pointWorld: MotionAction.Vec3;
      velocityWorld: MotionAction.Vec3;
    };
  }

  /**
   * Detach and admit a complete, known-rate owned-arm entry.
   * @evidence contracts/common.md#implementation-and-ownership Recursively collects actual numeric entry leaves and checks their registered own-side rates. Duplicate, foreign, unknown or missing rates refuse, so non-solver articulation cannot reset or silently acquire zero tangent.
   * @evidence contracts/common.md#authoring-interface Returns a recursively frozen owned snapshot. Positive h2 equals h/2; source time, branch and finite sampling disagreement remain visible rather than certifying derivative exactness.
   */
  export function createEntry(
    source: Entry,
    side: MotionAction.Side,
  ): MotionAction.Immutable<Entry> {
    const result: Entry = structuredClone({
      arm: source.arm,
      rates: source.rates,
      from: source.from,
      endSeconds: source.endSeconds,
      provenance: source.provenance,
    });
    const vectors: MotionAction.Vec3[] = [
      result.from.pointWorld,
      result.from.velocityWorld,
    ];
    if (
      !vectors.every(
        (point: MotionAction.Vec3): boolean =>
          point.length === 3 && point.every(Number.isFinite),
      ) ||
      !Number.isFinite(result.endSeconds) ||
      result.endSeconds <= 0
    )
      throw new Error(
        "Continuation requires finite WORLD endpoints and positive local duration",
      );
    const receipt: Entry["provenance"] = result.provenance;
    if (
      ![receipt.time, receipt.h, receipt.h2, receipt.velocityError].every(
        Number.isFinite,
      ) ||
      receipt.h <= 0 ||
      Math.abs(receipt.h2 * 2 - receipt.h) > 1e-12 ||
      receipt.velocityError < 0 ||
      !["before", "after"].includes(receipt.oneSided) ||
      !["free", "pre-contact", "post-contact"].includes(receipt.branch)
    )
      throw new Error(
        "Continuation requires explicit one-sided actual h/h2 provenance",
      );
    const known: Set<string> = new Set();
    for (const rate of result.rates) {
      if (
        !AutoMovieHumanRigControls.isChannel(rate.channel) ||
        !rate.channel.startsWith(`arms.${side}.`) ||
        known.has(rate.channel) ||
        rate.degreesPerSecond === undefined ||
        !Number.isFinite(rate.degreesPerSecond)
      )
        throw new Error(
          `Continuation has an unknown, duplicate or foreign owned rate: ${rate.channel}`,
        );
      known.add(rate.channel);
    }
    for (const path of leaves(result.arm, `arms.${side}`))
      if (!known.has(path))
        throw new Error(
          `Continuation is missing an actual owned rate: ${path}`,
        );
    return freeze(result);
  }

  /**
   * Add the original strike terminal to an admitted immutable entry.
   * @evidence contracts/common.md#implementation-and-ownership Reuses complete entry/rate admission and independently copies the original terminal task. No fit result participates.
   * @evidence contracts/common.md#authoring-interface Terminal WORLD p/v must be finite; failure leaves the caller's data untouched. This function does not apply to a body-bound clinical guard endpoint.
   */
  export function create(
    source: Input,
    side: MotionAction.Side,
  ): MotionAction.Immutable<Input> {
    const entry: MotionAction.Immutable<Entry> = createEntry(source, side);
    if (
      ![source.terminal.pointWorld, source.terminal.velocityWorld].every(
        (value: MotionAction.Vec3): boolean =>
          value.length === 3 && value.every(Number.isFinite),
      )
    )
      throw new Error(
        "Continuation requires finite original terminal WORLD p/v",
      );
    return freeze({
      ...structuredClone(entry),
      terminal: structuredClone(source.terminal),
    });
  }

  /**
   * Convert the actual entry pad into the same actor frame used by the action.
   * @evidence contracts/common.md#implementation-and-ownership Shares the exact WORLD-to-actor conversion with the external bridge without adding a terminal task to clinical guard return.
   * @evidence contracts/common.md#authoring-interface Requires the actual fixed actor origin/yaw. Returns actor-frame metres including root displacement, before root subtraction.
   */
  export function entryPoint(
    input: MotionAction.Immutable<Entry>,
    frame: MotionAction.Context["frame"],
  ): MotionAction.Vec3 {
    return worldToActor(input.from.pointWorld, frame);
  }

  /**
   * Join the pad's original WORLD task, converting to actor coordinates exactly once.
   * @evidence contracts/common.md#implementation-and-ownership Standard cubic Hermite endpoint conditions preserve both supplied WORLD p/v pairs. No two external tasks or support anchors are averaged and no fit outcome participates in the curve.
   * @evidence contracts/common.md#authoring-interface Returns actor-frame metres before root subtraction. Requires the real actor's fixed origin/yaw; only 0 through endSeconds belongs to this bridge, after which the original action owns its path.
   */
  export function point(
    input: MotionAction.Immutable<Input>,
    elapsed: number,
    frame: MotionAction.Context["frame"],
  ): MotionAction.Vec3 | undefined {
    if (elapsed < 0 || elapsed > input.endSeconds) return undefined;
    if (!frame)
      throw new Error("WORLD continuation requires the actual actor frame");
    const u: number = elapsed / input.endSeconds;
    const a: number = 2 * u ** 3 - 3 * u ** 2 + 1;
    const b: number = u ** 3 - 2 * u ** 2 + u;
    const c: number = -2 * u ** 3 + 3 * u ** 2;
    const d: number = u ** 3 - u ** 2;
    const world: MotionAction.Vec3 = [0, 1, 2].map(
      (index: number): number =>
        a * input.from.pointWorld[index]! +
        b * input.endSeconds * input.from.velocityWorld[index]! +
        c * input.terminal.pointWorld[index]! +
        d * input.endSeconds * input.terminal.velocityWorld[index]!,
    ) as MotionAction.Vec3;
    return worldToActor(world, frame);
  }

  /**
   * Preserve every supplied actual channel value/rate while rejoining its original clinical curve.
   * @evidence contracts/common.md#implementation-and-ownership A compact Hermite correction has entry value/rate and zero terminal value/rate. Original action curves start at rest; their entry is replaced without restarting the other arm or changing body/root. Canonical readApplied supplies existing degree semantics.
   * @evidence contracts/common.md#authoring-interface Consumes the already applied entry snapshot and its known rates. Returns one copied pose with only the declared arm paths changed. Overshoot/public bounds are exposed by actual fitting and strict admission, never silently clamped here.
   */
  export function arm(
    input: MotionAction.Immutable<Input>,
    elapsed: number,
    side: MotionAction.Side,
    original: IAutoMovieHumanPose,
    originalGuard: IAutoMovieHumanPose,
  ): IAutoMovieHumanPose {
    const pose: IAutoMovieHumanPose = structuredClone(original);
    if (elapsed < 0 || elapsed >= input.endSeconds) return pose;
    const entry: IAutoMovieHumanPose = {
      arms: { left: {}, right: {}, [side]: structuredClone(input.arm) },
    };
    const known: Set<string> = new Set(
      input.rates.map(
        (rate: MotionAction.Immutable<Input["rates"][number]>): string =>
          rate.channel,
      ),
    );
    for (const path of leaves(originalGuard.arms?.[side] ?? {}, `arms.${side}`))
      if (!known.has(path))
        throw new Error(
          `Continuation is missing an original-path entry rate: ${path}`,
        );
    const u: number = elapsed / input.endSeconds;
    const a: number = 1 - 3 * u ** 2 + 2 * u ** 3;
    const b: number = u - 2 * u ** 2 + u ** 3;
    for (const rate of input.rates) {
      const initial: number = AutoMovieHumanRigControls.readApplied(
        entry,
        rate.channel,
        [],
      );
      const baseline: number = AutoMovieHumanRigControls.readApplied(
        originalGuard,
        rate.channel,
        [],
      );
      const current: number = AutoMovieHumanRigControls.readApplied(
        original,
        rate.channel,
        [],
      );
      write(
        pose,
        rate.channel,
        current +
          a * (initial - baseline) +
          b * input.endSeconds * rate.degreesPerSecond!,
      );
    }
    return pose;
  }

  /**
   * Finish an already running return at its original guard deadline.
   * @evidence contracts/common.md#implementation-and-ownership Actual owned entry values and every known rate join the original clinical guard with zero joint rate at the existing deadline. Only that arm changes; the original action clock/contact and actual shared body remain separate owners.
   * @evidence contracts/common.md#authoring-interface elapsed is seconds since the already running action's bridge entry, not a restarted action clock. The caller retains its original phase/id and supplies the original guard. Missing rates refuse rather than resetting a finger, wrist or girdle path.
   */
  export function returnArm(
    input: MotionAction.Immutable<Entry>,
    elapsed: number,
    side: MotionAction.Side,
    originalGuard: IAutoMovieHumanPose,
    body: IAutoMovieHumanPose,
  ): IAutoMovieHumanPose {
    const pose: IAutoMovieHumanPose = structuredClone(body);
    const known: Set<string> = new Set(
      input.rates.map(
        (rate: MotionAction.Immutable<Input["rates"][number]>): string =>
          rate.channel,
      ),
    );
    for (const path of leaves(originalGuard.arms?.[side] ?? {}, `arms.${side}`))
      if (!known.has(path))
        throw new Error(
          `Return continuation is missing an original-path entry rate: ${path}`,
        );
    const entry: IAutoMovieHumanPose = {
      arms: { left: {}, right: {}, [side]: structuredClone(input.arm) },
    };
    const u: number = Math.max(0, Math.min(1, elapsed / input.endSeconds));
    for (const rate of input.rates) {
      const initial: number = AutoMovieHumanRigControls.readApplied(
        entry,
        rate.channel,
        [],
      );
      const terminal: number = AutoMovieHumanRigControls.readApplied(
        originalGuard,
        rate.channel,
        [],
      );
      write(
        pose,
        rate.channel,
        (2 * u ** 3 - 3 * u ** 2 + 1) * initial +
          (u ** 3 - 2 * u ** 2 + u) *
            input.endSeconds *
            rate.degreesPerSecond! +
          (-2 * u ** 3 + 3 * u ** 2) * terminal,
      );
    }
    return pose;
  }
}

/** Every present numeric entry leaf must carry an explicit actual tangent. */
function leaves(value: object, prefix: string): string[] {
  return Object.entries(value).flatMap(
    ([key, child]: [string, unknown]): string[] =>
      typeof child === "number"
        ? [AutoMovieHumanRigControls.channel(`${prefix}.${key}`)]
        : child !== null && typeof child === "object"
          ? leaves(child, `${prefix}.${key}`)
          : [],
  );
}
/** Apply an admitted canonical degree leaf without touching another arm or body region. */
function write(
  pose: IAutoMovieHumanPose,
  path: AutoMovieHumanRigControls.DegreeChannel,
  value: number,
): void {
  const parts: string[] = path.split(".");
  let object: object = pose;
  for (const part of parts.slice(0, -1)) {
    const child: unknown = Reflect.get(object, part);
    if (child === undefined) Reflect.set(object, part, {});
    object = Reflect.get(object, part) as object;
  }
  Reflect.set(object, parts.at(-1)!, value);
}
/** Freeze only this small owned data tree; host callables and actor state never enter it. */
function freeze<T extends object>(value: T): MotionAction.Immutable<T> {
  for (const child of Object.values(value))
    if (child !== null && typeof child === "object") freeze(child);
  return Object.freeze(value) as MotionAction.Immutable<T>;
}

/** One fixed WORLD-to-actor conversion; actual root subtraction remains the action's responsibility. */
function worldToActor(
  world: readonly number[],
  frame: MotionAction.Context["frame"],
): MotionAction.Vec3 {
  if (!frame)
    throw new Error("WORLD continuation requires the actual actor frame");
  const local: { x: number; y: number; z: number } = Quaternion.rotateVector(
    Quaternion.fromAxisAngle(
      { x: 0, y: 1, z: 0 },
      (-frame.yawRadians * 180) / Math.PI,
    ),
    {
      x: world[0]! - frame.origin[0],
      y: world[1]! - frame.origin[1],
      z: world[2]! - frame.origin[2],
    },
  );
  return [local.x, local.y, local.z];
}
