import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 * Under the current root namespace, return the first differently spelled actor key with the same lowercase encoded filename, or null. The common scan is unsorted and may throw on malformed escapes; the result is no future write lease.
 *
 * @evidence contracts/common.md#principled-implementation The actors query shares fenced folded-filename comparison with props.
 * @evidence contracts/common.md#clear-and-simple-design Only the selected directory differs from the common owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact names remain ordinary matches; success is no later write lease.
 * @evidence contracts/common.md#meaningful-documentation States nullable sibling node and decoding failure.
 * @evidence contracts/performance.md#efficient-algorithms Includes namespace acquisition and up to F filename/text comparisons.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call scans current actor names.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Namespace retirement is attempted; failed cleanup can retain fences, while a key/null transfers.
 */
export function autoMovieProjectActorCaseCollision(_project: IAutoMovieProjectState, node: string): string | null {
    return _project.withRootNamespace((): string | null => _project.sliceCaseCollision("actors", node));
}
