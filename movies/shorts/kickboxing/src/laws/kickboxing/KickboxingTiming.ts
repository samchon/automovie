import type { resolveAutoMovieSchedule } from "@automovie/engine";

import { KickboxingAction } from "./KickboxingAction";
import { KickboxingTechnique } from "./KickboxingTechnique";

/**
 * How long each bout action takes and when its decisive instant falls, from
 * the measured punch and kick phases. Strikes in a combination follow the
 * previous punch's impact; kicks include their recoil to the replant, so the
 * next part of a sequence starts with the support restored.
 *
 * ```ts
 * KickboxingTiming.of(KickboxingAction.read(intent)); // { duration, contact }
 * ```
 *
 * @evidence docs/research/kickboxing/techniques.md#punch-timing Jab delivery 0.405 s; alternating-hand interval 1.05 / 3 s; same-hand interval 1.35 / 3 s; recovery one alternating interval.
 * @evidence docs/research/kickboxing/techniques.md#kick-timing Chamber key 0.074 + 0.14 x 1.02 s, impact 0.11 x 1.02 s later, recoil 0.65 s; teep and knee by their stated analogues.
 * @evidence docs/research/kickboxing/exchanges.md#feints A feint's shown part and its return take the shown technique's own time.
 * @evidence docs/research/kickboxing/ring-generalship.md#step About three steps per second between exchanges.
 * @evidence contracts/development/common.md#meaningful-documentation States the law, units (seconds) and how combinations chain.
 * @evidence contracts/development/design.md#principled-representation Every constant is a named law with its source; durations are seconds of film time.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The constants the pose and interaction laws also read are exported; `of` serves the schedule resolver.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No technique or scene is special-cased beyond its family and record.
 */
export namespace KickboxingTiming {
  /** Single maximal jab, onset to contact, seconds (Stanley et al. 2018, abstract). */
  export const JAB_DELIVERY: number = 0.405;

  /** Contact-to-contact interval between alternating hands in a combination, seconds (Piorkowski et al. 2011: 1.05 s over three intervals). */
  export const ALTERNATING_INTERVAL: number = 1.05 / 3;

  /** Contact-to-contact interval between two punches of the same hand, seconds (Piorkowski et al. 2011: 1.35 s over three intervals). */
  export const SAME_HAND_INTERVAL: number = 1.35 / 3;

  /** A punching or defending hand's return to the guard: the remaining alternating interval, seconds. */
  export const HAND_RECOVERY: number = ALTERNATING_INTERVAL;

  /** Gavagan and Sayers 2017, Muay Thai roundhouse execution, toe-down to heel-down, seconds. */
  const KICK_EXECUTION: number = 1.02;

  /** Launch to the kick's chamber key: preparation 0.074 s plus 14% of the execution, seconds. */
  export const KICK_CHAMBER: number = 0.074 + 0.14 * KICK_EXECUTION;

  /** Launch to impact: the chamber key plus the 11% extension, seconds. */
  export const KICK_IMPACT: number = KICK_CHAMBER + 0.11 * KICK_EXECUTION;

  /** Impact to the kicking foot's replant, seconds (measured recoil). */
  export const KICK_RECOIL: number = 0.65;

  /**
   * Seconds per step between exchanges: about three steps per second, the
   * light bouncing cadence of kickboxing footwork inside the 2 to 3.5 steps
   * per second the study records; a walking cadence of two read as slow.
   */
  export const STEP_PERIOD: number = 0.35;

  /**
   * Seconds per step of ordinary walking, to the corner and in the victory
   * lap: the comfortable adult cadence of about 110 steps per minute (Perry
   * and Burnfield, Gait Analysis, normal gait parameters).
   */
  export const WALK_PERIOD: number = 60 / 110;

  /**
   * Whether a movement is ordinary walking rather than the fighting stance's
   * short steps.
   *
   * @param movement The movement.
   * @returns True for walking to the corner, the celebration and walking up
   *   to the opponent after the bout.
   */
  export function walking(movement: KickboxingAction.Movement): boolean {
    return KickboxingAction.movements[movement].walking;
  }

