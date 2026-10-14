/**
 * Recognize exact nonempty trimmed identity text without coercing unknown values.
 *
 * @evidence contracts/common.md#principled-implementation The string guard precedes nonempty trim and exact original-to-trim equality, so padding is refused without changing identity text.
 * @evidence contracts/common.md#clear-and-simple-design Identity-family metadata owners share one value predicate while member-specific vocabulary stays with each caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coercion, Unicode normalization or secret/locator admission is inferred from trimmed nonempty text.
 * @evidence contracts/common.md#meaningful-documentation Prose states unknown-value refusal and exact trimmed spelling rather than a safe-content certificate.
 * @evidence contracts/performance.md#efficient-algorithms Two trim operations scan at most L characters with potential trimmed-string allocation; fixed metadata counts bound the number of invocations per owner.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This value predicate coordinates no repeated request or equivalent-work cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the boolean/type narrowing escapes and temporary trim values expire; input text is not retained.
 */
export const productionRepaintIdentityIsNonBlank: (value: unknown) => value is string = (value: unknown): value is string =>
  typeof value === "string" &&
  value.trim().length !== 0 &&
  value === value.trim();
