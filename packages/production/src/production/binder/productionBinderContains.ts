import * as path from "node:path";

/**
 * Test root-inclusive native lexical path containment.
 *
 * @evidence contracts/common.md#principled-implementation Native path.relative identifies equality or a nonabsolute relative descendant without a parent segment; Windows/POSIX path semantics come from the current host.
 * @evidence contracts/common.md#clear-and-simple-design One lexical containment predicate serves both directions of docs/output overlap checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A name starting with two dots is allowed unless it is an exact native parent segment; lexical containment alone is not physical namespace or byte proof.
 * @evidence contracts/common.md#meaningful-documentation States root-inclusive containment and native-separator behavior, distinguishing pathname relation from admitted filesystem identity.
 * @evidence contracts/performance.md#efficient-algorithms Native path normalization/relative computation and prefix tests depend on input path text length, with one temporary relative string.
 * @evidence contracts/performance.md#reuse-equivalent-work The output separation owner shares this predicate for both directions without a persistent path verdict cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean escapes and no descriptor, filesystem observation or task is acquired.
 */
export function productionBinderContains(parent: string, candidate: string): boolean {
    const relative: string = path.relative(parent, candidate);
    return (relative === "" ||
        (relative !== ".." &&
            !relative.startsWith(`..${path.sep}`) &&
            !path.isAbsolute(relative)));
}
