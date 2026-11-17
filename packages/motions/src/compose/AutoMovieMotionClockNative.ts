import { minimumJerk } from "@automovie/engine";
import type { IAutoMovieMotionEvent } from "@automovie/interface";

import type { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import { AutoMovieMotionInterval } from "./AutoMovieMotionInterval";

/**
 * Clock construction and the private provenance of its original query closures.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Owns validated named times, original closure identity and guarded fixed-window/envelope readers; the public Clock facade keeps the existing vocabulary.
 * @evidence contracts/development/design.md#principled-representation A constructor-owned map fixes action-local seconds; only its actual original closures justify prepared numeric intervals, while all other callbacks retain their own behavior.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Construction and three existing/new prepared query forms share one private registry; no registration hook or caller-supplied native verdict is exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The registry stores only clocks actually constructed here, never sampled values, poses or user callback results; no action family receives a special branch.
 */
export namespace AutoMovieMotionClockNative {
  /** Every action's opening name, at zero seconds. */
  export const START: string = "start";

  /** Every action's closing name, at its duration. */
  export const END: string = "end";

  /**
   * Construct the original validated clock and privately retain its closures.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines positive duration, unique/reserved names, original 1e-9 endpoint allowance, sorted instants, unknown-name errors and fresh event records.
   * @evidence contracts/development/implementation.md#principled-implementation Named times use one map; clamped uniform progress delegates to Interval and minimum-jerk progress to the engine profile (Flash and Hogan 1985). Envelope retains max(0,rise-progress minus fall-progress) in that evaluation order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Validate/build the map, build sorted public records, then create the same private at/linear/progress/envelope closures and register their actual references.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All original validation, lookup order, subtraction/clamp/easing grouping and event allocation remain unchanged; no public property replacement changes the closures' private dependencies.
   * @evidence contracts/development/implementation.md#efficient-algorithms Construction scans N instants and sorts their records in O(N log N); native scalar queries cost constant map/arithmetic work and events retain O(N) fresh output.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Original closures share only the constructor's fixed named-time map and numeric interval/profile owners; the private identity record later proves which requested callees retain that exact domain.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The clock owns its named map, sorted array and original closures until release. A weak constructor registry retains no clock key, query time, event result or external handle.
   */
  export function of(duration: number, instants: readonly IInstant[]): IClock {
    if (!(duration > 0)) throw new Error("A clock lasts a positive time");
    const times: Map<string, number> = new Map([[START, 0], [END, duration]]);
    for (const instant of instants) {
      if (times.has(instant.name)) throw new Error(`A clock names "${instant.name}" once`);
      if (!(instant.seconds >= 0 && instant.seconds <= duration + 1e-9))
        throw new Error(`The instant "${instant.name}" lies outside the clock's duration`);
      times.set(instant.name, Math.min(duration, instant.seconds));
    }
    const sorted: IInstant[] = instants.map((i: IInstant): IInstant => ({
      name: i.name, seconds: times.get(i.name)!,
    })).sort((a: IInstant, b: IInstant): number => a.seconds - b.seconds);
    const at = (name: string): number => {
      const seconds: number | undefined = times.get(name);
      if (seconds === undefined) throw new Error(`The clock has no instant "${name}"`);
      return seconds;
    };
    const linear = (from: string, to: string, seconds: number): number => {
      const a: number = at(from);
      const b: number = at(to);
      return AutoMovieMotionInterval.linear(a, b, seconds);
    };
    const progress = (from: string, to: string, seconds: number): number =>
      minimumJerk.share(linear(from, to, seconds));
    const envelope: IClock["envelope"] = (rise: readonly [string, string],
      fall: readonly [string, string], seconds: number): number =>
      Math.max(0, progress(rise[0], rise[1], seconds) - progress(fall[0], fall[1], seconds));
    const clock: IClock = {
      duration, instants: sorted, at, linear, progress, envelope,
      events: (): IAutoMovieMotionEvent[] => sorted.map((i: IInstant): IAutoMovieMotionEvent => ({
        name: i.name, share: i.seconds / duration,
      })),
    };
    NATIVE.set(clock, { at, linear, progress, envelope });
    return clock;
  }

  /**
   * Prepare fixed numeric intervals only for their original requested callee.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each actual sample captures only its requested public method once. Exact native identity resolves private names lazily; foreign/replaced callbacks keep the actual clock receiver and their own admission.
   * @evidence contracts/development/implementation.md#principled-implementation Constructor linear/progress depend on private at, not later public at/other-method replacements; exact requested-callee identity therefore proves only the same fixed interval.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A weak constructor lookup and one lazy numeric interval feed two guarded readers; captured foreign callees dispatch through Reflect.apply.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No unrelated public getter or replaceable function.call property is read, and no current callee is read twice or replaced by a sampled value.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two native name lookups occur once; each native sample keeps one callee lookup/identity check and scalar arithmetic. Foreign dispatch adds one three-value argument array but preserves its actual callback; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only original private named times share preparation; requested-method replacement selects the actual captured callback, independently of unrelated public properties.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader owns clock, fixed names and optional numeric interval until release, with no time/result history, callback answer or handle retained.
   */
  export function prepare(clock: IClock, from: string, to: string): AutoMovieMotionInterval.IPrepared {
    const native: NativeClock | undefined = NATIVE.get(clock);
    let ready: AutoMovieMotionInterval.IPrepared | undefined;
    const interval = (methods: NativeClock): AutoMovieMotionInterval.IPrepared => {
      if (ready === undefined) ready = AutoMovieMotionInterval.prepare({ at: methods.at }, from, to);
      return ready;
    };
    return {
      linear: (seconds: number): number => {
        const run: IClock["linear"] = clock.linear;
        return native !== undefined && run === native.linear
          ? interval(native).linear(seconds) : Reflect.apply(run, clock, [from, to, seconds]);
      },
      progress: (seconds: number): number => {
        const run: IClock["progress"] = clock.progress;
        return native !== undefined && run === native.progress
          ? interval(native).progress(seconds) : Reflect.apply(run, clock, [from, to, seconds]);
      },
    };
  }

  /**
   * Prepare fixed envelope names without observing unused public clock methods.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Copies four fixed names and captures envelope once per actual sample; original native closure uses lazy private intervals, while foreign/replaced callbacks receive fresh rise/fall tuples and their original clock receiver.
   * @evidence contracts/development/implementation.md#principled-implementation The constructor envelope closes private progress. Its two fixed intervals are therefore invariant only while the requested envelope callee remains that original closure; rise evaluation precedes fall admission exactly as before.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One constructor lookup, copied names and two lazy interval slots feed native evaluation; all other callees use one Reflect.apply with fresh argument arrays.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains original Math.max(0,rise minus fall), easing, endpoint rules and error order. No endpoint is admitted before a native call, no unrelated public getter is probed, and mutable foreign argument tuples cannot poison later samples.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four private native name lookups occur once, with no per-native-sample tuple allocation; every sample still evaluates both scalar progresses in order. Foreign dispatch retains its actual callback and allocates fresh tuples/argument list; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the explicit fixed names and constructor-private interval metadata are shared. Every actual second and current envelope callee is read normally, with no callback/sample result cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The action reader retains one clock, four name strings and at most two numeric interval records until release. Fresh foreign tuples are not retained here; no pose, queried second, caller tuple or result history is stored.
   */
  export function prepareEnvelope(clock: IClock, rise: readonly [string, string],
    fall: readonly [string, string]): (seconds: number) => number {
    const riseFrom: string = rise[0];
    const riseTo: string = rise[1];
    const fallFrom: string = fall[0];
    const fallTo: string = fall[1];
    const native: NativeClock | undefined = NATIVE.get(clock);
    let rising: AutoMovieMotionInterval.IPrepared | undefined;
    let falling: AutoMovieMotionInterval.IPrepared | undefined;
    return (seconds: number): number => {
      const run: IClock["envelope"] = clock.envelope;
      if (native === undefined || run !== native.envelope) {
        const up: [string, string] = [riseFrom, riseTo];
        const down: [string, string] = [fallFrom, fallTo];
        return Reflect.apply(run, clock, [up, down, seconds]);
      }
      if (rising === undefined)
        rising = AutoMovieMotionInterval.prepare({ at: native.at }, riseFrom, riseTo);
      const grown: number = rising.progress(seconds);
      if (falling === undefined)
        falling = AutoMovieMotionInterval.prepare({ at: native.at }, fallFrom, fallTo);
      return Math.max(0, grown - falling.progress(seconds));
    };
  }
}

/** Public record shape remains owned by the Clock facade's original interface. */
type IClock = AutoMovieMotionClock.IClock;

/** Constructor instant data retains the original named seconds representation. */
type IInstant = AutoMovieMotionClock.IInstant;

/** Only actual constructor closures prove fixed native query semantics. */
type NativeClock = Pick<IClock, "at" | "linear" | "progress" | "envelope">;

/** No registration API can assert native identity for an externally supplied clock. */
const NATIVE: WeakMap<IClock, NativeClock> = new WeakMap();
