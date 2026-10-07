import type { IAutoMovieProductionEvidenceDesignOwner } from "@automovie/evidence";

/**
 * In-memory library owner population with started and unstarted source branches.
 *
 * Registration-policy scenarios share these typed graph observations. Paths are
 * owner addresses, never filesystem fixtures; input order deliberately differs
 * from the canonical diagnostic order.
 */
export const createLibraryOwnerPopulation = (): {
  owners: IAutoMovieProductionEvidenceDesignOwner[];
  execution: {
    entries: {
      branch: string;
      sourcePath: string;
      exportName: string;
      owner: string;
      sourceDigest: string;
      reviewed: boolean;
    }[];
    sources: { path: string; digest: null }[];
    problems: string[];
  };
} => {
  const binding = {
    branch: "spaceSources",
    stage: "evidence",
    enforced: true,
    root: ".",
    files: ["src/spaces/**/*.ts"],
    symbols: ["property"],
    paths: ["src/spaces/hall.ts"],
  };
  const unit = (anchor: string) => ({
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
          reviewed: false,
        },
        {
          branch: "spaceSources",
          sourcePath: "src/spaces/hall.ts",
          exportName: "hall",
          owner: "docs/spaces/z.md#z",
          sourceDigest: "sha256:hall",
          reviewed: false,
        },
      ],
      sources: [],
      problems: [],
    },
  };
};
