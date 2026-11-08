import type {
  IAutoMovieIntent,
  resolveAutoMovieOutcome,
} from "@automovie/engine";

import { KickboxingAction } from "./KickboxingAction";
import { KickboxingDefense } from "./KickboxingDefense";
import { KickboxingTechnique } from "./KickboxingTechnique";

/**
 * The outcome table of the study, in the form the engine's
 * `resolveAutoMovieOutcome` applies to an attack and its answer: rules in
 * priority order, decided before any geometry exists.
 *
 * ```ts
 * resolveAutoMovieOutcome(KickboxingOutcome.table, [strike, answer]).outcome; // "parried"
 * ```
 *
 * @evidence docs/research/kickboxing/exchanges.md#outcomes Every row of the outcome table, including the Brazilian kick against the body-kick read and feints read or ignored.
 * @evidence contracts/development/common.md#meaningful-documentation States the input order and that geometry follows the decision.
 * @evidence contracts/development/design.md#principled-representation Outcome classes are a closed union matching the table's column.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The table and its classes; the engine owns rule application.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Rules read technique records and defense pairing, never names of scenes or fighters.
 */
export namespace KickboxingOutcome {
  /** The outcome classes of the study. */
  export type Outcome =
    | "landed"
    | "parried"
    | "blocked"
    | "evaded"
    | "checked"
    | "read"
    | "ignored"
    | "illegal";

  /** Reads the attack and answer of an `[attack, answer]` pair. */
  const pair = (
    intents: readonly IAutoMovieIntent[],
  ): {
    attack: KickboxingTechnique.ISpec;
    answer: KickboxingAction.Answer;
  } | null => {
    if (intents.length !== 2) return null;
    const attack: KickboxingAction.IAction = KickboxingAction.read(intents[0]!);
    const answer: KickboxingAction.IAction = KickboxingAction.read(intents[1]!);
    if (attack.kind !== "strike" || answer.kind !== "answer") return null;
    return {
      attack: KickboxingTechnique.table[attack.technique],
      answer: answer.answer,
    };
  };
  const rule = (
    id: string,
    outcome: Outcome,
    when: (
      attack: KickboxingTechnique.ISpec,
      answer: KickboxingAction.Answer,
    ) => boolean,
  ): resolveAutoMovieOutcome.IRule<Outcome> => ({
    id,
    outcome,
    when: (intents: readonly IAutoMovieIntent[]): boolean => {
      const read = pair(intents);
      return read !== null && when(read.attack, read.answer);
    },
  });

  /** The ordered table; a pairing the defense table refuses is `illegal`. */
  export const table: resolveAutoMovieOutcome.ITable<Outcome> = Object.freeze({
    rules: Object.freeze([
      rule(
        "unpaired",
        "illegal",
        (attack, answer) => !KickboxingDefense.meets(answer, attack),
      ),
      rule(
        "feint-ignored",
        "ignored",
        (attack, answer) => !!attack.shows && answer === "take",
      ),
      rule("feint-read", "read", (attack) => !!attack.shows),
      rule(
        "disguise-passes",
        "landed",
        (attack, answer) => attack.disguise !== undefined && answer !== "take",
      ),
      rule("undefended", "landed", (_attack, answer) => answer === "take"),
      rule("parried", "parried", (_attack, answer) => answer === "parry"),
      rule("checked", "checked", (_attack, answer) => answer === "check"),
      rule(
        "evaded",
        "evaded",
        (_attack, answer) =>
          answer === "slip" || answer === "roll" || answer === "sway",
      ),
      rule(
        "blocked",
        "blocked",
        (_attack, answer) =>
          answer === "cover" ||
          answer === "elbow-block" ||
          answer === "high-block",
      ),
    ]),
    otherwise: "illegal",
  });

  /**
   * Whether an outcome makes bodies touch, so the geometry must show a contact
   * and sound and marks may follow.
   *
   * @param outcome An outcome class.
   * @returns True for landed, parried, blocked and checked.
   * @evidence docs/research/kickboxing/exchanges.md#outcomes The contact column is empty only for evasions and feints.
   * @evidence contracts/development/common.md#meaningful-documentation States which classes touch.
   * @evidence contracts/development/implementation.md#principled-implementation A membership test.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws The studied contact column.
   * @evidence contracts/development/behaviors.md#relational-goals No position is read.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function touches(outcome: Outcome): boolean {
    return (
      outcome === "landed" ||
      outcome === "parried" ||
      outcome === "blocked" ||
      outcome === "checked"
    );
  }
}
