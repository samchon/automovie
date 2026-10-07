import type { IAutoMovieProductionEvidence } from "@automovie/evidence";
import type { IAutoMovieDiagnostic } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { createLibraryOwnerPopulation } from "../internal/createLibraryOwnerPopulation";
import { loadSourceModule } from "../internal/loadSourceModule";

const { inspectAutoMovieLibraryMissingRegistrations } = loadSourceModule<{
  inspectAutoMovieLibraryMissingRegistrations(props: {
    owners: IAutoMovieProductionEvidence["designOwners"];
    execution: ReturnType<typeof createLibraryOwnerPopulation>["execution"];
    registeredBy: ReadonlyMap<string, string>;
    requireReviewed: boolean;
  }): IAutoMovieDiagnostic[];
}>(
  path.resolve(
    __dirname,
    "../../../../packages/production/src/production/inspectAutoMovieLibraryMissingRegistrations.ts",
  ),
);

/**
 * Missing realization is charged only to owners whose source work has started.
 *
 * Scenarios:
 * 1. Unregistered settings and started design units warn at source scope in
 *    canonical order, while null and empty bindings owe no realization.
 * 2. The same population blocks completion with exact owner attribution.
 * 3. Existing registrations discharge their own addresses only; empty and
 *    fully registered populations emit nothing without mutating the graph.
 */
export const test_production_library_missing_registrations = (): void => {
  const population = createLibraryOwnerPopulation();
  const before = JSON.stringify(population);
  const registeredBy = new Map([
    ["docs/spaces/z.md#z", "src/spaces/hall.ts#hall"],
  ]);
  for (const requireReviewed of [false, true]) {
    const diagnostics = inspectAutoMovieLibraryMissingRegistrations({
      ...population,
      registeredBy,
      requireReviewed,
    });
    TestValidator.equals(
      "missing owners retain canonical attribution",
      diagnostics.map((item) => ({
        code: item.code,
        category: item.category,
        phase: item.phase,
        target: item.target,
        path: item.path,
      })),
      [
        {
          code: "source-export-missing",
          category: requireReviewed ? "error" : "warning",
          phase: "source",
          target:
            "library:productionSources:docs/settings/delivery.md#delivery",
          path: "src/production.ts",
        },
        {
          code: "source-export-missing",
          category: requireReviewed ? "error" : "warning",
          phase: "source",
          target: "library:spaces:docs/spaces/a.md#a",
          path: "docs/spaces/a.md",
        },
        {
          code: "source-export-missing",
          category: requireReviewed ? "error" : "warning",
          phase: "source",
          target: "library:spaces:docs/spaces/z.md#a",
          path: "docs/spaces/z.md",
        },
      ],
    );
    TestValidator.predicate(
      "settings correction names the exact export and owner",
      diagnostics[0]!.message.includes("src/production.ts#delivery") &&
        diagnostics[0]!.message.includes("docs/settings/delivery.md#delivery"),
    );
    TestValidator.predicate(
      "design correction names its selected source population",
      diagnostics[1]!.message.includes("spaceSources") &&
        diagnostics[1]!.message.includes("docs/spaces/a.md#a"),
    );
  }
  for (const address of [
    "docs/settings/delivery.md#delivery",
    "docs/spaces/a.md#a",
    "docs/spaces/z.md#a",
  ])
    registeredBy.set(address, "registered-export");
  TestValidator.equals(
    "fully registered selected owners owe no missing diagnostic",
    inspectAutoMovieLibraryMissingRegistrations({
      ...population,
      registeredBy,
      requireReviewed: true,
    }),
    [],
  );
  TestValidator.equals(
    "empty selection owes no diagnostic",
    inspectAutoMovieLibraryMissingRegistrations({
      owners: [],
      execution: { entries: [], sources: [], problems: [] },
      registeredBy: new Map(),
      requireReviewed: false,
    }),
    [],
  );
  TestValidator.equals(
    "diagnostic sorting never mutates the acquired graph",
    JSON.stringify(population),
    before,
  );
};
