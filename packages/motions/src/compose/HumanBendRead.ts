import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

import type { AutoMovieMotionHumanBendRepeat } from "./AutoMovieMotionHumanBendRepeat";

/**
 * The numerical trial's read of a proved native phase: the plan's own posture
 * evaluated with the trial's bend loan as its explicit evaluation.
 */
export namespace HumanBendRead {
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
    if (posture === undefined || typeof duration !== "number") return;
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
    return entry.plan.posture(at, undefined, undefined, undefined, {
      bend: sweep.read(entry.plan),
    });
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
