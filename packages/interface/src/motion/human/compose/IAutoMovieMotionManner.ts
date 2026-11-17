import type { IAutoMovieMotionHumanEffort } from "../everyday/IAutoMovieMotionHumanEffort";

/**
 * How an action is performed, as distinct from which action it is: how fast,
 * how large, how forceful, how skilled and how varied.
 *
 * A manner is resolved once into modifiers. The tempo and the hold factor
 * change durations through the clock ({@link time}); the extent, the
 * curvature and the bend change sizes through the phrases. A manner never
 * changes a goal on a solid place: a phrase that states a contact keeps its
 * place, and only a place in the air, an excursion about the base or a
 * free-space amplitude is scaled. The absent manner is neutral and leaves
 * every action as it is.
 *
 * @evidence contracts/development/common.md#meaningful-documentation effort: Laban Effort, each factor in [-1, 1]; neutral when absent. intensity: How much of the action's full size is performed, in (0, 1]; 1 when absent. pace: The rate as a multiple of the action's natural rate; positive, 1 when absent.
 * @evidence contracts/development/design.md#principled-representation effort: Laban Effort, each factor in [-1, 1]; neutral when absent. intensity: How much of the action's full size is performed, in (0, 1]; 1 when absent. pace: The rate as a multiple of the action's natural rate; positive, 1 when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionManner.ts (AutoMovieMotionManner.resolve, return); compose/AutoMovieMotionManner.ts (AutoMovieMotionManner.of, return); compose/AutoMovieMotionManner.ts (AutoMovieMotionManner.time, modifiers); compose/AutoMovieMotionHumanVariation.ts (AutoMovieMotionHumanVariation.of, manner); compose/AutoMovieMotionManner.ts (AutoMovieMotionManner.resolve, manner); compose/AutoMovieMotionManner.ts (AutoMovieMotionManner.of, manner).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanEffort.IEffort, IAutoMovieMotionHumanEffort.Action identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionManner {
  /**
   * A manner; every member is optional and neutral when absent.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is; each member gives its range and what its absence means.
   * @evidence contracts/development/design.md#principled-representation Five independent qualities of a performance: Laban Effort for its quality, intensity for its size, pace for its rate, proficiency for its consistency and variation for how much it differs between performances.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five optional members; the Effort is `IAutoMovieMotionHumanEffort.IEffort`, not restated.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every member is optional because each has a neutral value an author leaves unstated; the ranges are checked in `resolve`, not assumed.
   */
  export interface IManner {
    /** Laban Effort, each factor in [-1, 1]; neutral when absent. */
    effort?: IAutoMovieMotionHumanEffort.IEffort;

    /** How much of the action's full size is performed, in (0, 1]; 1 when absent. */
    intensity?: number;

    /** The rate as a multiple of the action's natural rate; positive, 1 when absent. */
    pace?: number;

    /** Skill in [0, 1], which narrows the variation; the performer's own when absent. */
    proficiency?: number;

    /** How much one performance differs from the next, in [0, 1]; 0 when absent. */
    variation?: number;
  }

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
   * The names of {@link PRESETS}.
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
