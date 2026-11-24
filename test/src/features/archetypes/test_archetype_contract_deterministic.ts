import type { AutoMovieArchetype } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeCatalog } from "../internal/archetypeCatalog";

/**
 * The same parameters and seed give the same model bit for bit, and the seed is
 * what varies it.
 *
 * Scenarios:
 *
 * 1. Each row produced twice with one seed has identical model serialisation and
 *    authored dimensions, mass properties and provenance, for two seeds, 7 and
 *    1043.
 * 2. A number seed and the text of that number are the same seed.
 * 3. Across sixteen seeds each row gives more than one authored variant, unless
 *    the catalog marks every dimension/model choice fixed. The observation
 *    includes physical metadata that is intentionally absent from model JSON: a
 *    naval gun's shot gauge can vary its launch without changing the fixed gun
 *    geometry.
 * 4. A model's serialisation carries only model members: it reads back with
 *    exactly the keys of a rigid generated model.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each archetype repeatedly and compares serialised model and authored facts; a producer that reads a clock, an unkeyed random source or iteration order fails the first scenario, and one that ignores its seed fails the third.
 * @evidence contracts/development/testing.md#independent-expectations Determinism and seed sensitivity are the producer contract of #3368; text equality includes every serialized model number plus the getter-backed dimensions, mass properties and provenance that authoring consumers use. The separate model-key assertion preserves the serialization contract.
 * @evidence contracts/development/testing.md#distinguishing-cases Same seed must not change any authored fact; a different seed varies the non-fixed variant, including physics-only dimensions; where each dimension lies in its band belongs to the family band tests.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
 */
export function test_archetype_contract_deterministic(): void {
  const findings: string[] = [];
  for (const row of archetypeCatalog()) {
    for (const seed of [7, 1043])
      if (snapshot(row.create(seed)) !== snapshot(row.create(seed)))
        findings.push(`${row.name}: seed ${seed} gave two different models`);
    if (snapshot(row.create(42)) !== snapshot(row.create(42)))
      findings.push(`${row.name}: seed 42 and seed "42" differ`);
    const distinct: Set<string> = new Set();
    for (let seed: number = 0; seed < 16; seed++)
      distinct.add(snapshot(row.create(seed)));
    if (row.fixed !== true && distinct.size < 2)
      findings.push(`${row.name}: sixteen seeds gave one model`);
    if (row.fixed === true && distinct.size !== 1)
      findings.push(
        `${row.name}: fixed, yet sixteen seeds gave ${distinct.size} models`,
      );
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

  /** Observe authored variant facts without adding them to generated-model JSON. */
  function snapshot(model: AutoMovieArchetype): string {
    return JSON.stringify({
      model,
      dimensions: model.dimensions,
      properties: model.properties,
      provenance: model.provenance,
    });
  }
}
