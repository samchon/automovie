import {
  type IAutoMovieProductionEvidence,
  type IAutoMovieProductionEvidenceSourceOwnerBinding,
  createBlankAutoMovieProductionEvidence,
} from "@automovie/evidence";

/**
 * Arrange the existing resident library evidence for source-snapshot cases.
 *
 * The supplied root and source bytes select the exact hall owner and its review-stage source edge; sourceOwner retains the caller's digest and target construction. This is test data construction, not an admission or filesystem host.
 *
 * @evidence contracts/common.md#principled-implementation Reassembles the existing library configuration, manifest, selected design owner and exact source binding from the root, hall bytes and original owner callback.
 * @evidence contracts/common.md#clear-and-simple-design Keeps library-only fixture data outside the snapshot test so its discoverable entry stays below the file limit; the test passes the same root, hall text and source-owner constructor.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fixture represents only one hall and typed empty contract inventories, so it does not claim to run authored discovery or authenticate a real library checkout.
 * @evidence contracts/common.md#meaningful-documentation The source-snapshot test owns all behavioral assertions; this helper supplies resident observations without changing acquisition or refusal policy.
 * @evidence contracts/performance.md#efficient-algorithms Creates a fixed-size configuration and manifest plus one owner edge; delegated blank-evidence construction has fixed graph topology and sourceOwner hashes the supplied hall text, making byte work proportional to that text.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call creates independent mutable fixture arrays and objects; it retains no memoization, and the callback remains the same construction dependency used before the split.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Allocated fixture records live with the returned evidence and retain the supplied root and source digest; no file descriptor, process, cache or native resource is acquired here.
 */
export function sourceSnapshotLibraryEvidence(
  root: string,
  hall: string,
  sourceOwner: (props: {
    branch: string;
    text: string;
    sourcePath: string;
    exportName: string;
    targetPath: string;
  }) => IAutoMovieProductionEvidenceSourceOwnerBinding,
): IAutoMovieProductionEvidence {
  const sourceBinding: { branch: string; stage: string; enforced: boolean; root: string; files: string[]; symbols: string[]; paths: string[]; } = {
    branch: "spaceSources",
    stage: "review",
    enforced: true,
    root: ".",
    files: ["src/spaces/**/*.ts"],
    symbols: ["property"],
    paths: ["src/spaces/hall.ts"],
  };
  return {
    root,
    packageName: "harbor",
    description: "",
    configuration: {
      ...createBlankAutoMovieProductionEvidence(root, "english"),
      kind: "library",
      settings: "review",
      spaces: "review",
      spaceSources: "review",
    },
    manifest: {
      kind: "library",
      language: "english",
      populationScope: { mode: "complete-production" },
      branches: [
        { name: "settings", stage: "review" },
        { name: "spaces", stage: "review" },
        { name: "spaceSources", stage: "review" },
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
    designBranches: [
      { branch: "spaces", designStage: "review", sourceBinding },
    ],
    designOwners: [
      {
        branch: "spaces",
        path: "docs/spaces/hall.md",
        title: "Hall",
        units: [{ anchor: "hall", title: "Hall", digest: "a".repeat(64) }],
        sourceBinding,
      },
    ],
    sourceOwners: [
      sourceOwner({
        branch: "spaceSources",
        text: hall,
        sourcePath: "src/spaces/hall.ts",
        exportName: "hall",
        targetPath: "docs/spaces/hall.md",
      }),
    ],
    contracts: [],
    contractRules: [],
  };
}
