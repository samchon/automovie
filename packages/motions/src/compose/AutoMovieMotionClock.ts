import { minimumJerk } from "@automovie/engine";
import type { IAutoMovieMotionEvent } from "@automovie/interface";

/**
 * The clock of one action: its duration and its named instants, and the only
 * owner of progress between two of them.
 *
 * A primitive asks the clock how far the action is between two instants and
 * never does window arithmetic of its own, so every channel of an action
 * moves on the same instants and a partner's action or an interrupt row reads
 * the same names. The shared names are Kendon's gesture phases with a
 * contact (Kendon 1980; McNeill 1992): `prepare`, `strokeStart`, `contact`,
 * `strokeEnd`, `retract`. A family adds its own (`chamber`, `takeoff`,
 * `landing`). `start` and `end` always exist, at 0 and at the duration.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a clock owns, why a primitive asks it instead of computing windows, where the shared instant names come from and which two always exist.
 * @evidence contracts/development/design.md#principled-representation An action's timing is a duration and named instants in seconds, the phase boundaries of gesture research; every window is a pair of names, so a row never repeats a number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two constructors, the clock they return and the two records they take; it names no body part, so any performer's action can use it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Instants are plain records and names are checked when the clock is built; an unknown name throws instead of reading as zero.
 */
export namespace AutoMovieMotionClock {
  /** The instant every clock has at 0 seconds. */
  export const START: string = "start";

  /** The instant every clock has at its duration. */
  export const END: string = "end";

  /**
   * A named instant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is; each member gives its unit, its range and the reserved names.
   * @evidence contracts/development/design.md#principled-representation A name and its time in seconds since the action's start, the unit every plan is evaluated in.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, the least that places an instant; read by the clock's constructor and returned in its sorted list.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both members are required and plain; no share of the duration is stored beside the seconds it would repeat.
   */
  export interface IInstant {
    /** Name, unique within the clock; never `start` or `end`. */
    name: string;

    /** Seconds since the action's start, in [0, duration]. */
    seconds: number;
  }

  /**
   * One phase of a sequence: the instant that opens it and how long it lasts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what a phase is and how its name relates to the clock's instants; each member gives its unit.
   * @evidence contracts/development/design.md#principled-representation A law decides phase lengths (a reach's travel time, a hold), so a phase carries a length and the clock derives the instants by summing.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, read only by `sequence`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both members are required and plain; a length of zero is allowed and means two instants at one time.
   */
  export interface IPhase {
    /** The instant that opens the phase. */
    name: string;

    /** The phase's length, seconds; not negative. */
    seconds: number;
  }

  /**
   * A clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its arguments, its unit, its value outside the window and what it throws.
   * @evidence contracts/development/design.md#principled-representation Progress between two named instants in the two forms a movement needs, uniform and minimum-jerk, plus the rise-and-fall envelope built from them and the instants as plan events.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five queries over two data members; every window computation of an action goes through them, so no primitive owns one.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Windows are pairs of names checked against the clock, never raw seconds, and no member is optional.
   */
  export interface IClock {
    /** Duration, seconds; positive. */
    duration: number;

    /** The named instants in time order, without `start` and `end`. */
    instants: readonly IInstant[];

    /**
     * When an instant is.
     *
     * @param name The instant.
     * @returns Seconds since the action's start.
     * @throws {Error} On an unknown name.
     */
    at(name: string): number;

    /**
     * Uniform progress between two instants.
     *
     * @param from The opening instant.
     * @param to The closing instant.
     * @param seconds Seconds since the action's start.
     * @returns 0 until `from`, 1 from `to`, linear between; a window of no length steps at `to`.
     */
    linear(from: string, to: string, seconds: number): number;

    /**
     * Minimum-jerk progress between two instants (Flash and Hogan 1985): the
     * bell-shaped speed of a point-to-point movement, at rest at both ends.
     *
     * @param from The opening instant.
     * @param to The closing instant.
     * @param seconds Seconds since the action's start.
     * @returns 0 until `from`, 1 from `to`.
     */
    progress(from: string, to: string, seconds: number): number;

