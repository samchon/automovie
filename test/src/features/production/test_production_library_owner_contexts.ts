import type { IAutoMovieLibraryBuildContext } from "@automovie/interface";
import { createAutoMovieLibraryOwnerContexts } from "../../../../packages/production/src/production/createAutoMovieLibraryOwnerContexts";
import { TestValidator } from "@nestia/e2e";

import { createLibraryOwnerPopulation } from "../internal/createLibraryOwnerPopulation";

/**
 * Source evaluation resolves only the attempt's exact acquired owner addresses.
 *
 * Scenarios:
 * 1. Design contexts retain namespace, branch, anchor and derivation identity;
 *    null bindings have no source branch and settings carry their own address.
 * 2. Non-settings exports cannot manufacture additional design contexts.
 * 3. An empty acquired population creates no contexts or source branches.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds actual attempt owner contexts from acquired design/execution rows, asserting exact address order, namespace/address reconstruction, shared derivation identity, source-branch choices, unchanged inputs and refusal to invent non-settings owners from execution alone.
 * @evidence contracts/testing.md#independent-expectations The fixture declares six literal owner addresses in order and their model/space/settings branches. Literal harbor namespace, empty branch for an unstarted owner and zero empty/unrelated context counts are independent routing expectations; identity checks test sharing rather than derived-byte admission.
 * @evidence contracts/testing.md#distinguishing-cases Retains multiple anchors in one design, different design paths, unstarted/null source binding, settings-only context, unrelated non-settings execution, empty populations and input immutability. Source-stage enforcement and contribution admission are owned by execution/evaluation tests.
 * @evidence contracts/testing.md#execution-ownership The named test_production_library_owner_contexts owns portable synchronous map construction and every loop assertion over its resident fixture. It executes no source export and creates no project, generated artifact or native host.
 */
export function test_production_library_owner_contexts(): void {
  const population: ReturnType<typeof createLibraryOwnerPopulation> = createLibraryOwnerPopulation();
  const before: string = JSON.stringify(population);
  const derivedArtifacts: IAutoMovieLibraryBuildContext["derivedArtifacts"] = {};
  const value: ReturnType<typeof createAutoMovieLibraryOwnerContexts> = createAutoMovieLibraryOwnerContexts({
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
  const unrelated: ReturnType<typeof createAutoMovieLibraryOwnerContexts> = createAutoMovieLibraryOwnerContexts({
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
  const empty: ReturnType<typeof createAutoMovieLibraryOwnerContexts> = createAutoMovieLibraryOwnerContexts({
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
}
