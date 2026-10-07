import type { IAutoMovieLibraryBuildContext } from "@automovie/interface";
import type { IAutoMovieMaterializedLibraryResult } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { createLibraryEvaluationInput } from "../internal/createLibraryEvaluationInput";
import { drawingBoxModel } from "../internal/drawingFixtures";
import { loadSourceModule } from "../internal/loadSourceModule";

const { evaluateAutoMovieLibraryOwners } = loadSourceModule<{
  evaluateAutoMovieLibraryOwners(
    props: ReturnType<typeof createLibraryEvaluationInput>,
  ): {
    results: IAutoMovieMaterializedLibraryResult[];
    registeredBy: ReadonlyMap<string, string>;
    diagnostics: { code: string; path: string | null; message: string }[];
  };
}>(
  path.resolve(
    __dirname,
    "../../../../packages/production/src/production/evaluateAutoMovieLibraryOwners.ts",
  ),
);

/**
 * Refused library sources and payloads stay attributed without stale takeover.
 *
 * Scenarios:
 * 1. An unreadable selected module is not evaluated, while later sources run.
 * 2. Settings with model payload are refused but retain their registration,
 *    so a second export cannot replace the failed attempt.
 * 3. A refused object model and evaluator findings reach the attempt's result
 *    without admitting an invalid materialized owner.
 */
export const test_production_library_evaluation_refusal = (): void => {
  const settings = "docs/settings/delivery.md#delivery";
  const owner = "docs/models/ship.md#ship";
  const contexts = new Map<string, IAutoMovieLibraryBuildContext>([
    [
      settings,
      {
        production: "harbor",
        branch: "productionSources",
        design: "docs/settings/delivery.md",
        anchor: "delivery",
        derivedArtifacts: {},
      },
    ],
    [
      owner,
      {
        production: "harbor",
        branch: "models",
        design: "docs/models/ship.md",
        anchor: "ship",
        derivedArtifacts: {},
      },
    ],
  ]);
  const model = drawingBoxModel({
    id: "ship",
    shape: { type: "box", width: 1, height: 1, depth: 1 },
    material: "wood",
  });
  const executed: string[] = [];
  const finding = {
    code: "source-export-missing" as const,
    category: "error" as const,
    phase: "source" as const,
    target: owner,
    path: "src/invalid.ts",
    message: "An export is missing.",
  };
  const input = createLibraryEvaluationInput({
    sources: [
      "src/missing.ts",
      "src/delivery.ts",
      "src/replacement.ts",
      "src/invalid.ts",
    ],
    contexts,
    bindings: [],
    readSource: (source) => {
      if (source === "src/missing.ts")
        throw new Error("Selected source is unavailable.");
      return Buffer.from("export {};\n");
    },
    evaluate: (request) => {
      executed.push(request.path);
      const invalid = request.path === "src/invalid.ts";
      return {
        diagnostics: invalid ? [finding] : [],
        registrations: [
          {
            design: invalid ? owner : settings,
            export: "entry",
            contribution: {
              models: [invalid ? { ...model, id: "" } : model],
              environments: [],
              contexts: [],
            },
          },
        ],
      };
    },
  });
  TestValidator.equals(
    "the invalid carrier actually fails domain validation",
    input.validators.model({ model: { ...model, id: "" } }).success,
    false,
  );
  const result = evaluateAutoMovieLibraryOwners(input);
  TestValidator.equals(
    "unreadable module cannot execute",
    executed,
    input.sources.slice(1),
  );
  TestValidator.equals(
    "refused contributions never become results",
    result.results,
    [],
  );
  TestValidator.equals(
    "refused first registration remains authoritative",
    result.registeredBy.get(settings),
    "src/delivery.ts#entry",
  );
  TestValidator.equals(
    "all diagnostic sources retain their failure order",
    result.diagnostics.map(({ code, path: source }) => ({ code, source })),
    [
      { code: "source-path-missing", source: "src/missing.ts" },
      { code: "source-export-invalid", source: "src/delivery.ts" },
      { code: "source-registration-mismatch", source: "src/replacement.ts" },
      { code: "source-export-missing", source: "src/invalid.ts" },
      { code: "source-scene-content-invalid", source: "src/invalid.ts" },
    ],
  );
  TestValidator.predicate(
    "original reader cause remains in the attributed diagnostic",
    result.diagnostics[0]!.message.includes("Selected source is unavailable."),
  );
  TestValidator.predicate(
    "evaluator finding retains object identity",
    result.diagnostics.includes(finding),
  );
};
