

/**
 * Require nonblank text already in its authored trimmed spelling.
 *
 * @evidence contracts/common.md#principled-implementation Compares the supplied string with its native trim result and refuses blank or boundary-whitespace text, preserving accepted authored content exactly rather than normalizing it.
 * @evidence contracts/common.md#clear-and-simple-design Path and review admission reuse this scalar requirement, with caller labels providing refusal context and their owners deciding further semantic meaning.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonblank review prose is an author statement rather than measured proof, and this check adds no lexical vocabulary, word-count or fixture-specific rule.
 * @evidence contracts/common.md#meaningful-documentation Describes the accepted unchanged spelling and attributed failure, distinguishing basic text presence from independent review evidence validation.
 * @evidence contracts/performance.md#efficient-algorithms Performs two native trim calls and comparisons proportional to text length, with no document/graph traversal or retained review ledger.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One scalar text admission has no acquired or effectful result to share; mutable ingress owners check their own current supplied value.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns the input string or throws a labelled Error, holding no parsed document, descriptor, lock or task.
 */
export function productionProjectTrimmedText(value: string, label: string): string {
    if (value.trim().length === 0 || value !== value.trim())
        throw new Error(`${label} must be trimmed and non-empty.`);
    return value;
}
