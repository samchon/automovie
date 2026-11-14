import { HumanBound } from "../law/HumanBound";
import type { AutoMovieMotionClock } from "./AutoMovieMotionClock";

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
 * @evidence contracts/development/common.md#meaningful-documentation States both rules with their formulas, units and sources, which values are provisional, and which rule a movement takes.
 * @evidence contracts/development/design.md#principled-representation Movement time as a function of distance, and of distance and target width where the movement must stop on something, the two cases motor-control studies separate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three functions and their constants; the only owner of default durations, so one modifier can scale them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every coefficient is a named constant with its source; no body part or law is named.
 */
export namespace AutoMovieMotionHumanTiming {
  /** The free-space rule's time at no distance, seconds (provisional). */
  export const BASE: number = 0.25;

  /** The free-space rule's seconds per metre (provisional). */
  export const RATE: number = 0.5;

  /** McIntosh et al. 2018 two-factor intercept, seconds. */
  export const INTERCEPT: number = -0.30607;

  /** McIntosh et al. 2018 amplitude slope, seconds per decade of millimetres. */
  export const AMPLITUDE: number = 0.29727;

  /** McIntosh et al. 2018 width slope, seconds per metre (0.65 ms per mm). */
  export const WIDTH: number = 0.65;

  /** The shortest amplitude the fit was measured at, metres. */
  export const SHORTEST: number = 0.17;

  /**
   * The time of a movement in free space.
   *
   * @param distance Metres travelled.
   * @returns Seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input's unit and the result's; the namespace gives the formula and its standing.
   * @evidence contracts/development/implementation.md#principled-implementation `BASE + RATE D`, a time that grows with distance from a floor of a few tenths of a second; named provisional.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A negative distance counts as none, since a length cannot be negative; both coefficients are named provisional constants.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One expression with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function transport(distance: number): number {
    return BASE + RATE * Math.max(0, distance);
  }

  /**
   * The time of a movement that stops on a target.
   *
   * @param distance Metres travelled.
   * @param width The target's width across the grip or the touch, metres; 0 for a point.
   * @returns Seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input's unit and meaning and the result's; the namespace gives the formula and its source.
   * @evidence contracts/development/implementation.md#principled-implementation McIntosh et al. 2018's two-factor model with the group coefficients of its table 1.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression over four named constants.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The fit is not extrapolated below its shortest measured amplitude; a negative width counts as none.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One expression with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache; `HumanPrehension.nominal` delegates here.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function aimed(distance: number, width: number): number {
    return (
      INTERCEPT +
      AMPLITUDE * Math.log10(1000 * Math.max(SHORTEST, distance)) +
      WIDTH * Math.max(0, width)
    );
  }

  /**
   * The time of a movement to a place, by the rule the place asks for.
   *
   * @param distance Metres travelled.
   * @param place Whether the place is solid, and its width when it has one.
   * @returns Seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and that the place decides the rule; the namespace states the rule.
   * @evidence contracts/development/implementation.md#principled-implementation A movement that must stop on a solid thing of a known width is an aimed movement; a movement to a free place has no width to be accurate to.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One condition over the two rules.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A solid place without a width takes the free-space rule instead of an invented width.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `aimed` and `transport`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One condition with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function of(
    distance: number,
    place: { solid: boolean; width?: number | undefined },
  ): number {
    return place.solid && place.width !== undefined
      ? aimed(distance, place.width)
      : transport(distance);
  }

  /**
   * A named length of a pause or of a short phase.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is named; `PAUSES` gives each length.
   * @evidence contracts/development/design.md#principled-representation A closed union of the lengths a phrase holds for, so a law states a pause the table supplies and types no seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four names, each with a shipped law that uses its length.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A length between two names is the scale rung of `Span`, never a fifth name without a user.
   */
  export type Pause = (typeof PAUSE_NAMES)[number];

  /** The pauses of {@link Pause}, as data. */
  export const PAUSE_NAMES = ["none", "brief", "beat", "long"] as const;

  /**
   * The seconds of each pause (provisional): `none` is no time, `brief` 0.15
   * (an interrupt's smooth blend), `beat` 0.4 (one swing of the `wave`
   * gesture and the flinch's return), `long` 0.8 (the hold of a posture
   * gesture such as `slump`).
   */
  export const PAUSES: Readonly<Record<Pause, number>> = {
    none: 0,
    brief: 0.15,
    beat: 0.4,
    long: 0.8,
  };

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
    | Pause
    | ITravel
    | {
        /** The pause scaled. */
        pause: Pause;

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
   * @evidence contracts/development/design.md#minimal-and-owned-surface Mirrors `AutoMovieMotionClock.IPhrase` member for member; read by `phrase`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An absent hold stays absent, so the clock's own rule for a missing phase applies.
   */
  export interface IRoles {
    /** The preparation, from `start` to `ready`. */
    prepare: Span;

    /** The wait before the stroke; none when absent. */
    wait?: Span;

    /** The stroke up to its decisive instant. */
    attack: Span;

    /** The stroke after it; none when absent. */
    follow?: Span;

    /** The hold after the stroke; none when absent. */
    hold?: Span;

    /** The retraction, from `relax` to `end`. */
    retract: Span;
  }

  /**
   * The seconds of a span.
   *
   * @param span The span, on any rung.
   * @returns Seconds.
   * @throws {Error} When a scale lies outside [0.5, 1.5], explicit seconds are negative or not finite, or an explicit source is empty.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the result's unit and every refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A pause reads `PAUSES`; a travel takes the aimed rule when it states a width and the free-space rule otherwise.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per rung.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is clamped: a scale past its bound and an unsourced value throw.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `aimed` and `transport`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function seconds(span: Span): number {
    if (typeof span === "string") return PAUSES[span];
    if ("distance" in span)
      return span.width === undefined
        ? transport(span.distance)
        : aimed(span.distance, span.width);
    if ("pause" in span) {
      HumanBound.within("pause.scale", span.scale, 0.5, 1.5);
      return PAUSES[span.pause] * span.scale;
    }
    if (span.source.trim() === "")
      throw new Error("Explicit seconds state their source");
    HumanBound.least("seconds", span.seconds, 0, "s");
    return span.seconds;
  }

  /**
   * The action clock's phrase of a set of roles.
   *
   * @param roles The phases by role.
   * @returns The phrase, in seconds; a hold or a decay left out stays out.
   * @throws {Error} When a span is refused by `seconds`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the result and what happens to an absent member.
   * @evidence contracts/development/implementation.md#principled-implementation Each member is its span's seconds; the phrase's structure is unchanged, so the clock reads it as before.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record literal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No absent member is given a length.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates every member to `seconds`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function phrase(roles: IRoles): AutoMovieMotionClock.IPhrase {
    return {
      prepare: seconds(roles.prepare),
      ...(roles.wait !== undefined ? { wait: seconds(roles.wait) } : {}),
      attack: seconds(roles.attack),
      ...(roles.follow !== undefined ? { follow: seconds(roles.follow) } : {}),
      ...(roles.hold !== undefined ? { hold: seconds(roles.hold) } : {}),
      retract: seconds(roles.retract),
    };
  }
}
