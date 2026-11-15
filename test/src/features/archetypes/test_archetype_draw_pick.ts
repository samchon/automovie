import { ArchetypeDraw, ArchetypeRefusal } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/** Three made-up alternatives, the default first. */
const ALTERNATIVES: readonly ("a" | "b" | "c")[] = ["a", "b", "c"];

/**
 * A seeded pick is one of a producer's closed alternatives, given or drawn whole.
 *
 * Scenarios:
 * 1. A value given is returned as given for any seed; a value not listed is refused with kind `parameter`, the axis and exactly the alternatives.
 * 2. With no seed and no value, the pick is the first alternative.
 * 3. The same seed gives the same pick on every call, a number seed and its text the same pick, and over 300 seeds each of three alternatives is drawn at least 60 times.
 * 4. The pick is keyed by producer and axis: over 300 seeds, two axes of one producer, and one axis of two producers, do not always agree.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `pick` and reads its result and refusal; a pick that ignores a given value, accepts an unlisted one, depends on call order, skips an alternative or reuses one stream for two axes is caught.
 * @evidence contracts/development/testing.md#independent-expectations The refusal contract of #3368; a uniform draw of three over 300 seeds gives each 100 on average with a standard deviation near 8, so 60 lies five deviations below; two independent uniform draws of three agree on a third of seeds, so 300 agreements is impossible for independent streams.
 * @evidence contracts/development/testing.md#distinguishing-cases Given, refused, seedless and drawn; one axis against another and one producer against another.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over pure functions, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the four scenarios and what each pins.
 */
export function test_archetype_draw_pick(): void {
  const findings: string[] = [];
  for (const seed of [undefined, 0, 7, "seven"])
    if (ArchetypeDraw.pick("thing", "model", "b", ALTERNATIVES, seed) !== "b")
      findings.push(`seed ${String(seed)}: a given value was not kept`);
  try {
    ArchetypeDraw.pick("thing", "model", "d" as "a", ALTERNATIVES, 1);
    findings.push("an unlisted value was accepted");
  } catch (error) {
    if (
      !(error instanceof ArchetypeRefusal) ||
      error.kind !== "parameter" ||
      error.axis !== "model" ||
      JSON.stringify(error.feasible) !==
        JSON.stringify({ kind: "alternatives", values: ALTERNATIVES })
    )
      findings.push("an unlisted value was refused without its alternatives");
  }
  if (
    ArchetypeDraw.pick("thing", "model", undefined, ALTERNATIVES, undefined) !==
    "a"
  )
    findings.push("the seedless pick is not the first alternative");

  const counts: Map<string, number> = new Map();
  let axes: number = 0;
  let producers: number = 0;
  for (let seed: number = 0; seed < 300; seed++) {
    const once: string = ArchetypeDraw.pick(
      "thing",
      "model",
      undefined,
      ALTERNATIVES,
      seed,
    );
    if (
      ArchetypeDraw.pick("thing", "model", undefined, ALTERNATIVES, seed) !==
        once ||
      ArchetypeDraw.pick(
        "thing",
        "model",
        undefined,
        ALTERNATIVES,
        String(seed),
      ) !== once
    )
      findings.push(`seed ${seed}: the pick is not deterministic`);
    counts.set(once, (counts.get(once) ?? 0) + 1);
    if (
      ArchetypeDraw.pick("thing", "finish", undefined, ALTERNATIVES, seed) ===
      once
    )
      axes++;
    if (
      ArchetypeDraw.pick("other", "model", undefined, ALTERNATIVES, seed) ===
      once
    )
      producers++;
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