  /**
   * Seconds from a strike's launch to its contact or shown peak.
   *
   * @param technique The technique.
   * @param follows The same fighter's previous punch when this one continues its combination.
   * @returns Delivery seconds.
   * @evidence docs/research/kickboxing/techniques.md#punch-timing Punches chain at the measured combination intervals; a first punch takes the single-jab delivery.
   * @evidence docs/research/kickboxing/techniques.md#kick-timing Kicks reach impact at the measured phase; the knee at the chamber key.
   * @evidence contracts/development/common.md#meaningful-documentation States the unit and both inputs.
   * @evidence contracts/development/implementation.md#principled-implementation Delivery is chosen by family from measured phases; a feint shows the stated share of the shown technique's delivery, up to the chamber key for kicks.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One function serves strikes, feints and the answers that align to them.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No technique name is special-cased.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws Every value is a measured or stated law above.
   * @evidence contracts/development/behaviors.md#relational-goals No position is read.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function delivery(
    technique: KickboxingTechnique.Name,
    follows?: KickboxingTechnique.Name,
  ): number {
    const spec: KickboxingTechnique.ISpec =
      KickboxingTechnique.table[technique];
    if (spec.shows) {
      const shown: KickboxingTechnique.ISpec =
        KickboxingTechnique.table[spec.shows.of];
      const full: number =
        shown.limb === "arm" ? delivery(shown.name, follows) : KICK_CHAMBER;
      return full * spec.shows.share;
    }
    if (spec.family === "punch") {
      const previous: KickboxingTechnique.ISpec | undefined =
        follows === undefined ? undefined : KickboxingTechnique.table[follows];
      if (previous === undefined || previous.limb !== "arm")
        return JAB_DELIVERY;
      return previous.side === spec.side
        ? SAME_HAND_INTERVAL
        : ALTERNATING_INTERVAL;
    }
    return spec.family === "knee" ? KICK_CHAMBER : KICK_IMPACT;
  }

  /**
   * Seconds a strike's limb needs after its contact before the fighter's next
   * action may start: a feint's return, nothing for a punch (the next punch
   * projects from its impact and the hand recovers meanwhile), a kick's or
   * knee's recoil to the replant.
   *
   * @param technique The technique.
   * @param follows As for `delivery`.
   * @returns Seconds after contact.
   * @evidence docs/research/kickboxing/techniques.md#punch-timing Projection starts at the previous impact.
   * @evidence docs/research/kickboxing/techniques.md#kick-timing Recoil to heel-down.
   * @evidence contracts/development/common.md#meaningful-documentation States each family's rule.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the family and the measured recoil.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One function.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws Measured phases.
   * @evidence contracts/development/behaviors.md#relational-goals No position is read.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function after(
    technique: KickboxingTechnique.Name,
    follows?: KickboxingTechnique.Name,
  ): number {
    const spec: KickboxingTechnique.ISpec =
      KickboxingTechnique.table[technique];
    if (spec.shows) return delivery(technique, follows);
    return spec.family === "punch" ? 0 : KICK_RECOIL;
  }

  /**
   * Seconds an answer takes after the answered contact: a hand or the body
   * returns over one hand recovery, a check replants over a kick's recoil,
   * and an answer to a feint first holds while the feint returns.
   *
   * @param answer The answer.
   * @param against The answered technique.
   * @returns Seconds after the answered contact.
   * @evidence docs/research/kickboxing/exchanges.md#feints The answer holds until the feint has returned.
   * @evidence docs/research/kickboxing/techniques.md#kick-timing The checking leg replants over the kick recoil, the closest measured leg return.
   * @evidence contracts/development/common.md#meaningful-documentation States each rule.
   * @evidence contracts/development/implementation.md#principled-implementation Sums the hold and the return.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One function.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws Measured returns.
   * @evidence contracts/development/behaviors.md#relational-goals No position is read.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function answerTail(
    answer: KickboxingAction.Answer,
    against: KickboxingTechnique.Name,
  ): number {
    const hold: number = KickboxingTechnique.table[against].shows
      ? delivery(against)
      : 0;
    return hold + (answer === "check" ? KICK_RECOIL : HAND_RECOVERY);
  }

  /**
   * The schedule timing of one bout action.
   *
   * @param action The action.
   * @returns Its duration and, for strikes, answers and touches, its contact offset.
   * @evidence docs/research/kickboxing/techniques.md#laws The family laws above.
   * @evidence contracts/development/common.md#meaningful-documentation States what each kind yields.
   * @evidence contracts/development/implementation.md#principled-implementation Composes delivery, after and answerTail; movements take whole steps; phases and touches take the seconds their record states.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One switch over the action kind.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws Measured phases.
   * @evidence contracts/development/behaviors.md#relational-goals No position is read.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function of(
    action: KickboxingAction.IAction,
  ): resolveAutoMovieSchedule.ITiming {
    switch (action.kind) {
      case "strike": {
        const contact: number = delivery(action.technique, action.follows);
        return {
          duration: contact + after(action.technique, action.follows),
          contact,
        };
      }
      case "answer":
        return {
          duration: action.lead + answerTail(action.answer, action.against),
          contact: action.lead,
        };
      case "defend":
        throw new Error(
          `An unpaired ${action.answer} has no timing; an exchange pairs it first`,
        );
      case "move":
        return {
          duration:
            action.seconds ??
            action.steps *
              (walking(action.movement) ? WALK_PERIOD : STEP_PERIOD),
        };
      case "touch":
        return { duration: action.seconds, contact: action.reach };
      case "phase":
        return { duration: action.seconds };
    }
  }
}
