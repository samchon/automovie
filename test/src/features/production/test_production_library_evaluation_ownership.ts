import type { IAutoMovieLibraryBuildContext } from "@automovie/interface";
import type { buildLibrarySource } from "@automovie/production";
import { evaluateAutoMovieLibraryOwners } from "../../../../packages/production/src/production/evaluateAutoMovieLibraryOwners";
import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import { createLibraryEvaluationInput } from "../internal/createLibraryEvaluationInput";
import { drawingBoxModel } from "../internal/drawingFixtures";

/**
 * A library evaluation retains exact source lineage and first-owner semantics.
 *
 * Scenarios:
 * 1. Normalized source bytes authenticate an object export and a settings
 *    delivery; context lookup refuses an unrelated address.
 * 2. A later duplicate registration reports its own source and cannot replace
 *    the first contribution or its registered export.
 * 3. An empty source population never calls the reader or evaluator.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates selected library owners through typed injected read/evaluate seams, checks normalized source/context admission, exact read/evaluation order, retained contribution identity and first registration, duplicate-source attribution and an empty no-effect selection.
 * @evidence contracts/testing.md#independent-expectations Node SHA-256 of literal LF source independently authenticates the CRLF reader's normalized text. Authored owner/source/export addresses, duplicate diagnostic codes and zero counts distinguish first-owner routing; the injected evaluator establishes coordinator behavior rather than executing actual authored Node modules.
 * @evidence contracts/testing.md#distinguishing-cases Retains model/settings owners, missing context, normalized source bytes, duplicate payload and zero-payload settings registrations, source attribution/order and empty population. Reader refusal, invalid domain contributions and reservation after invalid data belong to evaluation_refusal.
 * @evidence contracts/testing.md#execution-ownership The named test_production_library_evaluation_ownership owns all portable synchronous cases and the assertions reached through its injected evaluator. It replaces no globals, writes no generated artifacts and starts no real source-module host or consumer.
 */
export function test_production_library_evaluation_ownership(): void {
  const owner: string = "docs/models/ship.md#ship";
  const settings: string = "docs/settings/delivery.md#delivery";
  const model: ReturnType<typeof drawingBoxModel> = drawingBoxModel({
    id: "ship",
    shape: { type: "box", width: 1, height: 1, depth: 1 },
    material: "wood",
  });
  const contribution: ReturnType<typeof buildLibrarySource>["registrations"][number]["contribution"] = { models: [model], environments: [], contexts: [] };
  const contexts: Map<string, IAutoMovieLibraryBuildContext> = new Map<string, IAutoMovieLibraryBuildContext>([
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
  ]);
  const sourceDigest: string =
    `sha256:${createHash("sha256").update("export const ship = {};\n").digest("hex")}` as const;
  const reads: string[] = [];
  const evaluations: string[] = [];
  const input: ReturnType<typeof createLibraryEvaluationInput> = createLibraryEvaluationInput({
    sources: [
      "src/ship.ts",
      "src/delivery.ts",
      "src/duplicate.ts",
      "src/duplicate-settings.ts",
    ],
    contexts,
    bindings: [
      libraryCompletionBinding({
        branch: "modelSources",
        sourcePath: "src/ship.ts",
        exportName: "ship",
        targetPath: "docs/models/ship.md",
        targetAnchor: "ship",
        sourceDigest,
      }),
    ],
    readSource: (source: string): Uint8Array => {
      reads.push(source);
      return Buffer.from("export const ship = {};\r\n");
    },
    evaluate: (request: Parameters<typeof buildLibrarySource>[0]): ReturnType<typeof buildLibrarySource> => {
      evaluations.push(request.path);
      TestValidator.equals(
        "evaluator receives normalized source",
        request.source,
        "export const ship = {};\n",
      );
      TestValidator.equals(
        "evaluator uses the selected host root",
        request.sourceRoot,
        "library-runtime",
      );
      TestValidator.predicate(
        "owner context retains the exact acquired identity",
        request.context(owner) === contexts.get(owner),
      );
      TestValidator.equals(
        "unselected address has no context",
        request.context("docs/models/absent.md#absent"),
        null,
      );
      if (request.path === "src/ship.ts")
        TestValidator.equals(
          "admission authenticates exact acquired bytes",
          request.admit("ship", owner).success,
          true,
        );
      return {
        diagnostics: [],
        registrations:
          request.path === "src/delivery.ts" ||
          request.path === "src/duplicate-settings.ts"
            ? [
                {
                  export: "delivery",
                  design: settings,
                  contribution: { models: [], environments: [], contexts: [] },
                },
              ]
            : [
                {
                  export:
                    request.path === "src/ship.ts" ? "ship" : "replacement",
                  design: owner,
                  contribution,
                },
              ],
      };
    },
  });
  const result: ReturnType<typeof evaluateAutoMovieLibraryOwners> = evaluateAutoMovieLibraryOwners(input);
  TestValidator.equals(
    "each selected source is read and evaluated once in order",
    [reads, evaluations],
    [input.sources, input.sources],
  );
  TestValidator.equals(
    "only first owner and settings delivery become results",
    result.results.map((item: typeof result.results[number]): { owner: string; source: string; digest: string } => ({
      owner: item.owner,
      source: item.source,
      digest: item.sourceDigest,
    })),
    [
      { owner, source: "src/ship.ts", digest: sourceDigest },
      { owner: settings, source: "src/delivery.ts", digest: sourceDigest },
    ],
  );
  TestValidator.predicate(
    "accepted contribution is retained without replacement",
    result.results[0]!.contribution === contribution,
  );
  TestValidator.equals(
    "duplicate retains first registered export",
    result.registeredBy.get(owner),
    "src/ship.ts#ship",
  );
  TestValidator.equals(
    "zero-payload duplicate retains first settings export",
    result.registeredBy.get(settings),
    "src/delivery.ts#delivery",
  );
  TestValidator.equals(
    "duplicates are charged to their actual sources",
    result.diagnostics.map(({ code, path: source }: typeof result.diagnostics[number]): { code: typeof code; source: string | null } => ({ code, source })),
    [
      { code: "source-registration-mismatch", source: "src/duplicate.ts" },
      {
        code: "source-registration-mismatch",
        source: "src/duplicate-settings.ts",
      },
    ],
  );
  reads.length = 0;
  evaluations.length = 0;
  const empty: ReturnType<typeof evaluateAutoMovieLibraryOwners> = evaluateAutoMovieLibraryOwners({ ...input, sources: [] });
  TestValidator.equals(
    "empty selection has no effects",
    [
      empty.results.length,
      empty.diagnostics.length,
      empty.registeredBy.size,
      reads.length,
      evaluations.length,
    ],
    [0, 0, 0, 0, 0],
  );
}
