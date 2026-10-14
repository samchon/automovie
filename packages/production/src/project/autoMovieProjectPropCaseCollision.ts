import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 *
 * @evidence contracts/common.md#principled-implementation A fenced scan finds equal folded encoded filenames with different exact spelling and decodes the sibling.
 * @evidence contracts/common.md#clear-and-simple-design Uses the common keyed-directory collision owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact identity is an upsert; a query is no future write lease.
 * @evidence contracts/common.md#meaningful-documentation States nullable sibling and malformed escape refusal.
 * @evidence contracts/performance.md#efficient-algorithms Scans up to F filenames with encoding/folding/decoding text cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Fresh names replace prior no-collision verdicts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Namespace retirement is attempted; failed cleanup can retain fences, while the query returns only a nullable key.
 */
export function autoMovieProjectPropCaseCollision(_project: IAutoMovieProjectState, node: string): string | null {
    return _project.withRootNamespace((): string | null => _project.sliceCaseCollision("props", node));
}
