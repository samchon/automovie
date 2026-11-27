import { AutoMovieEngineCompositionOutcome } from "@automovie/engine";
import type {
  IAutoMovieIntent,
  IAutoMovieResolveOutcome,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `resolveOutcome` decides by the first rule whose condition holds,
 * naming that rule, and otherwise by the table's default, naming none.
 *
 * Scenarios, rules `dodged` then `guarded`, default `lands`:
 *
 * 1. A dodge decides `misses` by `dodged`.
 * 2. A guard and a dodge together still decide by `dodged`, the first rule.
 * 3. A guard alone decides `blocked` by `guarded`.
 * 4. A lone reach falls to the default with no rule.
 */
export function test_engine_composition_resolve_outcome(): void {
  const act = (capability: string): IAutoMovieIntent => ({
    subject: "a",
    capability,
  });
  const has =
    (capability: string) =>
    (intents: readonly IAutoMovieIntent[]): boolean =>
      intents.some(
        (i: IAutoMovieIntent): boolean => i.capability === capability,
      );
  const table: IAutoMovieResolveOutcome.ITable<"lands" | "misses" | "blocked"> =
    {
      rules: [
        { id: "dodged", when: has("dodge"), outcome: "misses" },
        { id: "guarded", when: has("guard"), outcome: "blocked" },
      ],
      otherwise: "lands",
    };
  TestValidator.equals(
    "the first holding rule decides, else the default",
    [
      AutoMovieEngineCompositionOutcome.resolve(table, [act("reach"), act("dodge")]),
      AutoMovieEngineCompositionOutcome.resolve(table, [act("guard"), act("dodge")]),
      AutoMovieEngineCompositionOutcome.resolve(table, [act("guard")]),
      AutoMovieEngineCompositionOutcome.resolve(table, [act("reach")]),
    ],
    [
      { outcome: "misses", rule: "dodged" },
      { outcome: "misses", rule: "dodged" },
      { outcome: "blocked", rule: "guarded" },
      { outcome: "lands" },
    ],
  );
}
