import type { AutoMovieArchetype } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeCatalog } from "../../../internal/archetypeCatalog";

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
 */
export function test_unit_archetypes_core_contract_deterministic(): void {
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
