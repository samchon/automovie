import type { EvidenceDeclarationKind } from "./EvidenceDeclarationKind";

/**
 * Bounds one evidence annotation section in its original line population.
 *
 * @evidence contracts/development/design.md#principled-representation Start and exclusive end line indexes bound a recognized evidence annotation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Section parsing communicates source coordinates to byte projection.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Only grammar-recognized sections receive these bounds; the shape grants no additional mutation rights.
 * @evidence contracts/development/common.md#meaningful-documentation Properties define source indexes, declaration family and opening-line fingerprint coordinates.
 */
export interface IEvidenceSection {
  /** Zero-based first source-line index belonging to this annotation. */
  start: number;

  /** Exclusive source-line index of the annotation. */
  end: number;

  /** Declaration family used to select mutable metadata. */
  kind: EvidenceDeclarationKind;

  /** Character offset of a review fingerprint within the opening line. */
  fingerprintStart?: number;
}
