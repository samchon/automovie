

/**
 * Nonempty slash-separated relative spelling rejects backslashes, absolute/drive paths and dot traversal.
 *
 * @evidence contracts/common.md#principled-implementation Nonempty slash-separated relative spelling rejects backslashes, absolute/drive paths and dot traversal.
 * @evidence contracts/common.md#clear-and-simple-design Legacy inventory metadata uses this rule before baseline prefix checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This historical rule does not reject every Windows device, colon, trailing-dot or NUL spelling; physical owners require separate admission.
 * @evidence contracts/common.md#meaningful-documentation States exact spelling scope rather than physical containment or existence.
 * @evidence contracts/performance.md#efficient-algorithms Scans L units and split segments with O(L) temporary text.
 * @evidence contracts/performance.md#reuse-equivalent-work Inventory and baseline callers share the rule without a retained path cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean escapes; split segments expire and no file is opened.
 */
export const legacyImportIsCanonicalRelativePath: (value: string) => boolean = (value: string): boolean => value.length !== 0 &&
    value.includes("\\") === false &&
    !value.startsWith("/") &&
    !/^[A-Za-z]:/.test(value) &&
    value
        .split("/")
        .every((segment: string) : boolean => segment.length !== 0 && segment !== "." && segment !== "..");
