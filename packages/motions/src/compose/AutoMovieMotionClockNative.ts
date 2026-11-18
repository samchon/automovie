import { minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionEvent,
} from "@automovie/interface";

import { AutoMovieMotionInterval } from "./AutoMovieMotionInterval";

/**
 * Clock construction and the readers that resolve a fixed window's two
 * instants once for every sample read on it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Owns validated named times, the clock's query closures and the fixed-window and envelope readers; the public Clock facade keeps the vocabulary.
 * @evidence contracts/development/design.md#principled-representation A constructor-owned map fixes action-local seconds for the clock's life, so a window's two instants are constants of it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Construction and the two prepared readers the facade exposes; nothing else.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sampled value, pose or callback result is kept; no action family receives a branch.
 */
export namespace AutoMovieMotionClockNative {
  /** Every action's opening name, at zero seconds. */
  export const START: string = "start";

  /** Every action's closing name, at its duration. */
  export const END: string = "end";

  /**
   * Construct a validated clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines positive duration, unique and reserved names, the 1e-9 s endpoint allowance, sorted instants, unknown-name errors and fresh event records.
   * @evidence contracts/development/implementation.md#principled-implementation Named times use one map; clamped uniform progress delegates to Interval and minimum-jerk progress to the engine profile (Flash and Hogan 1985). The envelope is max(0, rise progress minus fall progress).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Validate and build the map, build the sorted public records, then the at, linear, progress and envelope closures over the map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A repeated or reserved name and an instant outside the duration throw; an unknown name throws at its query.
   * @evidence contracts/development/implementation.md#efficient-algorithms Construction scans N instants and sorts them in O(N log N); each query is constant map and arithmetic work, and events are O(N) fresh output.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The closures share the constructor's map and the numeric interval and profile owners.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The clock owns its map, sorted array and closures until release; it retains no query time, event result or handle.
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
    const linear = (from: string, to: string, seconds: number): number =>
      AutoMovieMotionInterval.linear(at(from), at(to), seconds);
    const progress = (from: string, to: string, seconds: number): number =>
      minimumJerk.share(linear(from, to, seconds));
    const envelope: IClock["envelope"] = (rise: readonly [string, string],
      fall: readonly [string, string], seconds: number): number =>
      Math.max(0, progress(rise[0], rise[1], seconds) - progress(fall[0], fall[1], seconds));
    return new NativeClock({
      duration, instants: sorted, at, linear, progress, envelope,
      events: (): IAutoMovieMotionEvent[] => sorted.map((i: IInstant): IAutoMovieMotionEvent => ({
        name: i.name, share: i.seconds / duration,
      })),
    });
  }

  /**
   * A fixed window's uniform and minimum-jerk readers, its two instants
   * resolved at the first native sample and kept for the rest. A custom
   * clock's requested callback owns each read.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed names, the action-local seconds read and that an unknown name throws at the first sample.
   * @evidence contracts/development/implementation.md#principled-implementation A clock's named times are fixed for its life, so the window's two seconds read once give every later sample the same interval the clock's own linear and progress compute.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lazy interval feeds the original native callbacks through the constructor's lookup. A custom or replaced callback receives the clock as receiver.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every native sample still runs the interval arithmetic and the profile. Custom samples keep current callbacks and do not probe unrelated clock methods.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two name lookups once on a native clock, then constant arithmetic per sample. Custom reads add one callback invocation to their clock's own work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the window's two seconds are shared, a constant of the clock.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader retains the clock, two names and at most one two-number interval until release.
   */
  export function prepare(clock: IClock, from: string, to: string): AutoMovieMotionInterval.IPrepared {
    const original: IClock | undefined = NativeClock.original(clock);
    if (original === undefined)
      return {
        linear: (seconds: number): number => clock.linear(from, to, seconds),
        progress: (seconds: number): number => clock.progress(from, to, seconds),
      };
    let ready: AutoMovieMotionInterval.IPrepared | undefined;
    const interval = (): AutoMovieMotionInterval.IPrepared =>
      (ready ??= AutoMovieMotionInterval.prepare(original, from, to));
    return {
      linear: (seconds: number): number => {
        const read: IClock["linear"] = clock.linear;
        return read === original.linear
          ? interval().linear(seconds)
          : Reflect.apply(read, clock, [from, to, seconds]);
      },
      progress: (seconds: number): number => {
        const read: IClock["progress"] = clock.progress;
        return read === original.progress
          ? interval().progress(seconds)
          : Reflect.apply(read, clock, [from, to, seconds]);
      },
    };
  }

  /**
   * A fixed rise and fall's envelope, each window's instants resolved at
   * its first native use and kept for the rest. A custom clock receives its
   * own two name tuples at every requested sample.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Copies the four names and states that the rise is resolved before the fall, at the first sample, as the clock's own envelope reads them.
   * @evidence contracts/development/implementation.md#principled-implementation The clock's envelope is the rise's progress less the fall's, clamped at zero; both windows' seconds are constants of the clock.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The original envelope uses two lazy intervals from the constructor's lookup and one clamp. A custom or replaced envelope callback handles its own sample.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Native reads keep their clamp, easing and rise-before-fall order. A custom read keeps its receiver and its result, and retained callback tuples cannot change the prepared names.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four name lookups once on a native clock, then two progress evaluations per sample without tuples. Each custom read makes the two distinct tuples its callback receives.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the two windows' seconds are shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader retains the clock, four names and at most two intervals until release.
   */
  export function prepareEnvelope(clock: IClock, rise: readonly [string, string],
    fall: readonly [string, string]): (seconds: number) => number {
    const riseFrom: string = rise[0];
    const riseTo: string = rise[1];
    const fallFrom: string = fall[0];
    const fallTo: string = fall[1];
    const original: IClock | undefined = NativeClock.original(clock);
    if (original === undefined)
      return (seconds: number): number =>
        clock.envelope([riseFrom, riseTo], [fallFrom, fallTo], seconds);
    let rising: AutoMovieMotionInterval.IPrepared | undefined;
    let falling: AutoMovieMotionInterval.IPrepared | undefined;
    return (seconds: number): number => {
      const read: IClock["envelope"] = clock.envelope;
      if (read !== original.envelope)
        return Reflect.apply(read, clock, [[riseFrom, riseTo], [fallFrom, fallTo], seconds]);

      rising ??= AutoMovieMotionInterval.prepare(original, riseFrom, riseTo);
      const grown: number = rising.progress(seconds);
      falling ??= AutoMovieMotionInterval.prepare(original, fallFrom, fallTo);
      return Math.max(0, grown - falling.progress(seconds));
    };
  }
}

/** The clock record, the interface's. */
type IClock = IAutoMovieMotionClock;

/** Distinguishes factory clocks without probing a custom clock or retaining a registry. */
class NativeClock {
  /** Constructor-owned queries, also used as the factory's private brand. */
  readonly #original: IClock;

  /** Duration and public readers are assigned as own properties by the constructor. */
  declare duration: IClock["duration"];
  declare instants: IClock["instants"];
  declare at: IClock["at"];
  declare linear: IClock["linear"];
  declare progress: IClock["progress"];
  declare envelope: IClock["envelope"];
  declare events: IClock["events"];

  /** Move the factory's public fields and closures onto the branded record. */
  public constructor(clock: IClock) {
    this.#original = clock;
    Object.assign(this, clock);
  }

  /** Read the original queries only on the actual factory receiver. */
  public static original(clock: IClock): IClock | undefined {
    return #original in clock ? clock.#original : undefined;
  }
}

/** A named instant, the interface's. */
type IInstant = IAutoMovieMotionClockInstant;
