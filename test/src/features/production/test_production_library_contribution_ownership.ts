import { validateAutoMovieEnvironmentContext, validateBuiltEnvironment, validateModel } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { analysisContext } from "../internal/analysisFixtures";
import { createLibraryContributionAdmissionInput } from "../internal/createLibraryContributionAdmissionInput";
import { drawingBoxModel } from "../internal/drawingFixtures";
import { rectangularBuilding } from "../internal/envelopeFixtures";
import { loadSourceModule } from "../internal/loadSourceModule";

const { admitAutoMovieLibraryContribution } = loadSourceModule<{
  admitAutoMovieLibraryContribution(props: ReturnType<typeof createLibraryContributionAdmissionInput>): boolean;
}>(path.resolve(__dirname, "../../../../packages/production/src/production/admitAutoMovieLibraryContribution.ts"));

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
 */
export const test_production_library_contribution_ownership = (): void => {
  const environment = rectangularBuilding();
  const model = drawingBoxModel({ id: "ship", shape: { type: "box", width: 1, height: 1, depth: 1 }, material: "wood" });
  const context = analysisContext();
  TestValidator.equals("the arranged carriers are valid", [validateBuiltEnvironment({ environment }).success, validateModel({ model }).success, validateAutoMovieEnvironmentContext({ context }).success], [true, true, true]);
  const input = createLibraryContributionAdmissionInput({ environments: [environment], models: [model], contexts: [context] });
  TestValidator.equals("first owner is admitted", admitAutoMovieLibraryContribution(input), true);
  TestValidator.equals("first owner produces no refusal", input.diagnostics, []);
  TestValidator.equals("each domain retains its exact owner", [input.environmentOwner.get(environment.id), input.modelOwner.get(model.id), input.contextOwner.get(context.id)], [input.registration.design, input.registration.design, input.registration.design]);
  const replacement = { ...model, name: "a different candidate" };
  const second = { ...input, source: "src/models/other.ts", registration: { ...input.registration, design: "docs/models/other.md#other", export: "other", contribution: { environments: [environment], models: [replacement], contexts: [context] } } };
  TestValidator.equals("duplicate identities are refused", admitAutoMovieLibraryContribution(second), false);
  TestValidator.equals("all three duplicate causes are retained", input.diagnostics.map(({ code, category, path }) => ({ code, category, path })), Array.from({ length: 3 }, () => ({ code: "source-export-invalid" as const, category: "error" as const, path: second.source })));
  TestValidator.predicate("duplicate model never replaces the first", input.models.get(model.id) === model);
  const empty = createLibraryContributionAdmissionInput({ environments: [], models: [], contexts: [] });
  TestValidator.equals("empty intermediate result claims nothing", { admitted: admitAutoMovieLibraryContribution(empty), owners: [empty.environmentOwner.size, empty.modelOwner.size, empty.contextOwner.size], diagnostics: empty.diagnostics }, { admitted: true, owners: [0, 0, 0], diagnostics: [] });
};
