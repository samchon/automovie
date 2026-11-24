import { validateModel } from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeCatalog } from "../internal/archetypeCatalog";

/**
 * Every producer returns a model the engine admits across the campaign's 200
 * numeric seeds and the existing seedless, large and negative edge cases.
 *
 * Scenarios:
 *
 * 1. Each row of the catalog passes `validateModel` without a seed, at numeric
 *    seeds 0 through 199, and at the existing 1043, -5 and 1e6 seeds.
 * 2. Each produced model is a rigid generated object: no skeleton, at least one
 *    part, a body with a positive mass, and at least one affordance.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs every catalog producer through engine model admission at all 200 numeric seeds plus the existing seedless, 1043, negative and large seeds; non-finite frames, unresolved materials, repeated ids, dangling articulation references and non-positive dimensions are reported with their violation paths.
 * @evidence contracts/development/testing.md#independent-expectations The oracle is the engine's own admission (`validateModel`), which the archetypes do not own; its ids, transforms, extents, bodies and articulation-reference rules govern all model consumers. The 200-seed population is the explicit #3368 acceptance requirement, independent of any producer output.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers every catalog producer and kind at 200 numeric seeds and preserves seedless, negative and large numeric cases. Family tests own cited dimension bands and fixed band-edge parameters; malformed model admission belongs to `test_archetype_contract_validation`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the two scenarios and what each pins.
 */
export function test_archetype_contract_valid(): void {
  const findings: string[] = [];
  const seeds: (number | undefined)[] = [undefined, 1043, 1e6, -5];

  // The campaign's 200 draws validate actual models, not only their recorded dimensions.
  for (let seed: number = 0; seed < 200; seed++) seeds.push(seed);
  for (const row of archetypeCatalog())
    for (const seed of seeds) {
      const label: string = `${row.name}@${String(seed)}`;
      const model: ReturnType<typeof row.create> = row.create(seed);
      const validation: IAutoMovieValidation = validateModel({ model });
      if (!validation.success)
        findings.push(
          `${label}: ${validation.violations
            .slice(0, 3)
            .map(
              (v: IAutoMovieConstraintViolation): string =>
                `${v.path} ${v.expected}`,
            )
            .join("; ")}`,
        );
      if (
        model.skeleton !== null ||
        model.parts.length === 0 ||
        !(model.body.mass > 0) ||
        model.affordances.length === 0 ||
        model.origin !== "generated"
      )
        findings.push(`${label}: not a rigid generated model with contacts`);
    }
  TestValidator.equals("every archetype is an admitted model", findings, []);
}
