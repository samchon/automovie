import { validateModel } from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeCatalog } from "../internal/archetypeCatalog";

/**
 * Every producer returns a model the engine admits, for no seed and for a spread of seeds.
 *
 * Scenarios:
 * 1. Each row of the catalog, produced without a seed and with eight seeds, passes `validateModel` with no violation.
 * 2. Each produced model is a rigid generated object: no skeleton, at least one part, a body with a positive mass, and at least one affordance.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs every producer and the engine's model admission on its result; a producer that emits a non-finite frame, an unresolved material, a repeated id, an articulation reference that does not resolve or a non-positive dimension is caught with the violation's path.
 * @evidence contracts/development/testing.md#independent-expectations The oracle is the engine's own admission (`validateModel`), which the archetypes do not own; its rules for ids, transforms, extents, bodies and articulation references are the contract every model consumer relies on.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers every producer and kind once, seedless and seeded; malformed models and the admission's refusals belong to `test_archetype_contract_validation`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the two scenarios and what each pins.
 */
export function test_archetype_contract_valid(): void {
  const findings: string[] = [];
  for (const row of archetypeCatalog())
    for (const seed of [
      undefined,
      0,
      1,
      2,
      3,
      "scene-3/chair-1",
      97,
      1e6,
      -5,
    ]) {
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
