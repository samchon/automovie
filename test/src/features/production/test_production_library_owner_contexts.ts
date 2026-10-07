import type { IAutoMovieProductionEvidence } from "@automovie/evidence";
import type { IAutoMovieLibraryBuildContext } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { createLibraryOwnerPopulation } from "../internal/createLibraryOwnerPopulation";
import { loadSourceModule } from "../internal/loadSourceModule";

const { createAutoMovieLibraryOwnerContexts } = loadSourceModule<{
  createAutoMovieLibraryOwnerContexts(props: {
    production: string;
    owners: IAutoMovieProductionEvidence["designOwners"];
    execution: ReturnType<typeof createLibraryOwnerPopulation>["execution"];
    derivedArtifacts: IAutoMovieLibraryBuildContext["derivedArtifacts"];
  }): {
    contexts: ReadonlyMap<string, IAutoMovieLibraryBuildContext>;
    sourceBranches: ReadonlyMap<string, string>;
  };
}>(
  path.resolve(
    __dirname,
    "../../../../packages/production/src/production/createAutoMovieLibraryOwnerContexts.ts",
  ),
);

/**
 * Source evaluation resolves only the attempt's exact acquired owner addresses.
 *
 * Scenarios:
 * 1. Design contexts retain namespace, branch, anchor and derivation identity;
 *    null bindings have no source branch and settings carry their own address.
 * 2. Non-settings exports cannot manufacture additional design contexts.
 * 3. An empty acquired population creates no contexts or source branches.
 */
export const test_production_library_owner_contexts = (): void => {
  const population = createLibraryOwnerPopulation();
  const before = JSON.stringify(population);
  const derivedArtifacts = {};
  const value = createAutoMovieLibraryOwnerContexts({
    ...population,
    production: "harbor",
    derivedArtifacts,
  });
  TestValidator.equals(
    "exact selected addresses retain population order",
    [...value.contexts.keys()],
    [
      "docs/spaces/z.md#z",
      "docs/spaces/z.md#a",
      "docs/spaces/a.md#a",
      "docs/models/unstarted.md#object",
      "docs/spaces/empty.md#empty",
      "docs/settings/delivery.md#delivery",
    ],
  );
  for (const [address, context] of value.contexts) {
    TestValidator.equals(
      "every context uses the resident namespace",
      context.production,
      "harbor",
    );
    TestValidator.equals(
      "context reconstructs its exact owner address",
      `${context.design}#${context.anchor}`,
      address,
    );
    TestValidator.predicate(
      "verified derived closure is shared by identity",
      context.derivedArtifacts === derivedArtifacts,
    );
  }
  TestValidator.equals(
    "design binding selects the source branch",
    value.sourceBranches.get("docs/spaces/z.md#z"),
    "spaceSources",
  );
  TestValidator.equals(
    "unstarted design has no source branch",
    value.sourceBranches.get("docs/models/unstarted.md#object"),
    "",
  );
  TestValidator.equals(
    "settings context has its graph branch",
    value.contexts.get("docs/settings/delivery.md#delivery")!.branch,
    "productionSources",
  );
  TestValidator.equals(
    "settings binding uses the delivery source branch",
    value.sourceBranches.get("docs/settings/delivery.md#delivery"),
    "productionSources",
  );
  TestValidator.equals(
    "the acquired population is not mutated",
    JSON.stringify(population),
    before,
  );
  const unrelated = createAutoMovieLibraryOwnerContexts({
    owners: [],
    execution: {
      ...population.execution,
      entries: population.execution.entries.slice(1),
    },
    production: "harbor",
    derivedArtifacts,
  });
  TestValidator.equals(
    "non-settings export does not invent an owner",
    unrelated.contexts.size,
    0,
  );
  const empty = createAutoMovieLibraryOwnerContexts({
    owners: [],
    execution: { entries: [], sources: [], problems: [] },
    production: "harbor",
    derivedArtifacts,
  });
  TestValidator.equals(
    "empty contexts and bindings",
    [empty.contexts.size, empty.sourceBranches.size],
    [0, 0],
  );
};
