import type { IAutoMovieMotionHumanEffort } from "../everyday/IAutoMovieMotionHumanEffort";

/**
 * The authored manner shared by human motion primitives: effort, intensity, pace, proficiency and variation. AutoMovieMotionManner resolves these controls into motion-specific modifiers.
 *
 * A manner changes how an action is performed and never which contacts it makes: a goal on a solid place keeps its place. A member reaches an action only where that action's `manner` admits it; the punch admits `variation` and `proficiency` alone and takes its timing from the performer's skill. Every member is neutral when absent, and the action then performs its own natural timing and size, stated on the action's type.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The authored manner shared by human motion primitives: effort, intensity, pace, proficiency and variation, and what each changes. AutoMovieMotionManner resolves these controls into motion-specific modifiers.
 * @evidence contracts/development/design.md#principled-representation Five independent qualities of a performance: Laban Effort for its quality, intensity for its size, pace for its rate, proficiency for its consistency and variation for how much it differs between performances.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Primitive authors share these manner controls; AutoMovieMotionManner resolves them into operation-specific modifiers and timing spans without storing an additional posture.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional controls retain runtime defaults, and effort reuses its closed canonical contract. AutoMovieMotionManner owns interpretation and modifier calculation.
 */
export interface IAutoMovieMotionManner {
  /** Laban Effort, each factor in [-1, 1]; 0 when absent. {@link IAutoMovieMotionHumanEffort} gives what each factor changes. */
  effort?: IAutoMovieMotionHumanEffort.IEffort;

  /**
   * The share of the action's full size, in (0, 1]; 1 when absent. The full
   * size is what the action performs without a manner, stated on its type.
   * It multiplies the excursions about the base and the free-space
   * amplitudes (a gesture's amplitude, a stroke's reach); the Effort `weight`
   * and `flow` factors scale the same size ({@link IAutoMovieMotionHumanEffort}).
   */
  intensity?: number;

  /**
   * The rate as a multiple of the action's natural rate, positive; 1 when
   * absent. The natural rate is the action's own timing, stated on its type
   * (a gait's speed on its `pace`). `pace: 1.5` divides every duration the
   * action does not fix physically by 1.5 and the holds likewise; a flight or
   * a fall keeps its length. A gait's speed is multiplied by 1.5
   * ({@link IAutoMovieMotionHumanWalkParams.manner}). An Effort `time` factor
   * multiplies the durations by `1 - 0.3 time` on top.
   */
  pace?: number;

  /**
   * Skill in [0, 1], which narrows the offsets `variation` draws: at
   * `variation` 1 the duration and the size differ by up to 14 % and 20 % for
   * 0 and 5 % and 8 % for 1, in proportion between (`AutoMovieMotionManner.BOUNDS`;
   * the duration's are measured, the size's provisional). It changes nothing
   * at `variation` 0. The performer's own timing skill when absent.
   */
  consistency?: number;

  /** The share of the offset bound a seeded draw takes, in [0, 1], so one performance differs from the next in duration and size; 0 when absent: every performance is the same. */
  variation?: number;
}

/** Operation-local contracts supporting IAutoMovieMotionManner. */
export namespace IAutoMovieMotionManner {
  /**
   * What a clock and a phrase read.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States who reads the record; each member says what it multiplies or is added to.
   * @evidence contracts/development/design.md#principled-representation The resolved form of a manner: factors on durations, on sizes and on a gait, and two shares, each neutral at 1 or 0, so a reader multiplies or adds without knowing which quality produced it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Seven required members. `time` reads `tempo` and `hold`, the arm and leg phrases `extent`, the arm phrases `curvature`, and `flinch` reads `extent` for its own size; `bend`, `step` and `swing` carry `HumanEffort`'s mapping through for the bend hint and the gaits and are consumed by walk and HumanGait; bend remains the modifier available to a bend hint.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No optional member: the neutral record states every value, so a reader never defaults one.
   */
  export interface IModifiers {
    /** Factor on every duration that physics does not fix. */
    tempo: number;

    /** Factor on the duration of a hold. */
    hold: number;

    /** Factor on excursions about the base and on free-space amplitudes. */
    extent: number;

    /** Lateral deviation of a hand's path, a share of the path's length. */
    curvature: number;

    /** A share added to the bend preset's outward share; negative draws the elbows in. */
    bend: number;

    /** Factor on a gait's step length. */
    step: number;

    /** Factor on a gait's arm swing. */
    swing: number;
  }

  /**
   * Which spans of a clock a manner treats apart from the rest.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record selects; each member says how a span is named and what its absence means.
   * @evidence contracts/development/design.md#principled-representation A span is named by the instant that opens it, the way the clock's own retiming names it, so the record holds names the clock already has.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two optional members, read only by `time`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The holds default to a phrase's two holds and the fixed spans to none, the values that fit a phrase clock; a law whose flight or fall is fixed by gravity names it.
   */
  export interface ISpans {
    /** The instants that open the holds; a phrase's `ready` and `strokeEnd` when absent. */
    holds?: readonly string[];

    /** The instants that open the spans physics fixes; none when absent. */
    fixed?: readonly string[];
  }

  /**
   * The names of `PRESETS`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that the names are the table's keys: the eight Effort actions of `HumanEffort.ACTIONS` and the four moods and two Shape poles the table adds.
   * @evidence contracts/development/design.md#principled-representation A closed union of the Effort actions' own names (Laban and Lawrence 1947, Effort) and six added names, so a name the table lacks fails the type check.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Fourteen names, each a key of `PRESETS`; `PRESET_NAMES` lists them as data and a test checks none is missing.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The Effort names come from the canonical IAutoMovieMotionHumanEffort.Action union, which also keys HumanEffort.ACTIONS; the six mood and shape names are literals.
   */
  export type Preset =
    | IAutoMovieMotionHumanEffort.Action
    | "weary"
    | "brisk"
    | "sad"
    | "proud"
    | "enclosing"
    | "spreading";
}
