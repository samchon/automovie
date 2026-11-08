import type { EvidenceDeclarationKind } from "./EvidenceDeclarationKind";

/**
 * Carries a parsed evidence heading without changing its original bytes.
 *
 * @evidence contracts/development/design.md#principled-representation The parsed record carries H2-H4 level, family, inline reason and optional review fingerprint offset.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Structural coordinates expose parsed meaning without mutating source bytes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The review offset follows syntax rather than matching a token's value.
 * @evidence contracts/development/common.md#meaningful-documentation Properties state level range, inline-reason meaning and character-offset units.
 */
export interface IEvidenceHeading {
  /** ATX heading level between two and four. */
  level: number;

  /** Acknowledgement or review declaration recognized in this heading. */
  kind: EvidenceDeclarationKind;

  /** Inline reason after the structural declaration, when present. */
  reason: string;

  /** Character offset of the review fingerprint within its source line. */
  fingerprintStart?: number;
}
