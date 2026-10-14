import type { IAutoMovieDiagnostic } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { inspectAutoMovieLibraryMissingRegistrations } from "../../../../packages/production/src/production/inspectAutoMovieLibraryMissingRegistrations";

import { createLibraryOwnerPopulation } from "../internal/createLibraryOwnerPopulation";

/**
 * Missing realization is charged only to owners whose source work has started.
 *
 * Scenarios:
 * 1. Unregistered settings and started design units warn at source scope in
 *    canonical order, while null and empty bindings owe no realization.
 * 2. The same population blocks completion with exact owner attribution.
 * 3. Existing registrations discharge their own addresses only; empty and
 *    fully registered populations emit nothing without mutating the graph.
 *
 * @evidence contracts/testing.md#behavioral-verification Inspects the acquired owner population at source and completed scopes, asserting canonical diagnostic attribution/order/severity, exact correction addresses, registration discharge, empty output and unchanged input graph serialization.
 * @evidence contracts/testing.md#independent-expectations Literal settings/design addresses with started selected sources owe registrations; null/empty source bindings do not. The supplied one registered address and subsequent completed registration map determine which expected missing owners remain, without deriving expected diagnostics from the inspector.
 * @evidence contracts/testing.md#distinguishing-cases Preserves warning/error scope twins, partially/fully/empty registered selections, null/empty bindings and graph immutability. Payload validation and actual owner execution are covered by adjacent admission/evaluation cases.
 * @evidence contracts/testing.md#execution-ownership The named test_production_library_missing_registrations owns these synchronous portable graph inspections over resident maps; it neither executes source exports nor installs a project, writes files or starts a host process.
 */
export function test_production_library_missing_registrations(): void {
  const population: ReturnType<typeof createLibraryOwnerPopulation> = createLibraryOwnerPopulation();
  const before: string = JSON.stringify(population);
  const registeredBy: Map<string, string> = new Map<string, string>([
    ["docs/spaces/z.md#z", "src/spaces/hall.ts#hall"],
  ]);
  for (const requireReviewed of [false, true]) {
    const diagnostics: IAutoMovieDiagnostic[] = inspectAutoMovieLibraryMissingRegistrations({
      ...population,
      registeredBy,
      requireReviewed,
    });
    TestValidator.equals(
      "missing owners retain canonical attribution",
      diagnostics.map((item: IAutoMovieDiagnostic): Pick<IAutoMovieDiagnostic, "code" | "category" | "phase" | "target" | "path"> => ({
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
}
