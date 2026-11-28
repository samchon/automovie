import {
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeRefusal,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/** Three made-up alternatives, the default first. */
const ALTERNATIVES: readonly ("a" | "b" | "c")[] = ["a", "b", "c"];

/** The alternatives as models without figures, in their order. */
const MODELS: Readonly<
  Record<"a" | "b" | "c", Readonly<Record<never, number>>>
> = {
  a: {},
  b: {},
  c: {},
};

/**
 * One axis's pick through a fresh session, as a producer makes it.
 *
 * @param archetype The producer's name.
 * @param axis The axis.
 * @param value The alternative given, or undefined.
 * @param seed The seed.
 * @returns The alternative.
 */
function pick(
  archetype: string,
  axis: string,
  value: "a" | "b" | "c" | undefined,
  seed: number | undefined,
): string {
  return new AutoMovieArchetypeDrawSession<never>(archetype, {}, seed).model(
    axis,
    value,
    MODELS,
  ).name!;
}

/**
 * A session's seeded pick is one of a producer's closed alternatives, given or
 * drawn whole.
 *
 * Scenarios:
 *
 * 1. A value given is returned as given for any seed; a value not listed is
 *    refused with kind `parameter`, the axis and exactly the alternatives.
 * 2. With no seed and no value, the pick is the first alternative.
 * 3. The same seed gives the same pick on every call, and over 300 seeds each of
 *    three alternatives is drawn at least 60 times.
 * 4. The pick is keyed by producer and axis: over 300 seeds, two axes of one
 *    producer, and one axis of two producers, do not always agree.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the explicit, empty and seeded selector cases and the separate producer and axis streams.
 * @evidence contracts/development/testing.md#behavioral-verification Picks from a three-model fixture through a fresh session. It checks the explicit choice, the refused axis and alternatives, the no-seed default, repeatability, reachability and disagreements across producer and axis.
 * @evidence contracts/development/testing.md#independent-expectations The fixture's literal order gives the unseeded answer. Three equiprobable choices over 300 draws give an expected count of 100 per choice and a standard deviation just over 8. The test requires 60 per choice and at least one disagreement for each independent stream comparison.
 */
export function test_archetype_draw_pick(): void {
  const findings: string[] = [];
  for (const seed of [undefined, 0, 7, 1044])
    if (pick("thing", "model", "b", seed) !== "b")
      findings.push(`seed ${String(seed)}: a given value was not kept`);
  try {
    pick("thing", "model", "d" as "a", 1);
    findings.push("an unlisted value was accepted");
  } catch (error) {
    if (
      !(error instanceof AutoMovieArchetypeRefusal) ||
      error.kind !== "parameter" ||
      error.axis !== "model" ||
      JSON.stringify(error.feasible) !==
        JSON.stringify({ kind: "alternatives", values: ALTERNATIVES })
    )
      findings.push("an unlisted value was refused without its alternatives");
  }
  if (pick("thing", "model", undefined, undefined) !== "a")
    findings.push("the seedless pick is not the first alternative");

  const counts: Map<string, number> = new Map();
  let axes: number = 0;
  let producers: number = 0;
  for (let seed: number = 0; seed < 300; seed++) {
    const once: string = pick("thing", "model", undefined, seed);
    if (pick("thing", "model", undefined, seed) !== once)
      findings.push(`seed ${seed}: the pick is not deterministic`);
    counts.set(once, (counts.get(once) ?? 0) + 1);
    if (pick("thing", "finish", undefined, seed) === once) axes++;
    if (pick("other", "model", undefined, seed) === once) producers++;
  }
  for (const value of ALTERNATIVES)
    if (!((counts.get(value) ?? 0) >= 60))
      findings.push(
        `${value} was drawn ${counts.get(value) ?? 0} times of 300`,
      );
  if (axes === 300) findings.push("two axes share one stream");
  if (producers === 300) findings.push("two producers share one stream");
  TestValidator.equals(
    "a pick is one alternative, given or drawn",
    findings,
    [],
  );
}
