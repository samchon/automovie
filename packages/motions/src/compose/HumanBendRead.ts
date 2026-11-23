import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

import type { AutoMovieMotionHumanBendRepeat } from "./AutoMovieMotionHumanBendRepeat";

/**
 * Explicit contextual callbacks owned by the original native writer and raw
 * reader.
 */
export namespace HumanBendRead {
  /**
   * The private writer receives its loan before the otherwise unchanged
   * arguments.
   */
  export type Write = (
    read: AutoMovieMotionHumanBendRepeat.IRead,
    ...args: Parameters<IAutoMovieMotionHumanPrimitive["write"]>
  ) => IAutoMovieMotionHumanPosture;

  /** Raw native reader with an explicit operation loan. */
  export type Posture = (
    read: AutoMovieMotionHumanBendRepeat.IRead,
    seconds: number,
  ) => IAutoMovieMotionHumanPosture;

  /** The original action primitive and its optional contextual dispatcher. */
  export const writes: WeakMap<
    IAutoMovieMotionHumanPrimitive,
    { original: IAutoMovieMotionHumanPrimitive["write"]; invoke: Write }
  > = new WeakMap();

  /** Recheck the actual known primitive before taking its contextual write. */
  export function writer(
    primitive: IAutoMovieMotionHumanPrimitive,
  ): Write | undefined {
    const known = writes.get(primitive);
    return known !== undefined && own(primitive, "write") === known.original
      ? known.invoke
      : undefined;
  }

  /** The contextual counterpart of a genuine native posture callback. */
  export const postures: WeakMap<
    IAutoMovieMotionHumanActionPlan["posture"],
    Posture
  > = new WeakMap();

  /** Actual final performance states observed at their construction boundary. */
  export const resolved: WeakSet<IAutoMovieMotionHumanPerformanceState> =
    new WeakSet();

  /** The actual source captured only by the scheduled segment allocator. */
  interface IAutoMovieBendReadSegment {
    plan: IAutoMovieMotionHumanActionPlan;
    posture: IAutoMovieMotionHumanActionPlan["posture"];
    start: number;
    duration: number;
    readFrom: number;
  }

  /** Only selected native operate plans can publish a numeric-trial phase start. */
  export const starts: WeakMap<IAutoMovieMotionHumanActionPlan, number> =
    new WeakMap();

  /** A receiver and plan proved at their original installation. */
  const segments: WeakMap<
    IAutoMovieMotionHumanSegment,
    IAutoMovieBendReadSegment
  > = new WeakMap();

  /** Bind installed raw posture and duration only for an actual native segment. */
  export function placed(segment: IAutoMovieMotionHumanSegment): void {
    const plan: IAutoMovieMotionHumanActionPlan = segment.plan;
    const readFrom: number | undefined = starts.get(plan);
    if (readFrom === undefined) return;
    const posture: IAutoMovieMotionHumanActionPlan["posture"] | undefined =
      Object.getOwnPropertyDescriptor(plan, "posture")?.value;
    const duration: unknown = own(plan, "duration");
    if (
      posture === undefined ||
      !postures.has(posture) ||
      typeof duration !== "number"
    )
      return;
    segments.set(segment, {
      plan,
      posture,
      start: segment.start,
      duration,
      readFrom,
    });
  }

  /**
   * Read the proved native phase, or leave the original caller to perform its
   * exact expression.
   */
  export function sample(
    state: IAutoMovieMotionHumanPerformanceState,
    segment: IAutoMovieMotionHumanSegment,
    seconds: number,
    sweep: AutoMovieMotionHumanBendRepeat,
  ): IAutoMovieMotionHumanPosture | undefined {
    if (!resolved.has(state) || own(state, "resolving") !== false)
      return undefined;
    const entry: IAutoMovieBendReadSegment | undefined = segments.get(segment);
    if (
      entry === undefined ||
      own(segment, "plan") !== entry.plan ||
      !Object.is(own(segment, "start"), entry.start) ||
      own(entry.plan, "posture") !== entry.posture ||
      !Object.is(own(entry.plan, "duration"), entry.duration)
    )
      return undefined;
    const at: number = Math.min(
      entry.duration,
      Math.max(0, seconds - entry.start),
    );
    if (!(at >= entry.readFrom)) return undefined;
    return postures.get(entry.posture)?.(sweep.read(entry.plan), at);
  }
}

/** Inspect only previously authenticated own objects. */
function own(owner: object, key: string): unknown {
  const descriptor: PropertyDescriptor | undefined =
    Object.getOwnPropertyDescriptor(owner, key);
  return descriptor !== undefined && Object.hasOwn(descriptor, "value")
    ? descriptor.value
    : undefined;
}