    /**
     * How present something is that rises over one window and falls over a
     * later one: the rise's progress less the fall's.
     *
     * @param rise The window it rises over.
     * @param fall The window it falls over.
     * @param seconds Seconds since the action's start.
     * @returns A value in [0, 1].
     */
    envelope(
      rise: readonly [string, string],
      fall: readonly [string, string],
      seconds: number,
    ): number;

    /**
     * The instants as plan events.
     *
     * @returns One event per named instant, as a share of the duration.
     */
    events(): IAutoMovieMotionEvent[];
  }

  /**
   * A clock from a duration and its named instants.
   *
   * @param duration Duration, seconds.
   * @param instants The named instants, in any order.
   * @returns The clock.
   * @throws {Error} On a duration that is not positive, a reserved or repeated name, or an instant outside the duration.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, their order, the result and each refused input.
   * @evidence contracts/development/implementation.md#principled-implementation Uniform progress is the clamped linear map of the window, minimum-jerk progress is `minimumJerk` of it (Flash and Hogan 1985), and the envelope is the rise's progress less the fall's, clamped at zero.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One name-to-seconds map checked once, and four closures over it; `progress` and `envelope` are built on `linear`, so the window rule exists once.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A repeated or reserved name, an instant outside the duration and an unknown name throw; the only tolerance is 1e-9 s on the duration's end, for an instant computed as a sum of phase lengths.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each query is two map lookups and a polynomial, constant time, which matters because every primitive asks at every evaluated second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `minimumJerk`, the engine's one owner of the minimum-jerk profile.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains one map and one sorted array of the instants given, for the clock's own lifetime.
   */
  export function of(duration: number, instants: readonly IInstant[]): IClock {
    if (!(duration > 0)) throw new Error("A clock lasts a positive time");
    const times: Map<string, number> = new Map([
      [START, 0],
      [END, duration],
    ]);
    for (const instant of instants) {
      if (times.has(instant.name))
        throw new Error(`A clock names "${instant.name}" once`);
      if (!(instant.seconds >= 0 && instant.seconds <= duration + 1e-9))
        throw new Error(
          `The instant "${instant.name}" lies outside the clock's duration`,
        );
      times.set(instant.name, Math.min(duration, instant.seconds));
    }
    const sorted: IInstant[] = instants
      .map(
        (i: IInstant): IInstant => ({
          name: i.name,
          seconds: times.get(i.name)!,
        }),
      )
      .sort((a: IInstant, b: IInstant): number => a.seconds - b.seconds);
    const at = (name: string): number => {
      const seconds: number | undefined = times.get(name);
      if (seconds === undefined)
        throw new Error(`The clock has no instant "${name}"`);
      return seconds;
    };
    const linear = (from: string, to: string, seconds: number): number => {
      const a: number = at(from);
      const b: number = at(to);
      if (b - a < 1e-12) return seconds >= b ? 1 : 0;
      return Math.min(1, Math.max(0, (seconds - a) / (b - a)));
    };
    const progress = (from: string, to: string, seconds: number): number =>
      minimumJerk(linear(from, to, seconds)).s;
    return {
      duration,
      instants: sorted,
      at,
      linear,
      progress,
      envelope: (
        rise: readonly [string, string],
        fall: readonly [string, string],
        seconds: number,
      ): number =>
        Math.max(
          0,
          progress(rise[0], rise[1], seconds) -
            progress(fall[0], fall[1], seconds),
        ),
      events: (): IAutoMovieMotionEvent[] =>
        sorted.map(
          (i: IInstant): IAutoMovieMotionEvent => ({
            name: i.name,
            share: i.seconds / duration,
          }),
        ),
    };
  }

  /**
   * A clock from phases laid end to end: each phase's name is the instant
   * that opens it, and the duration is the sum of the lengths.
   *
   * @param phases The phases in order.
   * @returns The clock.
   * @throws {Error} On a negative length, or what {@link of} refuses.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States how phases become instants, what the duration is and each refused input.
   * @evidence contracts/development/implementation.md#principled-implementation An instant is the running sum of the lengths before it, so the phases tile the duration without a gap.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop that accumulates the lengths, then `of`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A negative length throws instead of being clamped; every other check is `of`'s.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Builds the clock through `of`, so both constructors share one validation.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One pass over a handful of phases, with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing of its own; the clock it returns is `of`'s.
   */
  export function sequence(phases: readonly IPhase[]): IClock {
    const instants: IInstant[] = [];
    let seconds: number = 0;
    for (const phase of phases) {
      if (!(phase.seconds >= 0))
        throw new Error(`The phase "${phase.name}" has a negative length`);
      instants.push({ name: phase.name, seconds });
      seconds += phase.seconds;
    }
    return of(seconds, instants);
  }

