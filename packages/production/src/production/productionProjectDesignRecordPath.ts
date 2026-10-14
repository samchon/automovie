import { relativeAutoMovieProductionProjectPath as relativeToRoot } from "./relativeAutoMovieProductionProjectPath";
import { IAutoMovieDesignTarget } from "@automovie/interface";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectDesignPath } from "./productionProjectDesignPath";

/**
 * Format one supported design target as a project-relative record path.
 *
 * @evidence contracts/common.md#principled-implementation Delegates target-kind/id routing to designPath then applies the native project-relative path formatter; this formats an address rather than opening a record.
 * @evidence contracts/common.md#clear-and-simple-design Keeps kind routing with designPath and presentation with relativeToRoot, so the facade does not duplicate shared-versus-production design layout.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the same encoded target id and directory policy for every caller; a formatted path is not a physical filesystem ownership proof.
 * @evidence contracts/common.md#meaningful-documentation The returned path is relative to the selected project root and may identify an absent optional record; routing refusal propagates for unsupported targets.
 * @evidence contracts/performance.md#efficient-algorithms String encoding and native path operations cost time/space proportional to root and target-id lengths, with no directory enumeration or record parse.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One deterministic address formatting call has no acquisition or effect to share across requests; consumers retain a path if their own attempt needs it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Transfers one path string to the caller and opens no descriptor, lock or task; project state lifetime remains with the facade.
 */
export function productionProjectDesignRecordPath(state: AutoMovieProductionProjectState, target: IAutoMovieDesignTarget): string {
    return relativeToRoot(state.root, productionProjectDesignPath(state, target));
}
