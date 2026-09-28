import type {
  IAutoMovieProductionEvidence,
  IAutoMovieProductionEvidenceSourceOwnerBinding,
} from "@automovie/evidence";
import type { AutoMovieContentDigest } from "@automovie/interface";
import path from "node:path";

import { createLibraryCompletionEvidence } from "./createLibraryCompletionEvidence";
import { loadSourceModule } from "./loadSourceModule";

/** The exact resident input fields read by the private execution-plan unit. */
type ICompletionSnapshot = Pick<
  IAutoMovieProductionEvidence,
  | "root"
  | "packageName"
  | "configuration"
  | "manifest"
  | "designBranches"
  | "designOwners"
  | "sourceOwners"
> & {
  version: 1;
  protocol: "automovie.library-authoring-snapshot.v1";
  kind: "library";
  sources: readonly { path: string; digest: AutoMovieContentDigest | null }[];
  digest: AutoMovieContentDigest;
};

export const {
  createAutoMovieLibrarySourceExecutionPlan: planLibraryCompletion,
} = loadSourceModule<{
  createAutoMovieLibrarySourceExecutionPlan: (
    snapshot: ICompletionSnapshot,
    requireCompleted?: boolean,
  ) => {
    entries: readonly (Pick<
      IAutoMovieProductionEvidenceSourceOwnerBinding,
      "branch" | "sourcePath" | "exportName" | "sourceDigest" | "reviewed"
    > & { owner: string })[];
    sources: ICompletionSnapshot["sources"];
    problems: readonly string[];
  };
}>(
  path.resolve(
    __dirname,
    "../../../../packages/production/src/production/libraryAuthoringSnapshot.ts",
  ),
);

/** A typed memory snapshot for an exact library source and owner edge. */
export const createLibraryCompletionSnapshot = (
  binding: IAutoMovieProductionEvidenceSourceOwnerBinding,
): ICompletionSnapshot => {
  const evidence = createLibraryCompletionEvidence([binding]);
  return {
    version: 1 as const,
    protocol: "automovie.library-authoring-snapshot.v1" as const,
    root: evidence.root,
    packageName: evidence.packageName,
    kind: "library" as const,
    configuration: evidence.configuration,
    manifest: evidence.manifest,
    designBranches: evidence.designBranches,
    designOwners: evidence.designOwners,
    sourceOwners: evidence.sourceOwners,
    sources: [{ path: binding.sourcePath, digest: binding.sourceDigest }],
    digest: `sha256:${"2".repeat(64)}` as const,
  };
};
