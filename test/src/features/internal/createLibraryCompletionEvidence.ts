import {
  type IAutoMovieProductionEvidence,
  type IAutoMovieProductionEvidenceSourceOwnerBinding,
  createBlankAutoMovieProductionEvidence,
} from "@automovie/evidence";
import path from "node:path";

/**
 * Construct in-memory evidence for one zero-payload library delivery owner.
 *
 * Completion scenarios supply their exact source edges; the shared declaration
 * selects the settings serialization branch. No filesystem or generated
 * project is arranged. Consumers test execution admission and reopening of
 * library publications made from these typed inputs.
 */
export const createLibraryCompletionEvidence = (
  sourceOwners: readonly IAutoMovieProductionEvidenceSourceOwnerBinding[],
): IAutoMovieProductionEvidence => {
  const root = path.resolve("/library-completion");
  const configuration = {
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
    reviewAlarms: { alarms: [], questionPasteChecked: false },
  };
};

/** One delivery export whose bytes and exact settings target are explicit. */
export const libraryCompletionBinding = (
  overrides: Partial<IAutoMovieProductionEvidenceSourceOwnerBinding> = {},
): IAutoMovieProductionEvidenceSourceOwnerBinding => ({
  branch: "productionSources",
  stage: "evidence",
  enforced: true,
  relationship: "lineage",
  sourcePath: "src/production.ts",
  exportName: "delivery",
  symbolKind: "property",
  sourceDigest: `sha256:${"1".repeat(64)}`,
  targetPath: "docs/settings/delivery.md",
  targetAnchor: "delivery",
  reviewed: false,
  ...overrides,
});
