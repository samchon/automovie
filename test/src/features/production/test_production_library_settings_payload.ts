import type {
  IAutoMovieEnvironmentContext,
  IAutoMovieLibraryContribution,
  IAutoMovieDiagnostic,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { admitAutoMovieLibrarySettingsContribution } from "../../../../packages/production/src/production/admitAutoMovieLibrarySettingsContribution";

import { analysisContext } from "../internal/analysisFixtures";
import { createLibraryContributionAdmissionInput } from "../internal/createLibraryContributionAdmissionInput";
import { drawingBoxModel } from "../internal/drawingFixtures";
import { rectangularBuilding } from "../internal/envelopeFixtures";

/**
 * Settings lineage cannot publish an artifact owned by a design-source branch.
 *
 * Scenarios:
 * 1. Zero-payload settings is admitted without a diagnostic.
 * 2. One environment, model or context independently refuses settings output.
 * 3. Refusal preserves the contribution and names its exact source and export.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real settings-contribution admission with empty and independently populated environment/model/context carriers, asserting admission/refusal, diagnostic address/code/category, named export and unchanged payload serialization.
 * @evidence contracts/testing.md#independent-expectations Settings lineage owns zero geometry/context payload; each authored nonempty carrier violates that boundary independently and must yield the literal source-export-invalid diagnostic. Expected addresses come from the supplied registration, not returned findings.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the empty positive case and all three single-carrier negative twins while checking refusal does not rewrite any contribution. General design-source domain validation and duplicate registration are covered elsewhere.
 * @evidence contracts/testing.md#execution-ownership The named test_production_library_settings_payload owns these portable in-memory admission cases over numerical fixtures; no source module is executed, artifact published or native host started.
 */
export function test_production_library_settings_payload(): void {
  const empty: ReturnType<typeof createLibraryContributionAdmissionInput> = createLibraryContributionAdmissionInput({
    environments: [],
    models: [],
    contexts: [],
  });
  TestValidator.equals(
    "zero-payload settings is admitted",
    {
      admitted: admitAutoMovieLibrarySettingsContribution(empty),
      diagnostics: empty.diagnostics,
    },
    { admitted: true, diagnostics: [] },
  );
  const contributions: Array<
    IAutoMovieLibraryContribution & { contexts: IAutoMovieEnvironmentContext[] }
  > = [
    { environments: [rectangularBuilding()], models: [], contexts: [] },
    {
      environments: [],
      models: [
        drawingBoxModel({
          id: "ship",
          shape: { type: "box", width: 1, height: 1, depth: 1 },
          material: "wood",
        }),
      ],
      contexts: [],
    },
    { environments: [], models: [], contexts: [analysisContext()] },
  ];
  for (const contribution of contributions) {
    const before: string = JSON.stringify(contribution);
    const input: ReturnType<typeof createLibraryContributionAdmissionInput> = createLibraryContributionAdmissionInput(contribution);
    TestValidator.equals(
      "each semantic carrier refuses settings output",
      admitAutoMovieLibrarySettingsContribution(input),
      false,
    );
    TestValidator.equals(
      "refusal preserves source attribution",
      input.diagnostics.map(({ code, category, target, path }: IAutoMovieDiagnostic): Pick<IAutoMovieDiagnostic, "code" | "category" | "target" | "path"> => ({
        code,
        category,
        target,
        path,
      })),
      [
        {
          code: "source-export-invalid",
          category: "error",
          target: input.target,
          path: input.source,
        },
      ],
    );
    TestValidator.predicate(
      "refusal names the selected export",
      input.diagnostics[0]!.message.includes(`"${input.registration.export}"`),
    );
    TestValidator.equals(
      "settings refusal never rewrites its payload bytes",
      JSON.stringify(contribution),
      before,
    );
  }
}
