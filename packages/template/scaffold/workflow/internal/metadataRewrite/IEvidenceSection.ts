import type { EvidenceDeclarationKind } from "./EvidenceDeclarationKind";

/** Bounds one evidence annotation section in its original line population. */
export interface IEvidenceSection {
  /** First source-line index belonging to this annotation. */
  start: number;
  /** Exclusive source-line index of the annotation. */
  end: number;
  /** Declaration family used to select mutable metadata. */
  kind: EvidenceDeclarationKind;
  /** Character offset of a review fingerprint within the opening line. */
  fingerprintStart?: number;
}
