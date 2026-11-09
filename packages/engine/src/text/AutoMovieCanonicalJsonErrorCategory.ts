/**
 * Name the five explicit canonical-JSON domain refusal categories.
 *
 * @evidence contracts/development/design.md#principled-representation The closed union separates unsupported values, malformed Unicode, active-ancestry cycles, non-plain containers and accessor properties according to canonicalizer checks.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A scalar category belongs to the typed failure contract rather than a duplicate runtime classifier or message parser.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The union does not claim to classify Proxy traps, allocation failures or recursion exhaustion; those remain outside the canonicalizer's explicit domain checks.
 * @evidence contracts/development/common.md#meaningful-documentation Documents each category's rule population and stable classification independent of host error wording.
 */
export type AutoMovieCanonicalJsonErrorCategory =
  | "unsupported-value"
  | "invalid-unicode"
  | "cyclic-value"
  | "non-plain-container"
  | "accessor-property";