  /**
   * The lengths of a phrase's six phases, seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is; each member names the two instants it lies between and its value when absent.
   * @evidence contracts/development/design.md#principled-representation The phases of a gesture (Kendon 1980: preparation, hold, stroke, hold, retraction), with the stroke split at its decisive instant as BML 1.0 splits it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, the lengths between the seven standard instants; read only by `phrase`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The three phases a movement may lack are optional and read as zero, which puts two instants at one time instead of removing a name.
   */
  export interface IPhrase {
    /** From `start` to `ready`: the part leaves rest for where its stroke starts. */
    prepare: number;

    /** From `ready` to `strokeStart`: the part waits there; 0 when absent. */
    wait?: number;

    /** From `strokeStart` to `stroke`: the stroke up to its decisive instant. */
    attack: number;

    /** From `stroke` to `strokeEnd`: the stroke after it; 0 when absent. */
    follow?: number;

    /** From `strokeEnd` to `relax`: the part stays where the stroke left it; 0 when absent. */
    hold?: number;

    /** From `relax` to `end`: the part returns to rest. */
    retract: number;
  }

  /**
   * The standard instants of a phrase in time order, between `start` and
   * `end`: the synchronisation points BML 1.0 gives every behaviour.
   */
  export const PHRASE: readonly [
    "ready",
    "strokeStart",
    "stroke",
    "strokeEnd",
    "relax",
  ] = ["ready", "strokeStart", "stroke", "strokeEnd", "relax"];

  /**
   * A clock with the standard instants of a phrase: `start`, `ready`,
   * `strokeStart`, `stroke` (the instant of contact or of greatest extent),
   * `strokeEnd`, `relax`, `end`. A phase of no length puts its two instants at
   * one time, so every phrase has every name and two actions can be aligned
   * by any of them.
   *
   * @param durations The six phase lengths.
   * @returns The clock.
   * @throws {Error} On a negative length, or a phrase of no length.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the instants, what a phase of no length does and each refused input.
   * @evidence contracts/development/implementation.md#principled-implementation Each standard instant is the running sum of the phase lengths before it, and the duration is their total.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One list of the six lengths in order, one loop, then `of`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A negative length throws instead of being clamped; a total of zero is refused by `of`.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Builds the clock through `of`, so every constructor shares one validation.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One pass over six lengths, with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing of its own; the clock it returns is `of`'s.
   */
  export function phrase(durations: IPhrase): IClock {
    const lengths: readonly number[] = [
      durations.prepare,
      durations.wait ?? 0,
      durations.attack,
      durations.follow ?? 0,
      durations.hold ?? 0,
      durations.retract,
    ];
    const instants: IInstant[] = [];
    let seconds: number = 0;
    lengths.forEach((length: number, i: number): void => {
      if (!(length >= 0)) throw new Error("A phrase's phase has a negative length");
      seconds += length;
      if (i < PHRASE.length) instants.push({ name: PHRASE[i]!, seconds });
    });
    return of(seconds, instants);
  }

