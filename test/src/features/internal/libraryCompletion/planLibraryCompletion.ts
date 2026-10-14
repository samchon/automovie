import type { IAutoMovieProductionEvidenceSourceOwnerBinding } from "@automovie/evidence";
import path from "node:path";
import { loadSourceModule } from "../loadSourceModule";
import type { ICompletionSnapshot } from "./ICompletionSnapshot";

const {
  createAutoMovieLibrarySourceExecutionPlan: execute,
}: { createAutoMovieLibrarySourceExecutionPlan: (snapshot: ICompletionSnapshot, requireCompleted?: boolean) => { entries: readonly (Pick<IAutoMovieProductionEvidenceSourceOwnerBinding, "branch" | "sourcePath" | "exportName" | "sourceDigest"> & { owner: string; })[]; sources: ICompletionSnapshot["sources"]; problems: readonly string[]; }; } = loadSourceModule<{
  createAutoMovieLibrarySourceExecutionPlan: (
    snapshot: ICompletionSnapshot,
    requireCompleted?: boolean,
  ) => {
    entries: readonly (Pick<
      IAutoMovieProductionEvidenceSourceOwnerBinding,
      "branch" | "sourcePath" | "exportName" | "sourceDigest"
    > & { owner: string })[];
    sources: ICompletionSnapshot["sources"];
    problems: readonly string[];
  };
}>(
  path.resolve(
    __dirname,
    "../../../../../packages/production/src/production/libraryAuthoringSnapshot.ts",
  ),
);

/**
 * Reuse the actual source execution-plan function with the resident completion fixture shape.
 *
 * @evidence contracts/common.md#principled-implementation Aliases the actual loaded library source-execution planner with the resident fixture type and preserves its optional completion argument, return fields and refusal behavior.
 * @evidence contracts/common.md#clear-and-simple-design Separates the existing plan-function reference from snapshot construction and preserves old fixture imports through a barrel without adding a new execution host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The module helper uses the runner require hook and a structural cast; this is the existing test seam and provides no independent implementation or validation of the asserted snapshot shape.
 * @evidence contracts/common.md#meaningful-documentation Names the actual plan dependency and resident shape; execution cases own the behavior and expectations while this declaration adds no wrapper policy.
 * @evidence contracts/performance.md#efficient-algorithms Alias initialization is constant after require-hook module loading; the planner maps S source digests and scans B bindings once, then sorts E accepted entries with repeated identity serialization, taking O(S + B + E log E) record operations plus their string-byte costs and O(S + B) record storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Node require caching may reuse the loaded module in a runner process; the alias adds no result cache and every supplied snapshot is still planned by the original function.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The module owns its planner reference for its normal runner-module lifetime; invocation results belong to the caller and this alias acquires no descriptor or task.
 */
export const planLibraryCompletion: typeof execute = execute;
