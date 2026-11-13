import { TestValidator } from "@nestia/e2e";

import { archetypeCatalog } from "../internal/archetypeCatalog";

/**
 * The same parameters and seed give the same model bit for bit, and the seed is what varies it.
 *
 * Scenarios:
 * 1. Each row of the catalog produced twice with one seed serialises to identical text, for a number seed and a text seed.
 * 2. A number seed and the text of that number are the same seed.
 * 3. Across sixteen seeds each row gives more than one model, unless every one of its dimensions is fixed by its source (the catalog's rows all have at least one free dimension).
 * 4. A model's serialisation carries only model members: it reads back with exactly the keys of a rigid generated model.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each archetype repeatedly and compares the serialised models; a producer that reads a clock, an unkeyed random source or iteration order fails the first scenario, and one that ignores its seed fails the third.
 * @evidence contracts/development/testing.md#independent-expectations Determinism and seed sensitivity are the producer contract of #3368; text equality of the serialised model is bit identity of every number in it.
 * @evidence contracts/development/testing.md#distinguishing-cases Same seed must not change the model, a different seed must; where each dimension lies in its band belongs to the family band tests.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
 */
export function test_archetype_contract_deterministic(): void {
  const findings: string[] = [];
  for (const row of archetypeCatalog()) {
    for (const seed of [7, "scene-3/chair-1"])
      if (JSON.stringify(row.create(seed)) !== JSON.stringify(row.create(seed)))
        findings.push(`${row.name}: seed ${seed} gave two different models`);
    if (JSON.stringify(row.create(42)) !== JSON.stringify(row.create("42")))
      findings.push(`${row.name}: seed 42 and seed "42" differ`);
    const distinct: Set<string> = new Set();
    for (let seed: number = 0; seed < 16; seed++)
      distinct.add(JSON.stringify(row.create(seed)));
    if (distinct.size < 2)
      findings.push(`${row.name}: sixteen seeds gave one model`);
    const keys: string = Object.keys(
      JSON.parse(JSON.stringify(row.create(1))) as object,
    )
      .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
      .join(",");
    if (
      keys !== "affordances,asset,body,id,materials,name,origin,parts,skeleton"
    )
      findings.push(`${row.name}: serialises with keys ${keys}`);
  }
  TestValidator.equals("producers are deterministic in the seed", findings, []);
}
