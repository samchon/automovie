import type { EvidenceDeclarationKind } from "./EvidenceDeclarationKind";

/** Carries a parsed evidence heading without changing its original bytes. */
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
