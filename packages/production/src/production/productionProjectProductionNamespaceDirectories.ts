import { resolveAutoMovieProductionProjectPath as resolveInside } from "./resolveAutoMovieProductionProjectPath";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";

/**
 * List the shared design, selected design/state and selected generated/render directory roots in guard order.
 *
 * @evidence contracts/common.md#principled-implementation Three constructor-owned paths and two lexically fenced manifest output roots plus the production segment form the five namespace directories captured and rechecked by the existing project lifecycle.
 * @evidence contracts/common.md#clear-and-simple-design This projection owns the complete namespace-root list while physical ancestry acquisition and verification remain with constructor and incarnation guards.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No branch is selected by fixture or traversal order; generated and render roots use the current manifest and the same portable production segment, without inventing another namespace.
 * @evidence contracts/common.md#meaningful-documentation States all five roots and their order; returned paths establish neither directory existence nor physical admission by themselves.
 * @evidence contracts/performance.md#efficient-algorithms A fixed five-element array and two nested path resolutions use work proportional to the involved path text, without scanning filesystem contents.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each lifecycle call projects current state paths; retaining a separate root-list cache would not replace the required physical observations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned five-string array; this operation borrows state and opens no descriptor or long-running task.
 */
export function productionProjectProductionNamespaceDirectories(state: AutoMovieProductionProjectState): string[] {
    return [
        state.sharedDesignRoot,
        state.productionDesignRoot,
        state.productionStateRoot,
        resolveInside(resolveInside(state.root, state.manifest_.generatedRoot), state.productionSegment),
        resolveInside(resolveInside(state.root, state.manifest_.renderRoot), state.productionSegment),
    ];
}