  /**
   * Phases laid end to end a number of times, for a movement that repeats (a
   * wave, a pump, a key press). Each repetition's phases are numbered from 1:
   * `down` and `up` repeated twice are `down1`, `up1`, `down2`, `up2`.
   *
   * @param span The phases of one repetition, in order.
   * @param count How many repetitions; a positive integer.
   * @returns The phases, for {@link sequence}.
   * @throws {Error} On a count that is not a positive integer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the numbering by example, the result's consumer and the refused count.
   * @evidence contracts/development/implementation.md#principled-implementation A periodic movement is one period's phases repeated, so each repetition keeps the period's names with its ordinal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One nested map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A count of zero or a fraction throws instead of yielding an empty or a truncated list; lengths are validated by `sequence`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the phases produced, with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function repeat(span: readonly IPhase[], count: number): IPhase[] {
    if (!(Number.isInteger(count) && count > 0))
      throw new Error("A movement repeats a positive whole number of times");
    return Array.from({ length: count }, (_: unknown, i: number): IPhase[] =>
      span.map(
        (phase: IPhase): IPhase => ({
          name: `${phase.name}${i + 1}`,
          seconds: phase.seconds,
        }),
      ),
    ).flat();
  }

  /**
   * Progress of a movement that passes a point at speed: a minimum-jerk
   * movement from `from` to `to` scaled so it is 1 at `at`, the instant the
   * point is passed, and more than 1 after it. When `to` is at `at` the
   * movement is arrested at its peak speed (a fist met by a body): it is the
   * first half of a minimum-jerk movement, and stays 1 from then on.
   *
   * @param clock The clock.
   * @param window The instants the movement starts, passes the point and ends at.
   * @param seconds Seconds since the action's start.
   * @returns 0 until the start, 1 at the point, the overshoot's share after it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the movement, what 1 means, the arrested case and the value before, at and after the point.
   * @evidence contracts/development/implementation.md#principled-implementation One minimum-jerk unit (Flash and Hogan 1985) spans the whole window, and the point is passed at the share of the unit's time the first span takes; dividing by the unit's travel at that share makes the point 1. An arrested movement takes the share 0.5, where the unit's speed peaks.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The unit's time is the first span's linear progress up to the point and the second span's after it, then one ratio of two profile values.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A first span under 1e-12 s steps at the point instead of dividing by it, and a second span under 1e-9 s reads as arrested; no other tolerance.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the windows through the clock's `linear` and the profile through `minimumJerk`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function through(
    clock: IClock,
    window: readonly [string, string, string],
    seconds: number,
  ): number {
    const a: number = clock.at(window[0]);
    const b: number = clock.at(window[1]);
    const c: number = clock.at(window[2]);
    if (b - a < 1e-12) return seconds >= b ? 1 : 0;
    const arrested: boolean = c - b < 1e-9;
    const k: number = arrested ? 0.5 : (b - a) / (c - a);
    const u: number =
      seconds <= b || arrested
        ? k * clock.linear(window[0], window[1], seconds)
        : k + (1 - k) * clock.linear(window[1], window[2], seconds);
    return minimumJerk(u).s / minimumJerk(k).s;
  }

  /**
   * A movement back and forth about a pose between two instants: a sine of a
   * whole number of cycles, grown over its first half cycle and shrunk over
   * its last on the minimum-jerk profile, so it leaves and rejoins the pose
   * at rest.
   *
   * @param clock The clock.
   * @param window The instants the movement starts and ends at.
   * @param cycles How many cycles; a positive integer.
   * @param seconds Seconds since the action's start.
   * @returns A value in [-1, 1]; 0 outside the window.
   * @throws {Error} On a cycle count that is not a positive integer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the shape, how it starts and ends, the range, the value outside the window and the refused count.
   * @evidence contracts/development/implementation.md#principled-implementation A sine of whole cycles is zero at both ends of the window; the product of two minimum-jerk ramps, each one half cycle long, brings its speed to zero there too, so the pose is left and rejoined at rest.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The window's linear progress, the two ramps and the sine.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A count of zero or a fraction throws instead of giving a wave that ends away from the pose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the window through the clock's `linear` and the ramps through `minimumJerk`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function wave(
    clock: IClock,
    window: readonly [string, string],
    cycles: number,
    seconds: number,
  ): number {
    if (!(Number.isInteger(cycles) && cycles > 0))
      throw new Error("A movement repeats a positive whole number of times");
    const u: number = clock.linear(window[0], window[1], seconds);
    const half: number = 1 / (2 * cycles);
    const grown: number =
      minimumJerk(Math.min(1, u / half)).s *
      minimumJerk(Math.min(1, (1 - u) / half)).s;
    return grown * Math.sin(2 * Math.PI * cycles * u);
  }

  /**
   * A clock with each of its spans stretched by a factor of its own. A span
   * runs from one instant to the next in time order and is named by the
   * instant that opens it; the first span is opened by `start`.
   *
   * @param clock The clock.
   * @param factor The factor of the span an instant opens; positive.
   * @returns The stretched clock, with the same instant names.
   * @throws {Error} On a factor that is not positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what a span is, how it is named, what the result keeps and the refused factor.
   * @evidence contracts/development/implementation.md#principled-implementation Each instant's new time is the running sum of the stretched spans before it, so the order of the instants and every name are kept and only lengths change.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the sorted instants with a running sum, then `of`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A factor of zero or less throws instead of collapsing or reversing a span.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Builds the result through `of`, so it has the same validation as every clock; `scale`, `align` and the manner's `time` are this function with a factor rule each.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One pass over a handful of instants, with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing of its own; the clock it returns is `of`'s.
   */
  export function stretch(
    clock: IClock,
    factor: (opening: string) => number,
  ): IClock {
    const instants: IInstant[] = [];
    let opening: string = START;
    let before: number = 0;
    let seconds: number = 0;
    const advance = (until: number): void => {
      const f: number = factor(opening);
      if (!(f > 0))
        throw new Error(`The span "${opening}" opens is stretched by a positive factor`);
      seconds += f * (until - before);
      before = until;
    };
    for (const instant of clock.instants) {
      advance(instant.seconds);
      instants.push({ name: instant.name, seconds });
      opening = instant.name;
    }
    advance(clock.duration);
    return of(seconds, instants);
  }

