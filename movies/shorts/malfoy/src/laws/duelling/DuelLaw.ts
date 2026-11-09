/**
 * The practice duel's laws: casting phases, the spell streak's speed,
 * reaction and sweep times, deflection feasibility, footwork step length and
 * time, shield formation and life, the grip escape and the run-in, from the
 * duel study and the wand-magic settings.
 *
 * ```ts
 * DuelLaw.deflectable(2.0); // true: 0.4 s of travel covers reaction plus sweep
 * DuelLaw.outcome("jinx", "deflect", 2.0); // "deflected"
 * ```
 *
 * @evidence docs/research/duelling/practice-duel.md#casting Still aim at least 0.25 s, gesture 0.15–0.25 s, one spell per 0.8 s, streak 5 ± 1 m/s.
 * @evidence docs/research/duelling/practice-duel.md#reaction Reaction 0.21–0.25 s.
 * @evidence docs/research/duelling/practice-duel.md#deflection Sweep 0.10–0.15 s; deflectable when travel time covers reaction plus sweep; up to 60° away.
 * @evidence docs/research/duelling/practice-duel.md#footwork Steps of 0.3–0.5 m taking 0.3–0.5 s.
 * @evidence docs/research/duelling/practice-duel.md#grip The underarm turn releases the grip 0.8–1.2 s after it starts.
 * @evidence docs/research/duelling/practice-duel.md#run-in Two to four running steps at 2–3 m/s.
 * @evidence docs/research/duelling/practice-duel.md#outcomes The outcome table.
 * @evidence docs/body/settings/world/magic.md#practice-only Shield forms 0.25–0.4 s after the gesture and lasts at most 3 s.
 * @evidence docs/body/settings/props/shield.md#lifecycle Fades over 0.4 s.
 * @evidence contracts/development/behaviors.md#studied-laws Every constant is the study's value.
 * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
 * @evidence contracts/development/common.md#meaningful-documentation States units and sources.
 * @evidence contracts/development/design.md#principled-representation Seconds, metres and metres per second; outcomes as a closed union.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The values the duel steps, spell track and tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No scene is named.
 */
export namespace DuelLaw {
  /** Still aim before a gesture, seconds. */
  export const AIM: number = 0.25;

  /** Casting gesture, seconds (0.15–0.25). */
  export const GESTURE: number = 0.2;

  /** Streak speed, metres per second. */
  export const SPELL_SPEED: number = 5;

  /** Visual reaction time, seconds (middle of 0.21–0.25). */
  export const REACTION: number = 0.23;

  /** Earliest defensive start after a visible gesture, seconds. */
  export const REACTION_MIN: number = 0.21;

  /** Deflecting sweep, seconds (0.10–0.15). */
  export const SWEEP: number = 0.12;

  /** Largest deflection from the incoming line, radians. */
  export const DEFLECTION_MAX: number = Math.PI / 3;

  /** Footwork step length, metres. */
  export const STEP: number = 0.4;

  /** Footwork step time, seconds. */
  export const STEP_TIME: number = 0.4;

  /** Shield formation for the fastest and slower casters, seconds. */
  export const SHIELD_FORM = Object.freeze({ fast: 0.25, slow: 0.4 });

  /** Longest shield hold, seconds. */
  export const SHIELD_MAX: number = 3;

  /** Shield fade, seconds. */
  export const SHIELD_FADE: number = 0.4;

  /** Grip reach, seconds to closing. */
  export const GRIP: number = 0.25;

  /** Underarm turn, seconds (0.8–1.2). */
  export const TURN_UNDER: number = 1.0;

  /** Run-in speed, metres per second (2–3). */
  export const RUN_SPEED: number = 2.5;

  /** Quick guided sideways step: length and time (0.5–0.7 m in 0.35–0.45 s). */
  export const GUIDE_STEP = Object.freeze({ length: 0.6, time: 0.4 });

  /** The quickest guided step, the study's fast end: 0.7 m in 0.35 s. */
  export const GUIDE_QUICK = Object.freeze({ length: 0.7, time: 0.35 });

  /** Sprinting run-in speed, the study's fast end, metres per second. */
  export const RUN_SPRINT: number = 3;

  /** A spell's outcome class. */
  export type Outcome = "deflected" | "hit" | "blocked" | "missed" | "disarmed";

  /**
   * Whether a watched streak can be deflected at a casting distance.
   *
   * @param distance Metres from wand tip to the defender's wand.
   * @returns True when travel time covers reaction plus sweep.
   */
  export function deflectable(distance: number): boolean {
    return distance / SPELL_SPEED >= REACTION + SWEEP;
  }

  /**
   * A spell's outcome from the attacker's spell, the defender's answer and the distance.
   *
   * @param spell The spell.
   * @param answer The defender's answer.
   * @param distance Casting distance, metres.
   * @returns The outcome class.
   */
  export function outcome(spell: "jinx" | "disarm", answer: "deflect" | "shield" | "none", distance: number): Outcome {
    if (answer === "shield") return "blocked";
    if (answer === "deflect" && deflectable(distance)) return "deflected";
    return spell === "disarm" ? "disarmed" : "hit";
  }
}
