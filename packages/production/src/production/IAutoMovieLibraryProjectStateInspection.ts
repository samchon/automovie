import type { IAutoMovieMaterializedLibrary } from "@automovie/interface";
import type { IAutoMovieLibraryProjectStateProblem } from "./IAutoMovieLibraryProjectStateProblem";

/**
 * Strict result of reopening one builder-owned library publication.
 *
 * @evidence contracts/common.md#principled-implementation A nullable strict index accompanies the complete observed refusal population; the producer returns an index only without problems.
 * @evidence contracts/common.md#clear-and-simple-design Current library state consumes this strict result instead of inferring kind from residue.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type alone allows inconsistent caller-constructed combinations and readonly problems are not runtime-frozen.
 * @evidence contracts/common.md#meaningful-documentation Documents null-index meaning and producer-maintained correlation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased result runs no parsing; inspectAutoMovieLibraryProjectState owns index materialization, graph scans and supplied reads.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares no currentness operation; its producer builds attempt-local maps/sets and performs current callback observations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type retains nothing; callers own the returned index or problems, and the supplied reader closes its own handles.
 * @author Samchon
 */
export interface IAutoMovieLibraryProjectStateInspection {

    /**
     * Parsed index, or null when no strict index could be opened.
     */
    index: IAutoMovieMaterializedLibrary | null;

    /**
     * Every strict currentness refusal found.
     */
    problems: readonly IAutoMovieLibraryProjectStateProblem[];
}
