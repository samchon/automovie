import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

import type { AutoMovieMotionHumanBendRepeat } from "./AutoMovieMotionHumanBendRepeat";

/**
 * Explicit contextual callbacks owned by the original native writer and raw reader.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines native contextual callback purpose and scope.
 * @evidence contracts/development/design.md#principled-representation Uses weak identities of actual producers paired with synchronous explicit loan callbacks.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only composer, original writer and raw placement register or select counterparts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Foreign segments and changed descriptors keep the ordinary dispatch.
 */
export namespace HumanBendRead {
  /**
   * The private writer receives its loan before the otherwise unchanged arguments.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The writer receives the exact native loan plus the original primitive inputs.
   * @evidence contracts/development/design.md#principled-representation One synchronous writer accepts the existing original primitive parameter list unchanged.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the native companion uses this callback.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Opaque writers keep the original path and argument list.
   */
  export type Write = (
    read: AutoMovieMotionHumanBendRepeat.IRead,
    ...args: Parameters<IAutoMovieMotionHumanPrimitive["write"]>
  ) => IAutoMovieMotionHumanPosture;

  /**
   * Raw native reader with an explicit operation loan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the native raw posture and film-relative loan.
   * @evidence contracts/development/design.md#principled-representation The same compositor executes with one per-evaluation explicit loan.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the native companion uses this callback.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Opaque writers keep the original path and argument list.
   */
  export type Posture = (
    read: AutoMovieMotionHumanBendRepeat.IRead,
    seconds: number,
  ) => IAutoMovieMotionHumanPosture;

  /** The original action primitive and its optional contextual dispatcher. */
  export const writes: WeakMap<
    IAutoMovieMotionHumanPrimitive,
    { original: IAutoMovieMotionHumanPrimitive["write"]; invoke: Write }
  > = new WeakMap();

  /**
   * Recheck the actual known primitive before taking its contextual write.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Checks existing writer identity before returning the contextual companion.
   * @evidence contracts/development/implementation.md#principled-implementation Weak identity before checking the known own writer descriptor.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One weak lookup and one descriptor check.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Original callback or descriptor mismatch preserves ordinary dispatch.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant-work eligibility with no frame history.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only genuine equivalent numeric search may reuse a result within this sweep.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Weak identities retain no completed pose, and explicit results belong to the caller.
   */
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

  /**
   * Bind installed raw posture and duration only for an actual native segment.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Binds the actual current segment, posture and native phase start.
   * @evidence contracts/development/implementation.md#principled-implementation Starts receipt precedes inspection of known plan descriptors.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Bounded own reads and one weak identity receipt.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Original callback or descriptor mismatch preserves ordinary dispatch.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant-work eligibility with no frame history.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only genuine equivalent numeric search may reuse a result within this sweep.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Weak identities retain no completed pose, and explicit results belong to the caller.
   */
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
   * Read the proved native phase, or leave the original caller to perform its exact expression.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines guarded raw read and ordinary fallback.
   * @evidence contracts/development/implementation.md#principled-implementation Checks same native state, actual selected segment, current plan, timing and dispatch before evaluating.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Bounded own identity/film-time checks precede the full existing posture writer.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Original callback or descriptor mismatch preserves ordinary dispatch.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant-work eligibility with no frame history.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only genuine equivalent numeric search may reuse a result within this sweep.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Weak identities retain no completed pose, and explicit results belong to the caller.
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