  /**
   * A clock performed at another tempo: every span is stretched by the tempo
   * except the spans opened by the instants named in `fixed`, whose lengths
   * physics sets (a flight, a fall, a recoil) and no manner changes.
   *
   * @param clock The clock.
   * @param tempo The factor on every other span's length; positive, 1 for no change.
   * @param fixed The instants that open the spans left as they are; none when absent.
   * @returns The scaled clock, with the same instant names.
   * @throws {Error} On a tempo that is not positive, or a fixed name the clock lacks.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which spans change, why the fixed ones do not, the defaults and each refused input.
   * @evidence contracts/development/implementation.md#principled-implementation A tempo is one factor on every span a performer chooses the length of; a span whose length physics sets is named and keeps its length.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One check of the fixed names and one call of `stretch`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A fixed name the clock lacks throws through `at` instead of being ignored.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `stretch`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A handful of instants and names, with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function scale(
    clock: IClock,
    tempo: number,
    fixed: readonly string[] = [],
  ): IClock {
    for (const name of fixed) clock.at(name);
    return stretch(clock, (opening: string): number =>
      fixed.includes(opening) ? 1 : tempo,
    );
  }

  /**
   * A clock whose named instant falls on a given second: the spans before
   * the instant are stretched by one factor so it lands there, and the spans
   * after it keep their lengths. Two roles of a mutual action align their
   * clocks to the meeting's shared instant this way.
   *
   * @param clock The clock.
   * @param instant The instant to place.
   * @param seconds Where it falls, seconds since the action's start; positive.
   * @returns The aligned clock, with the same instant names.
   * @throws {Error} When the instant is at the action's start, or the second is not positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which spans stretch and which keep their length, who uses it and each refused input.
   * @evidence contracts/development/implementation.md#principled-implementation The spans before the instant share one factor, the asked second over the instant's own, so their proportions are kept and the instant lands on the second; the movement after the instant is the role's own and keeps its lengths.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One factor and one call of `stretch`, whose rule switches to 1 at the first instant at or after the aligned one.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An instant at the start has no span to stretch and throws; instants within 1e-12 s of the aligned one count as at it, so two names at one time move together.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `stretch`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A handful of instants, with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function align(
    clock: IClock,
    instant: string,
    seconds: number,
  ): IClock {
    const at: number = clock.at(instant);
    if (!(at > 0) || !(seconds > 0))
      throw new Error(
        `The instant "${instant}" is aligned from a positive time to a positive time`,
      );
    const factor: number = seconds / at;
    let before: boolean = true;
    return stretch(clock, (opening: string): number => {
      if (opening !== START && clock.at(opening) >= at - 1e-12) before = false;
      return before ? factor : 1;
    });
  }
}
