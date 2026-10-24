import type { EvidenceDeclarationKind } from "./EvidenceDeclarationKind";

/**
 * Carries a parsed evidence heading without changing its original bytes.
 *
 * @evidence contracts/common.md#principled-implementation The parsed record carries H2-H4 level, family, inline reason and optional review fingerprint offset.
 * @evidence contracts/common.md#clear-and-simple-design Structural coordinates expose parsed meaning without mutating source bytes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The review offset follows syntax rather than matching a token's value.
 * @evidence contracts/common.md#meaningful-documentation Properties state level range, inline-reason meaning and character-offset units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased type chooses no runtime algorithm; producing and consuming functions own processing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased data shape coordinates no work or cache; concrete runtime owners decide value equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased declaration acquires no resources; producers and consumers own concrete value lifetimes.
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
