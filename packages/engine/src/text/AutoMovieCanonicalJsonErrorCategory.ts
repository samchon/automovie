
/**
 * Name the five explicit canonical-JSON domain refusal categories.
 *
 * @evidence contracts/common.md#principled-implementation The closed union separates unsupported values, malformed Unicode, active-ancestry cycles, non-plain containers and accessor properties according to canonicalizer checks.
 * @evidence contracts/common.md#clear-and-simple-design A scalar category belongs to the typed failure contract rather than a duplicate runtime classifier or message parser.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The union does not claim to classify Proxy traps, allocation failures or recursion exhaustion; those remain outside the canonicalizer's explicit domain checks.
 * @evidence contracts/common.md#meaningful-documentation Documents each category's rule population and stable classification independent of host error wording.
 * @evidence contracts/performance.md#efficient-algorithms The type adds no runtime traversal or storage; classification cost belongs to the failing canonicalizer operation.
 * @evidence contracts/performance.md#reuse-equivalent-work The canonicalizer and its typed error share these exact category values; no translation table or cached classification is required.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The category is scalar data retained only with its owning error, with no graph, bytes or task ownership.
 * @author Samchon
 */
export type AutoMovieCanonicalJsonErrorCategory =
  | "unsupported-value"
  | "invalid-unicode"
  | "cyclic-value"
  | "non-plain-container"
  | "accessor-property";
