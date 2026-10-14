

/**
 * Admit case-insensitive UUIDv4 spelling for repaint storage identities.
 *
 * @evidence contracts/common.md#principled-implementation Matches the complete UUID group/version/variant pattern case-insensitively and returns the exact supplied spelling; the separate incarnation predicate deliberately requires lowercase storage spelling.
 * @evidence contracts/common.md#clear-and-simple-design One throwing scalar admission serves request/attempt/selection path formatters, while label supplies caller-specific refusal attribution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not lowercase, generate, prove randomness or infer uniqueness from a syntactically valid UUID; every repaint path uses the same existing spelling policy.
 * @evidence contracts/common.md#meaningful-documentation Names UUID version four, case-insensitive acceptance and unchanged return spelling, rather than describing this as a cryptographic identity proof.
 * @evidence contracts/performance.md#efficient-algorithms Runs one anchored fixed-format regex and returns the input string, without a registry search or project-size allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Scalar spelling admission has no effectful/acquired result to coordinate and no UUID validation cache is maintained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns the caller's string or throws one attributed Error, retaining no id population, descriptor or task.
 */
export function productionProjectUuid(value: string, label: string): string {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value) === false)
        throw new Error(`${label} must be a UUID v4.`);
    return value;
}
