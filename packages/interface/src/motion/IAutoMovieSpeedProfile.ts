/**
 * Distance-based timing produced by speedProfile. Input speeds, durations,
 * lengths and supplied rates are admitted by that function; reach is an
 * unchecked arithmetic helper. Distances start at zero and times share the
 * caller's film clock.
 */
export namespace IAutoMovieSpeedProfile {
  /** What a profile is laid from. */
  export interface IProps {
    /**
     * The film second the motion begins; the mover holds at the path's start
     * before it.
     */
    start: number;

    /**
     * The speed at the start, metres per second, at least 0: above 0 for a
     * flying start.
     */
    speed: number;

    /**
     * The acceleration, metres per second squared, positive; absent for a path
     * whose stretches never speed up, and required by the first that does.
     */
    acceleration?: number;

    /**
     * The braking, metres per second squared, positive; absent for a path whose
     * stretches never slow, and required by the first that does.
     */
    deceleration?: number;

    /**
     * Stretches in path order. An empty array yields start === end, zero
     * length, and the initial speed at and after start.
     */
    stretches: readonly IAutoMovieSpeedProfile.Stretch[];
  }

  /** One stretch of the path, ending at a speed mark. */
  export type Stretch =
    | IAutoMovieSpeedProfile.IDistance
    | IAutoMovieSpeedProfile.ISeconds;

  /** A stretch that ends at its mark after a stated length. */
  export interface IDistance {
    /** The discriminator. */
    kind: "distance";

    /** Its length along the path, metres, positive. */
    length: number;

    /** The speed at its end, metres per second, at least 0: 0 for a stop. */
    speed: number;

    /**
     * Speed ceiling in metres per second, positive and at least entry/end
     * speeds; a short stretch can peak below it.
     */
    cap: number;
  }

  /** A stretch that ends at its mark after a stated time. */
  export interface ISeconds {
    /** The discriminator. */
    kind: "seconds";

    /** Its duration, seconds, positive. */
    seconds: number;

    /** The speed at its end, metres per second, at least 0. */
    speed: number;
  }

  /** One phase of constant acceleration. */
  export interface IPhase {
    /** Its first film second. */
    start: number;

    /** Its last film second. */
    end: number;

    /** The distance at its start, metres. */
    from: number;

    /** The distance at its end, metres. */
    to: number;

    /**
     * The speed at its anchor, metres per second: at its start, or at its end
     * for a phase anchored there.
     */
    speed: number;

    /**
     * Its constant acceleration, metres per second squared, negative while
     * braking.
     */
    acceleration: number;

    /**
     * Where the phase is evaluated from: its start, or its end for a braking
     * phase that must end exactly on its mark.
     */
    anchor: "start" | "end";

    /** The index of the stretch it belongs to. */
    stretch: number;
  }

  /** One stretch as laid. */
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

    /**
     * Seconds spent at the top speed; a distance stretch that only peaks gives
     * 0 or a rounding residue below it.
     */
    level: number;

    /** Seconds spent braking. */
    down: number;
  }

  /** Where the mover is at one second. */
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
   * The at closure also reads the supplied initial speed at the start, so keep
   * the input props stable while using the profile.
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
     * The state at a film second: at rest at the path's start before `start`,
     * at the start speed at `start`, and the end state after `end`.
     */
    at: (seconds: number) => IAutoMovieSpeedProfile.IState;

    /**
     * The film second a distance is first reached, after clamping distance to
     * [0, length]. A held distance is reached at the beginning of the hold,
     * including a trailing hold at length; an empty profile returns start.
     */
    when: (distance: number) => number;
  }

  /**
   * The speeds a stretch of a length can end at from an entry speed under the
   * rates: from braking all the way to accelerating all the way.
   */
  export type IReachResult = {
    /**
     * Lowest endpoint speed in metres/second after maximum braking, clamped at
     * zero.
     */
    minimum: number;
    /** Highest endpoint speed in metres/second after maximum acceleration. */
    maximum: number;
  };
}
