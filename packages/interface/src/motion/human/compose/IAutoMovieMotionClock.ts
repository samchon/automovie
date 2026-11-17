import type { IAutoMovieMotionEvent } from "../../IAutoMovieMotionEvent";

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
 * @evidence contracts/development/common.md#meaningful-documentation seconds: Seconds since the action's start, in [0, duration]. seconds: The phase's length, seconds; not negative. duration: Duration, seconds; positive.
 * @evidence contracts/development/design.md#principled-representation seconds: Seconds since the action's start, in [0, duration]. seconds: The phase's length, seconds; not negative. duration: Duration, seconds; positive.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: affordance/operateDrive.ts (operateDrive.drive, clock); compose/AutoMovieMotionClock.ts (AutoMovieMotionClock.of, return); compose/AutoMovieMotionClock.ts (AutoMovieMotionClock.sequence, return); compose/AutoMovieMotionClock.ts (AutoMovieMotionClock.phrase, return); compose/AutoMovieMotionClock.ts (AutoMovieMotionClock.through, clock); compose/AutoMovieMotionClock.ts (AutoMovieMotionClock.wave, clock).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionEvent identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionClock {
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
    instants: readonly IAutoMovieMotionClock.IInstant[];

    /**
     * When an instant is.
     *
     * @param name The instant.
     * @returns Seconds since the action's start.
     * @throws {Error} On an unknown name.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument, the unit, the origin of the seconds and the refusal of an unknown name.
     * @evidence contracts/development/implementation.md#principled-implementation Looks the instant up by name in the clock's own map, so a window is stated by names and never by raw seconds.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup of the map built once by `of`; the windows of the other queries are resolved through it.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unknown name throws instead of returning a default second.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
     */
    at(name: string): number;

    /**
     * Uniform progress between two instants.
     *
     * @param from The opening instant.
     * @param to The closing instant.
     * @param seconds Seconds since the action's start.
     * @returns 0 until `from`, 1 from `to`, linear between; a window of no length steps at `to`.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the two instants, the argument, the value before, inside and after the window and the step of a window with no length.
     * @evidence contracts/development/implementation.md#principled-implementation The clamped linear map of the seconds onto the window, the uniform form of progress.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One clamped division over the two instants `at` gives; `progress` is built on it, so the window rule exists once.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A window of no length steps at its closing instant instead of dividing by zero.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
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
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the two instants, the argument, the value outside the window and the profile (Flash and Hogan 1985).
     * @evidence contracts/development/implementation.md#principled-implementation The minimum-jerk profile of the uniform progress (Flash and Hogan 1985): the bell-shaped speed of a point-to-point movement, at rest at both ends.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of the engine's `minimumJerk` over `linear`, so the window rule is not restated.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The profile is the cited one with no tuned constant, so a movement's shape is not fitted to a case.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
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
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the two windows, the argument and the range of the result.
     * @evidence contracts/development/implementation.md#principled-implementation The progress of the rise less the progress of the fall, clamped at zero, so the value rises over one window and falls over a later one.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Two calls of `progress` and one subtraction; the windows are not resolved a second time.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The difference is clamped at zero instead of going negative when the fall window precedes the rise window.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
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
     *
     * @evidence contracts/development/common.md#meaningful-documentation States that every named instant is returned once and as a share of the duration.
     * @evidence contracts/development/implementation.md#principled-implementation Each instant is its seconds over the duration, the form a plan's events take, in time order.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One map over the sorted instants built by `of`; the plan's events are not kept as a second list.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No instant is added or dropped; `start` and `end` are not named, as the clock's instants do not name them.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
     */
    events(): IAutoMovieMotionEvent[];
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
}
