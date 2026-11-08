/**
 * Distinguishes acknowledgements from reviews when assigning rewrite ownership.
 *
 * @evidence contracts/development/design.md#principled-representation A closed union distinguishes acknowledgement and review grammar families.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Flat declarations, headings and projection share this ownership classification.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Both alternatives correspond to evidence grammar rather than consumer identities.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states its role in rewrite ownership.
 */
export type EvidenceDeclarationKind = "acknowledgement" | "review";
