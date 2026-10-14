import {
  type IAutoMovieProductionEvidence,
  type IAutoMovieProductionEvidenceSourceOwnerBinding,
  createBlankAutoMovieProductionEvidence,
} from "@automovie/evidence";
import path from "node:path";

/**
 * Construct in-memory evidence for one zero-payload library delivery owner.
 *
 * Completion scenarios supply their exact source edges; the shared declaration selects the settings serialization branch. No filesystem or generated project is arranged. Consumers test execution admission and reopening of library publications made from these typed inputs.
 *
 * @evidence contracts/common.md#principled-implementation Creates a library evidence observation for the supplied delivery source owners using the evidence-stage settings and production-source branches; all fields are resident fixture inputs, not physical discovery.
 * @evidence contracts/common.md#clear-and-simple-design Owns only construction of the zero-payload delivery observation shared by execution and publication cases; backward import paths re-export this implementation without changing the input shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty design and contract inventories describe this delivery-only fixture, rather than granting source completion or special-casing any production consumer.
 * @evidence contracts/common.md#meaningful-documentation Documents that consumers inspect typed observations and supply their exact source edges; no filesystem authenticity or authored contract coverage is claimed.
 * @evidence contracts/performance.md#efficient-algorithms Builds a fixed-size blank graph, configuration and manifest without traversing sourceOwners; the owner array is retained by reference, so construction work and new storage remain fixed for this fixture.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call produces fresh records and fixed arrays while retaining the caller sourceOwners array; there is no memoization or cross-case mutation isolation of that caller array.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned evidence owns its fresh fixture records while the caller owns the retained sourceOwners reference; lifetime follows ordinary reachability and no descriptor or process is acquired.
 */
export function createLibraryCompletionEvidence(
  sourceOwners: readonly IAutoMovieProductionEvidenceSourceOwnerBinding[],
): IAutoMovieProductionEvidence {
  const root: string = path.resolve("/library-completion");
  const configuration: IAutoMovieProductionEvidence["configuration"] = {
    ...createBlankAutoMovieProductionEvidence(root, "english"),
    kind: "library" as const,
    settings: "evidence" as const,
    productionSources: "evidence" as const,
  };
  return {
    root,
    packageName: "library-completion",
    description: "",
    configuration,
    // The tested consumers read this typed projection, not the filesystem
    // factory. The delivery branch has no reusable design-owner population.
    manifest: {
      kind: "library",
      language: "english",
      populationScope: { mode: "complete-production" },
      branches: [
        { name: "settings", stage: "evidence" },
        { name: "productionSources", stage: "evidence" },
      ],
      bindings: [],
      localBindings: [],
      localAudits: [],
      topology: {
        branches: [],
        expected: [],
        declarations: [],
        diagnostics: [],
      },
    },
    designBranches: [],
    designOwners: [],
    sourceOwners,
    contracts: [],
    contractRules: [],
  };
}
