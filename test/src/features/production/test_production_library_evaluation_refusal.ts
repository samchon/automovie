import type { IAutoMovieDiagnostic, IAutoMovieLibraryBuildContext } from "@automovie/interface";
import type { buildLibrarySource } from "@automovie/production";
import { evaluateAutoMovieLibraryOwners } from "../../../../packages/production/src/production/evaluateAutoMovieLibraryOwners";
import { TestValidator } from "@nestia/e2e";

import { createLibraryEvaluationInput } from "../internal/createLibraryEvaluationInput";
import { drawingBoxModel } from "../internal/drawingFixtures";

/**
 * Refused library sources and payloads stay attributed without stale takeover.
 *
 * Scenarios:
 * 1. An unreadable selected module is not evaluated, while later sources run.
 * 2. Settings with model payload are refused but retain their registration,
 *    so a second export cannot replace the failed attempt.
 * 3. A refused object model and evaluator findings reach the attempt's result
 *    without admitting an invalid materialized owner.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real library owner evaluator with declared reader/evaluator seams and native domain validators, asserting read-failure continuation, refusal reservation, empty admitted results, exact diagnostic order/source attribution and original finding identity.
 * @evidence contracts/testing.md#independent-expectations Authored source order and first-registration ownership require the missing reader, invalid settings payload, duplicate registration, retained evaluator finding and invalid model to remain in their literal expected order. The test independently observes the malformed model failing its domain validator before exercising the owner evaluator.
 * @evidence contracts/testing.md#distinguishing-cases Preserves unreadable first source, refused settings contribution, later replacement and invalid object contribution with an evaluator diagnostic; valid payload ownership and missing registration populations belong to adjacent tests.
 * @evidence contracts/testing.md#execution-ownership The named test_production_library_evaluation_refusal owns one portable evaluation attempt; supplied callbacks return bytes/registrations and native validators inspect data without loading authored modules, writing artifacts or starting a production process.
 */
export function test_production_library_evaluation_refusal(): void {
  const settings: string = "docs/settings/delivery.md#delivery";
  const owner: string = "docs/models/ship.md#ship";
  const contexts: Map<string, IAutoMovieLibraryBuildContext> = new Map<string, IAutoMovieLibraryBuildContext>([
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
  const model: ReturnType<typeof drawingBoxModel> = drawingBoxModel({
    id: "ship",
    shape: { type: "box", width: 1, height: 1, depth: 1 },
    material: "wood",
  });
  const executed: string[] = [];
  const finding: IAutoMovieDiagnostic = {
    code: "source-export-missing" as const,
    category: "error" as const,
    phase: "source" as const,
    target: owner,
    path: "src/invalid.ts",
    message: "An export is missing.",
  };
  const input: ReturnType<typeof createLibraryEvaluationInput> = createLibraryEvaluationInput({
    sources: [
      "src/missing.ts",
      "src/delivery.ts",
      "src/replacement.ts",
      "src/invalid.ts",
    ],
    contexts,
    bindings: [],
    readSource: (source: string): Uint8Array => {
      if (source === "src/missing.ts")
        throw new Error("Selected source is unavailable.");
      return Buffer.from("export {};\n");
    },
    evaluate: (request: Parameters<typeof buildLibrarySource>[0]): ReturnType<typeof buildLibrarySource> => {
      executed.push(request.path);
      const invalid: boolean = request.path === "src/invalid.ts";
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
  const result: ReturnType<typeof evaluateAutoMovieLibraryOwners> = evaluateAutoMovieLibraryOwners(input);
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
    result.diagnostics.map(({ code, path: source }: IAutoMovieDiagnostic): { code: string; source: string | null } => ({ code, source })),
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
}
