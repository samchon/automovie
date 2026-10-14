import {
  validateAutoMovieEnvironmentContext,
  validateBuiltEnvironment,
  validateModel,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import type { IAutoMovieDiagnostic } from "@automovie/interface";
import { admitAutoMovieLibraryContribution } from "../../../../packages/production/src/production/admitAutoMovieLibraryContribution";

import { analysisContext } from "../internal/analysisFixtures";
import { createLibraryContributionAdmissionInput } from "../internal/createLibraryContributionAdmissionInput";
import { drawingBoxModel } from "../internal/drawingFixtures";
import { rectangularBuilding } from "../internal/envelopeFixtures";

/**
 * Library publication identities have one owner per complete compile attempt.
 *
 * Scenarios:
 * 1. A valid environment, model and world context claim their separate identity
 *    domains without producing any diagnostic.
 * 2. A second source with the same three identities is refused and cannot
 *    replace the first model or its owner.
 * 3. An empty intermediate contribution claims nothing and remains admissible;
 *    completion's nonempty branch contract is enforced by the source collector.
 *
 * @evidence contracts/testing.md#behavioral-verification Checks fixture carriers with real engine validators, admits their first production owner, refuses a duplicate source in all three id domains and verifies the first model remains, then observes a no-claim empty intermediate result.
 * @evidence contracts/testing.md#independent-expectations Each authored carrier id has one publishing source per compile attempt, so reusing those ids must retain three duplicate causes and cannot replace the first model reference. Empty intermediate data claims nothing; nonempty completion is a separate collector policy.
 * @evidence contracts/testing.md#distinguishing-cases Valid first claims contrast with a later source carrying the same ids and an empty intermediate contribution; warning/error translation and unsupported branch carriers have separate entries. Real validators provide admission premises rather than an external geometric oracle.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_production_library_contribution_ownership owns synchronous portable validator/policy calls on existing fixtures, without a native artifact, source-evaluation host or dynamically registered cases.
 */
export function test_production_library_contribution_ownership(): void {
  const environment: ReturnType<typeof rectangularBuilding> = rectangularBuilding();
  const model: ReturnType<typeof drawingBoxModel> = drawingBoxModel({
    id: "ship",
    shape: { type: "box", width: 1, height: 1, depth: 1 },
    material: "wood",
  });
  const context: ReturnType<typeof analysisContext> = analysisContext();
  TestValidator.equals(
    "the arranged carriers are valid",
    [
      validateBuiltEnvironment({ environment }).success,
      validateModel({ model }).success,
      validateAutoMovieEnvironmentContext({ context }).success,
    ],
    [true, true, true],
  );
  const input: ReturnType<typeof createLibraryContributionAdmissionInput> = createLibraryContributionAdmissionInput({
    environments: [environment],
    models: [model],
    contexts: [context],
  });
  TestValidator.equals(
    "first owner is admitted",
    admitAutoMovieLibraryContribution(input),
    true,
  );
  TestValidator.equals(
    "first owner produces no refusal",
    input.diagnostics,
    [],
  );
  TestValidator.equals(
    "each domain retains its exact owner",
    [
      input.environmentOwner.get(environment.id),
      input.modelOwner.get(model.id),
      input.contextOwner.get(context.id),
    ],
    [
      input.registration.design,
      input.registration.design,
      input.registration.design,
    ],
  );
  const replacement: typeof model = { ...model, name: "a different candidate" };
  const second: typeof input = {
    ...input,
    source: "src/models/other.ts",
    registration: {
      ...input.registration,
      design: "docs/models/other.md#other",
      export: "other",
      contribution: {
        environments: [environment],
        models: [replacement],
        contexts: [context],
      },
    },
  };
  TestValidator.equals(
    "duplicate identities are refused",
    admitAutoMovieLibraryContribution(second),
    false,
  );
  TestValidator.equals(
    "all three duplicate causes are retained",
    input.diagnostics.map(({ code, category, path }: IAutoMovieDiagnostic): Pick<IAutoMovieDiagnostic, "code" | "category" | "path"> => ({
      code,
      category,
      path,
    })),
    Array.from({ length: 3 }, (): Pick<IAutoMovieDiagnostic, "code" | "category" | "path"> => ({
      code: "source-export-invalid" as const,
      category: "error" as const,
      path: second.source,
    })),
  );
  TestValidator.predicate(
    "duplicate model never replaces the first",
    input.models.get(model.id) === model,
  );
  const empty: ReturnType<typeof createLibraryContributionAdmissionInput> = createLibraryContributionAdmissionInput({
    environments: [],
    models: [],
    contexts: [],
  });
  TestValidator.equals(
    "empty intermediate result claims nothing",
    {
      admitted: admitAutoMovieLibraryContribution(empty),
      owners: [
        empty.environmentOwner.size,
        empty.modelOwner.size,
        empty.contextOwner.size,
      ],
      diagnostics: empty.diagnostics,
    },
    { admitted: true, owners: [0, 0, 0], diagnostics: [] },
  );
}
