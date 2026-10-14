import type { IAutoMovieProductionEvidenceDesignOwner } from "@automovie/evidence";

/**
 * In-memory library owner population with started and unstarted source branches.
 *
 * Registration-policy scenarios share these typed graph observations. Paths are owner addresses, never filesystem fixtures; input order deliberately differs from the canonical diagnostic order.
 *
 * @evidence contracts/common.md#principled-implementation Constructs the existing resident design-owner graph and execution entries with one started source branch, one unstarted branch and one selected branch with an empty path population.
 * @evidence contracts/common.md#clear-and-simple-design Keeps registration-policy fixture construction together so consumers can vary graph-selected observations without arranging a filesystem or production host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These fixed owner addresses and source digest strings are test observations, not a production routing special case or a source-authenticity oracle.
 * @evidence contracts/common.md#meaningful-documentation Explains that input order deliberately differs from canonical diagnostics and that paths represent owner addresses rather than actual filesystem fixtures.
 * @evidence contracts/performance.md#efficient-algorithms Allocates a fixed number of owners, units and execution entries, so construction time and added storage are constant for the declared fixture shape.
 * @evidence contracts/performance.md#reuse-equivalent-work Each invocation returns fresh owners and entries, while owners within one invocation intentionally share the source binding object; nothing is memoized across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned fixture retains its own object graph for the consuming case and uses no handle, process or unbounded shared cache.
 */
export function createLibraryOwnerPopulation(): {
  owners: IAutoMovieProductionEvidenceDesignOwner[];
  execution: {
    entries: {
      branch: string;
      sourcePath: string;
      exportName: string;
      owner: string;
      sourceDigest: string;
    }[];
    sources: { path: string; digest: null }[];
    problems: string[];
  };
} {
  const binding: { branch: string; stage: string; enforced: boolean; root: string; files: string[]; symbols: string[]; paths: string[]; } = {
    branch: "spaceSources",
    stage: "evidence",
    enforced: true,
    root: ".",
    files: ["src/spaces/**/*.ts"],
    symbols: ["property"],
    paths: ["src/spaces/hall.ts"],
  };
  const unit: (anchor: string) => { anchor: string; title: string; digest: string; } = (anchor: string): { anchor: string; title: string; digest: string; } => ({
    anchor,
    title: anchor,
    digest: "sha256:owner",
  });
  return {
    owners: [
      {
        branch: "spaces",
        path: "docs/spaces/z.md",
        title: "Z",
        units: [unit("z"), unit("a")],
        sourceBinding: binding,
      },
      {
        branch: "spaces",
        path: "docs/spaces/a.md",
        title: "A",
        units: [unit("a")],
        sourceBinding: binding,
      },
      {
        branch: "models",
        path: "docs/models/unstarted.md",
        title: "Unstarted",
        units: [unit("object")],
        sourceBinding: null,
      },
      {
        branch: "spaces",
        path: "docs/spaces/empty.md",
        title: "Empty",
        units: [unit("empty")],
        sourceBinding: { ...binding, paths: [] },
      },
    ],
    execution: {
      entries: [
        {
          branch: "productionSources",
          sourcePath: "src/production.ts",
          exportName: "delivery",
          owner: "docs/settings/delivery.md#delivery",
          sourceDigest: "sha256:delivery",
        },
        {
          branch: "spaceSources",
          sourcePath: "src/spaces/hall.ts",
          exportName: "hall",
          owner: "docs/spaces/z.md#z",
          sourceDigest: "sha256:hall",
        },
      ],
      sources: [],
      problems: [],
    },
  };
}
