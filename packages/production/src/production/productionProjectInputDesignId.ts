

/**
 * Read a nonblank input ID for diagnostic attribution before schema admission.
 *
 * @evidence contracts/common.md#principled-implementation An object with an accessible string id whose trim is nonempty contributes its original spelling; inherited properties count under the in operator.
 * @evidence contracts/common.md#clear-and-simple-design Label extraction stays separate from schema validation and portable ID admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The invalid label is a diagnostic fallback, not an invented design or normalized ID.
 * @evidence contracts/common.md#meaningful-documentation Whitespace is tested but retained in a returned ID; accessors can still throw.
 * @evidence contracts/performance.md#efficient-algorithms Fixed object checks plus trimming cost follows ID text, with no graph or filesystem scan.
 * @evidence contracts/performance.md#reuse-equivalent-work Reads the input per call and does not memoize mutable properties.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned string escapes; temporary trimmed text releases and no handle is acquired.
 */
export function productionProjectInputDesignId(input: unknown): string {
    if (typeof input === "object" &&
        input !== null &&
        "id" in input &&
        typeof input.id === "string" &&
        input.id.trim().length !== 0)
        return input.id;
    return "(invalid)";
}
