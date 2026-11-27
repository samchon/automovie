import type { IAutoMovieMotionHumanEffort } from "./IAutoMovieMotionHumanEffort";

/**
 * The authored manner shared by human motion primitives: effort, intensity,
 * pace, consistency and variation. motionManner resolves these
 * controls into motion-specific modifiers.
 *
 * A manner changes how an action is performed and never which contacts it
 * makes: a goal on a solid place keeps its place. A member reaches an action
 * only where that action's `manner` admits it; the punch admits `variation` and
 * `consistency` alone and takes its timing from the performer's skill. Every
 * member is neutral when absent, and the action then performs its own natural
 * timing and size, stated on the action's type.
 */
export interface IAutoMovieMotionManner {
  /**
   * Laban Effort, each factor in [-1, 1]; 0 when absent.
   * {@link IAutoMovieMotionHumanEffort} gives what each factor changes.
   */
  effort?: IAutoMovieMotionHumanEffort.IEffort;

  /**
   * The share of the action's full size, in (0, 1]; 1 when absent. The full
   * size is what the action performs without a manner, stated on its type. It
   * multiplies the excursions about the base and the free-space amplitudes (a
   * gesture's amplitude, a stroke's reach); the Effort `weight` and `flow`
   * factors scale the same size ({@link IAutoMovieMotionHumanEffort}).
   */
  intensity?: number;

  /**
   * The rate as a multiple of the action's natural rate, positive; 1 when
   * absent. The natural rate is the action's own timing, stated on its type (a
   * gait's speed on its `pace`). `pace: 1.5` divides every duration the action
   * does not fix physically by 1.5 and the holds likewise; a flight or a fall
   * keeps its length. A gait's speed is multiplied by 1.5
   * ({@link IAutoMovieMotionHumanWalkParams.manner}). An Effort `time` factor
   * multiplies the durations by `1 - 0.3 time` on top.
   */
  pace?: number;

  /**
   * Skill in [0, 1], which narrows the offsets `variation` draws: at
   * `variation` 1 the duration and the size differ by up to 14 % and 20 % for 0
   * and 5 % and 8 % for 1, in proportion between
   * (`motionManner.BOUNDS`; the duration's are measured, the size's
   * provisional). It changes nothing at `variation` 0. Omit it to keep the
   * performer's timing skill for duration and path skill for spatial extent.
   */
  consistency?: number;

  /**
   * The share of the offset bound a seeded draw takes, in [0, 1], so one
   * performance differs from the next in duration and size; 0 when absent:
   * every performance is the same.
   */
  variation?: number;
}

/** Operation-local contracts supporting IAutoMovieMotionManner. */
export namespace IAutoMovieMotionManner {
  /** What a clock and a phrase read. */
  export interface IModifiers {
    /** Factor on every duration that physics does not fix. */
    tempo: number;

    /** Factor on the duration of a hold. */
    hold: number;

    /** Factor on excursions about the base and on free-space amplitudes. */
    extent: number;

    /** Lateral deviation of a hand's path, a share of the path's length. */
    curvature: number;

    /**
     * A share added to the bend preset's outward share; negative draws the
     * elbows in.
     */
    bend: number;

    /** Factor on a gait's step length. */
    step: number;

    /** Factor on a gait's arm swing. */
    swing: number;
  }

  /** Which spans of a clock a manner treats apart from the rest. */
  export interface ISpans {
    /**
     * The instants that open the holds; a phrase's `ready` and `strokeEnd` when
     * absent.
     */
    holds?: readonly string[];

    /** The instants that open the spans physics fixes; none when absent. */
    fixed?: readonly string[];
  }

  /** The names of `PRESETS`. */
  export type Preset =
    | IAutoMovieMotionHumanEffort.Action
    | "weary"
    | "brisk"
    | "sad"
    | "proud"
    | "enclosing"
    | "spreading";
}
