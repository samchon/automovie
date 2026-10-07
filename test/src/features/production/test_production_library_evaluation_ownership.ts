import type { IAutoMovieLibraryBuildContext } from "@automovie/interface";
import type { IAutoMovieMaterializedLibraryResult } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";
import path from "node:path";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import { createLibraryEvaluationInput } from "../internal/createLibraryEvaluationInput";
import { drawingBoxModel } from "../internal/drawingFixtures";
import { loadSourceModule } from "../internal/loadSourceModule";

const { evaluateAutoMovieLibraryOwners } = loadSourceModule<{
  evaluateAutoMovieLibraryOwners(
    props: ReturnType<typeof createLibraryEvaluationInput>,
  ): {
    results: IAutoMovieMaterializedLibraryResult[];
    registeredBy: ReadonlyMap<string, string>;
    diagnostics: { code: string; path: string | null }[];
  };
}>(
  path.resolve(
    __dirname,
    "../../../../packages/production/src/production/evaluateAutoMovieLibraryOwners.ts",
  ),
);

/**
 * A library evaluation retains exact source lineage and first-owner semantics.
 *
 * Scenarios:
 * 1. Normalized source bytes authenticate an object export and a settings
 *    delivery; context lookup refuses an unrelated address.
 * 2. A later duplicate registration reports its own source and cannot replace
 *    the first contribution or its registered export.
 * 3. An empty source population never calls the reader or evaluator.
 */
export const test_production_library_evaluation_ownership = (): void => {
  const owner = "docs/models/ship.md#ship";
  const settings = "docs/settings/delivery.md#delivery";
  const model = drawingBoxModel({
    id: "ship",
    shape: { type: "box", width: 1, height: 1, depth: 1 },
    material: "wood",
  });
  const contribution = { models: [model], environments: [], contexts: [] };
  const contexts = new Map<string, IAutoMovieLibraryBuildContext>([
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
  const sourceDigest =
    `sha256:${createHash("sha256").update("export const ship = {};\n").digest("hex")}` as const;
  const reads: string[] = [];
  const evaluations: string[] = [];
  const input = createLibraryEvaluationInput({
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
    readSource: (source) => {
      reads.push(source);
      return Buffer.from("export const ship = {};\r\n");
    },
    evaluate: (request) => {
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
  const result = evaluateAutoMovieLibraryOwners(input);
  TestValidator.equals(
    "each selected source is read and evaluated once in order",
    [reads, evaluations],
    [input.sources, input.sources],
  );
  TestValidator.equals(
    "only first owner and settings delivery become results",
    result.results.map((item) => ({
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
    result.diagnostics.map(({ code, path: source }) => ({ code, source })),
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
  const empty = evaluateAutoMovieLibraryOwners({ ...input, sources: [] });
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
};
