/**
 * Distance-based timing produced by speedProfile. Input speeds, durations, lengths and supplied rates are admitted by that function; reach is an unchecked arithmetic helper. Distances start at zero and times share the caller's film clock.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distance is metres, time is film seconds, speed is metres per second and acceleration is metres per second squared. The distance/seconds stretch union separates endpoints; speedProfile admits ranges, while readers retain the mutable phase array and require stable inputs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieSpeedProfile contracts used by packages/engine/src/motion/speedProfile.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation Distance is metres, time is film seconds, speed is metres per second and acceleration is metres per second squared. The distance/seconds stretch union separates endpoints; speedProfile admits ranges, while readers retain the mutable phase array and require stable inputs. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieSpeedProfile contract belongs to interface; packages/engine/src/motion/speedProfile.ts and packages/motions/src/ensemble/HumanFormationPath.ts use its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMovieSpeedProfile {
  /**
   * What a profile is laid from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives film start, speed/rate units and empty-profile behavior.
   * @evidence contracts/development/design.md#principled-representation speedProfile admits finite start, nonnegative speeds and positive supplied acceleration magnitudes; a changing stretch requires its corresponding rate.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The speed-profile planner consumes ordered path stretches and retains initial-speed access through the at reader.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Acceleration and braking are independently optional because constant-speed and one-sided changes do not need both rates.
   */
  export interface IProps {
    /** The film second the motion begins; the mover holds at the path's start before it. */
    start: number;

    /** The speed at the start, metres per second, at least 0: above 0 for a flying start. */
    speed: number;

    /** The acceleration, metres per second squared, positive; absent for a path whose stretches never speed up, and required by the first that does. */
    acceleration?: number;

    /** The braking, metres per second squared, positive; absent for a path whose stretches never slow, and required by the first that does. */
    deceleration?: number;

    /** Stretches in path order. An empty array yields start === end, zero length, and the initial speed at and after start. */
    stretches: readonly IAutoMovieSpeedProfile.Stretch[];
  }

  /**
   * One stretch of the path, ending at a speed mark.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Separates a distance-constrained endpoint from a duration-constrained endpoint.
   * @evidence contracts/development/design.md#principled-representation The kind union makes length/cap and seconds exclusive descriptions of one stretch, with endpoint speed in metres/second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface speedProfile selects its distance or constant-acceleration timing branch from this discriminant.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No optional-field combination can describe a stretch with neither timing basis.
   */
  export type Stretch =
    | IAutoMovieSpeedProfile.IDistance
    | IAutoMovieSpeedProfile.ISeconds;

  /**
   * A stretch that ends at its mark after a stated length.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Specifies positive path length, endpoint speed and attainable cap semantics.
   * @evidence contracts/development/design.md#principled-representation speedProfile checks finite positive length/cap, nonnegative speed, cap above both endpoints and reachability under the supplied rates.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The distance branch computes acceleration, cruise and braking phases from this request.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The discriminator separates distance planning from a caller-prescribed duration; the cap need not actually be reached on a short stretch.
   */
  export interface IDistance {
    /** The discriminator. */
    kind: "distance";

    /** Its length along the path, metres, positive. */
    length: number;

    /** The speed at its end, metres per second, at least 0: 0 for a stop. */
    speed: number;

    /** Speed ceiling in metres per second, positive and at least entry/end speeds; a short stretch can peak below it. */
    cap: number;
  }

  /**
   * A stretch that ends at its mark after a stated time.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Specifies a positive duration and endpoint speed for one constant-rate transition.
   * @evidence contracts/development/design.md#principled-representation speedProfile admits positive finite seconds and nonnegative finite speed, then checks the required signed rate against acceleration or braking.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The duration branch derives travelled distance from mean endpoint speed times duration.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A stationary hold is representable with zero endpoint speeds and does not require an acceleration rate.
   */
  export interface ISeconds {
    /** The discriminator. */
    kind: "seconds";

    /** Its duration, seconds, positive. */
    seconds: number;

    /** The speed at its end, metres per second, at least 0. */
    speed: number;
  }

  /**
   * One phase of constant acceleration.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives absolute film times, path distances, signed acceleration and the speed anchor.
   * @evidence contracts/development/design.md#principled-representation start/end are film seconds, from/to are metres from path start, and speed is evaluated at the indicated phase endpoint; zero-duration phases may be present.
   * @evidence contracts/development/design.md#minimal-and-owned-surface speedProfile returns these phase records and its at/when closures read the same array, so clients keep it stable.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An explicit anchor distinguishes reverse-evaluated braking from start-evaluated acceleration without overloading the speed field silently.
   */
  export interface IPhase {
    /** Its first film second. */
    start: number;

    /** Its last film second. */
    end: number;

    /** The distance at its start, metres. */
    from: number;

    /** The distance at its end, metres. */
    to: number;

    /** The speed at its anchor, metres per second: at its start, or at its end for a phase anchored there. */
    speed: number;

    /** Its constant acceleration, metres per second squared, negative while braking. */
    acceleration: number;

    /** Where the phase is evaluated from: its start, or its end for a braking phase that must end exactly on its mark. */
    anchor: "start" | "end";

    /** The index of the stretch it belongs to. */
    stretch: number;
  }

  /**
   * One stretch as laid.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines laid stretch timing, distance bounds, peak and durations of its three phases.
   * @evidence contracts/development/design.md#principled-representation Film-time endpoints and path-distance endpoints share the profile origins; up/level/down are elapsed seconds, with possible rounding residue in level.
   * @evidence contracts/development/design.md#minimal-and-owned-surface speedProfile publishes per-stretch summaries alongside finer phases for consumers needing stretch boundaries.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The summary is derived from the same solve rather than an independently authored timing track.
   */
  export interface IStretch {
    /** Its first film second. */
    start: number;

    /** Its last film second. */
    end: number;

    /** The distance at its start, metres. */
    from: number;

    /** The distance at its end, metres. */
    to: number;

    /** Its top speed, metres per second. */
    peak: number;

    /** Seconds spent accelerating. */
    up: number;

    /** Seconds spent at the top speed; a distance stretch that only peaks gives 0 or a rounding residue below it. */
    level: number;

    /** Seconds spent braking. */
    down: number;
  }

  /**
   * Where the mover is at one second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines distance, speed and signed acceleration at one profile time.
   * @evidence contracts/development/design.md#principled-representation Distance is metres from path start, speed metres/second and acceleration metres/second-squared; held external samples have zero acceleration.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The profile's at reader allocates this measurement from its retained phases.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A held end position may still report endpoint speed; it is the clamped profile state rather than extrapolated motion.
   */
  export interface IState {
    /** Distance along the path, metres. */
    distance: number;

    /** Speed, metres per second. */
    speed: number;

    /** Acceleration, metres per second squared; 0 outside the profile. */
    acceleration: number;
  }

  /**
   * A laid profile. Arrays and records are not frozen; callers must treat the
   * phases as immutable because at and when retain and read that same array.
   * The at closure also reads the supplied initial speed at the start, so
   * keep the input props stable while using the profile.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States time and distance readers, retained-phase ownership and trailing-hold inverse timing.
   * @evidence contracts/development/design.md#principled-representation start/end share film time, length starts at zero and peak uses metres/second; at holds endpoints and when returns the first clamped-distance occurrence.
   * @evidence contracts/development/design.md#minimal-and-owned-surface speedProfile owns construction; returned closures read retained phase data and callers preserve the mutable records while sampling.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The inverse reader resolves an actual first reach rather than claiming every distance at or beyond length first occurs at end.
   */
  export interface IProfile {
    /** The phases in time order. */
    phases: readonly IAutoMovieSpeedProfile.IPhase[];

    /** The stretches in order. */
    stretches: readonly IAutoMovieSpeedProfile.IStretch[];

    /** The film second the motion begins. */
    start: number;

    /** The film second the last stretch ends. */
    end: number;

    /** The path's length, metres. */
    length: number;

    /** The greatest speed reached, metres per second. */
    peak: number;

    /**
     * The state at a film second: at rest at the path's start before `start`, at the start speed at `start`, and the end state after `end`.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieSpeedProfile.IProfile.at: The state at a film second: at rest at the path's start before `start`, at the start speed at `start`, and the end state after `end`.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieSpeedProfile.IProfile.at is used through packages/engine/src/motion/speedProfile.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieSpeedProfile.IProfile.at is used through packages/engine/src/motion/speedProfile.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieSpeedProfile.IProfile.at is used through packages/engine/src/motion/speedProfile.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieSpeedProfile.IProfile.at is used through packages/engine/src/motion/speedProfile.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieSpeedProfile.IProfile.at is used through packages/engine/src/motion/speedProfile.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieSpeedProfile.IProfile.at is used through packages/engine/src/motion/speedProfile.ts.
     */
    at: (seconds: number) => IAutoMovieSpeedProfile.IState;

    /**
     * The film second a distance is first reached, after clamping distance
     * to [0, length]. A held distance is reached at the beginning of the hold,
     * including a trailing hold at length; an empty profile returns start.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieSpeedProfile.IProfile.when: The film second a distance is first reached, after clamping distance to [0, length]. A held distance is reached at the beginning of the hold, including a trailing hold at length; an empty profile returns start.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieSpeedProfile.IProfile.when is used through packages/engine/src/motion/speedProfile.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieSpeedProfile.IProfile.when is used through packages/engine/src/motion/speedProfile.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieSpeedProfile.IProfile.when is used through packages/engine/src/motion/speedProfile.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieSpeedProfile.IProfile.when is used through packages/engine/src/motion/speedProfile.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieSpeedProfile.IProfile.when is used through packages/engine/src/motion/speedProfile.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieSpeedProfile.IProfile.when is used through packages/engine/src/motion/speedProfile.ts.
     */
    when: (distance: number) => number;
  }

  /**
   * The speeds a stretch of a length can end at from an entry speed under the rates: from braking all the way to accelerating all the way.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives lower and upper physically reachable endpoint speeds.
   * @evidence contracts/development/design.md#principled-representation Both bounds use metres/second; minimum clamps the braking radicand at zero while maximum is the acceleration bound. reach itself performs no numeric admission.
   * @evidence contracts/development/design.md#minimal-and-owned-surface speedProfile.reach computes this interval from the caller's entry speed, length and rates.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The record expresses a numeric interval and does not attach success to a particular requested mark.
   */
  export type IReachResult = {
    /** Lowest endpoint speed in metres/second after maximum braking, clamped at zero. */
    minimum: number;
    /** Highest endpoint speed in metres/second after maximum acceleration. */
    maximum: number;
  };
}
