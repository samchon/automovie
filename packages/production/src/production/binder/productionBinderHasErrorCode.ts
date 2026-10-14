/**
 * Classify an Error object's native code without guessing from message text.
 *
 * @evidence contracts/common.md#principled-implementation Requires an Error object with a code field and compares its string form to the requested native code; arbitrary thrown values are not classified as native filesystem causes.
 * @evidence contracts/common.md#clear-and-simple-design Owns the publisher's EEXIST branch without swallowing other link failures.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An error message alone cannot trigger existing-edition convergence and no unrelated thrown value receives a missing-file interpretation.
 * @evidence contracts/common.md#meaningful-documentation Documents Error/code premise and boolean result rather than proving error origin or transience.
 * @evidence contracts/performance.md#efficient-algorithms Fixed property/type checks plus code string conversion depend only on the code representation, not directory or payload population.
 * @evidence contracts/performance.md#reuse-equivalent-work The existing publication attempt applies this predicate once to its caught failure without retaining a classification cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean escapes and no error, native resource or task is retained.
 */
export function productionBinderHasErrorCode(error: unknown, code: string): boolean {
    return (error instanceof Error && "code" in error && String(error.code) === code);
}
