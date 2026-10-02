import type { IAutoMovieLibraryContribution, IAutoMovieEnvironmentContext } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { analysisContext } from "../internal/analysisFixtures";
import { createLibraryContributionAdmissionInput } from "../internal/createLibraryContributionAdmissionInput";
import { drawingBoxModel } from "../internal/drawingFixtures";
import { rectangularBuilding } from "../internal/envelopeFixtures";
import { loadSourceModule } from "../internal/loadSourceModule";

const { admitAutoMovieLibrarySettingsContribution } = loadSourceModule<{
  admitAutoMovieLibrarySettingsContribution(props: ReturnType<typeof createLibraryContributionAdmissionInput>): boolean;
}>(path.resolve(__dirname, "../../../../packages/production/src/production/admitAutoMovieLibrarySettingsContribution.ts"));

/**
 * Settings lineage cannot publish an artifact owned by a design-source branch.
 *
 * Scenarios:
 * 1. Zero-payload settings is admitted without a diagnostic.
 * 2. One environment, model or context independently refuses settings output.
 * 3. Refusal preserves the contribution and names its exact source and export.
 */
export const test_production_library_settings_payload = (): void => {
  const empty = createLibraryContributionAdmissionInput({ environments: [], models: [], contexts: [] });
  TestValidator.equals("zero-payload settings is admitted", { admitted: admitAutoMovieLibrarySettingsContribution(empty), diagnostics: empty.diagnostics }, { admitted: true, diagnostics: [] });
  const contributions: Array<IAutoMovieLibraryContribution & { contexts: IAutoMovieEnvironmentContext[] }> = [
    { environments: [rectangularBuilding()], models: [], contexts: [] },
    { environments: [], models: [drawingBoxModel({ id: "ship", shape: { type: "box", width: 1, height: 1, depth: 1 }, material: "wood" })], contexts: [] },
    { environments: [], models: [], contexts: [analysisContext()] },
  ];
  for (const contribution of contributions) {
    const before = JSON.stringify(contribution);
    const input = createLibraryContributionAdmissionInput(contribution);
    TestValidator.equals("each semantic carrier refuses settings output", admitAutoMovieLibrarySettingsContribution(input), false);
    TestValidator.equals("refusal preserves source attribution", input.diagnostics.map(({ code, category, target, path }) => ({ code, category, target, path })), [{ code: "source-export-invalid", category: "error", target: input.target, path: input.source }]);
    TestValidator.predicate("refusal names the selected export", input.diagnostics[0]!.message.includes(`"${input.registration.export}"`));
    TestValidator.equals("settings refusal never rewrites its payload bytes", JSON.stringify(contribution), before);
  }
};
