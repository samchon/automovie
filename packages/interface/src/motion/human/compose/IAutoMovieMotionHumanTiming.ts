/**
 * How long an effector takes to travel a distance.
 *
 * Two rules, and which one a movement takes:
 *
 * - {@link AutoMovieMotionHumanTiming.transport}: a movement in free space
 *   (a gesture's preparation, a hand to a rest place, a retraction) lasts
 *   `0.25 + 0.5 D` seconds for `D` metres. Provisional: a gesture's
 *   preparation lasts a few tenths of a second and reaching time grows with
 *   distance (Fitts 1954).
 * - {@link AutoMovieMotionHumanTiming.aimed}: a movement that must stop on a
 *   target of a given width lasts `a + b lg A + c W` for an amplitude `A` in
 *   millimetres and a width `W`, the two-factor model McIntosh, Mon-Williams
 *   and Tresilian (2018, J. Exp. Psychol. Hum. Percept. Perform. 44:1022,
 *   table 1) fitted to reach-to-grasp times, with a = -306.07 ms, b = 297.27
 *   ms per decade and c = 0.65 ms per millimetre (r^2 = 0.97). Amplitudes
 *   below the study's shortest (170 mm) take its value, since the fit is not
 *   valid there.
 *
 * {@link AutoMovieMotionHumanTiming.of} chooses: a place that is solid and
 * has a width is aimed at, any other is travelled to.
 *
 * @evidence contracts/development/common.md#meaningful-documentation distance: Metres travelled. width: The width of the target the movement stops on, metres; a free movement when absent. seconds: The seconds.
 * @evidence contracts/development/design.md#principled-representation distance: Metres travelled. width: The width of the target the movement stops on, metres; a free movement when absent. seconds: The seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanTiming.ts (AutoMovieMotionHumanTiming.of, place); compose/AutoMovieMotionHumanTiming.ts (AutoMovieMotionHumanTiming.seconds, span); compose/AutoMovieMotionHumanTiming.ts (AutoMovieMotionHumanTiming.phrase, roles); compose/AutoMovieMotionHumanTiming.ts (AutoMovieMotionHumanTiming.PAUSE_NAMES); compose/AutoMovieMotionHumanTiming.ts (AutoMovieMotionHumanTiming.PAUSES); everyday/gestureStrokeTables.ts (gestureStrokeTables.RHYTHM).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The literal vocabulary is declared independently of runtime values; implementations are checked against this exact set.
 */
export namespace IAutoMovieMotionHumanTiming {
  /**
   * A named length of a pause or of a short phase.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is named; `PAUSES` gives each length.
   * @evidence contracts/development/design.md#principled-representation A closed union of the lengths a phrase holds for, so a law states a pause the table supplies and types no seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four names, each with a shipped law that uses its length.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A length between two names is the scale rung of `Span`, never a fifth name without a user.
   */
  export type Pause = (readonly ["none", "brief", "beat", "long"])[number];

  /**
   * A movement whose time follows from how far it goes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the record; each member states its unit and the rule it selects.
   * @evidence contracts/development/design.md#principled-representation The two inputs of the timing rules above, so a phase states what moves how far and the rule supplies the seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members; read by `seconds`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The width is optional because a free movement has none; none is invented.
   */
  export interface ITravel {
    /** Metres travelled. */
    distance: number;

    /** The width of the target the movement stops on, metres; a free movement when absent. */
    width?: number;
  }

  /**
   * The length of a phase on one of three rungs: a named pause or a travel,
   * a pause with a scale in [0.5, 1.5], or explicit seconds with their
   * source.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three rungs and the scale's range.
   * @evidence contracts/development/design.md#principled-representation Intent first and seconds on demand: every rung resolves to seconds, the unit the action clock takes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One union of four members; read by `seconds`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The explicit rung requires its source by type; the scale is bounded so it cannot stand in for another name.
   */
  export type Span =
    | IAutoMovieMotionHumanTiming.Pause
    | IAutoMovieMotionHumanTiming.ITravel
    | {
        /** The pause scaled. */
        pause: IAutoMovieMotionHumanTiming.Pause;

        /** The factor, in [0.5, 1.5]. */
        scale: number;
      }
    | {
        /** The seconds. */
        seconds: number;

        /** A citation, or `provisional: <capture case name>`. */
        source: string;
      };

  /**
   * The lengths of a phrase's phases, each by its role.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the record; each member states its phase and its value when absent.
   * @evidence contracts/development/design.md#principled-representation The members of the action clock's phrase, each a `Span` instead of seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Mirrors `IAutoMovieMotionPhraseDurations` member for member; read by `phrase`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An absent hold stays absent, so the clock's own rule for a missing phase applies.
   */
  export interface IRoles {
    /** The preparation, from `start` to `ready`. */
    prepare: IAutoMovieMotionHumanTiming.Span;

    /** The wait before the stroke; none when absent. */
    wait?: IAutoMovieMotionHumanTiming.Span;

    /** The stroke up to its decisive instant. */
    attack: IAutoMovieMotionHumanTiming.Span;

    /** The stroke after it; none when absent. */
    follow?: IAutoMovieMotionHumanTiming.Span;

    /** The hold after the stroke; none when absent. */
    hold?: IAutoMovieMotionHumanTiming.Span;

    /** The retraction, from `relax` to `end`. */
    retract: IAutoMovieMotionHumanTiming.Span;
  }

  /**
   * The time of a movement to a place, by the rule the place asks for. Input place of AutoMovieMotionHumanTiming.of. Whether the place is solid, and its width when it has one.
   *
   * @evidence contracts/development/common.md#meaningful-documentation solid: Whether the target is a physical contact, selecting contact timing rather than a free-space pause. width: Target width in metres when known; omitted uses the timing law's unmeasured-target case.
   * @evidence contracts/development/design.md#principled-representation solid: Whether the target is a physical contact, selecting contact timing rather than a free-space pause. width: Target width in metres when known; omitted uses the timing law's unmeasured-target case.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanTiming.ts (AutoMovieMotionHumanTiming.of, place).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in AutoMovieMotionHumanTiming.of.
   */
  export type IOfPlace = {
    /** Whether the target is a physical contact, selecting contact timing rather than a free-space pause. */
    solid: boolean;
    /** Target width in metres when known; omitted uses the timing law's unmeasured-target case. */
    width?: number | undefined;
  };
}
