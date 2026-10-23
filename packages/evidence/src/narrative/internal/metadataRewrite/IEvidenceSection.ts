import type { EvidenceDeclarationKind } from "./EvidenceDeclarationKind";

/**
 * Bounds one evidence annotation section in its original line population.
 *
 * @evidence contracts/common.md#principled-implementation Start and exclusive end line indexes bound a recognized evidence annotation.
 * @evidence contracts/common.md#clear-and-simple-design Section parsing communicates source coordinates to byte projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only grammar-recognized sections receive these bounds; the shape grants no additional mutation rights.
 * @evidence contracts/common.md#meaningful-documentation Properties define source indexes, declaration family and opening-line fingerprint coordinates.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased type chooses no runtime algorithm; producing and consuming functions own processing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased data shape coordinates no work or cache; concrete runtime owners decide value equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased declaration acquires no resources; producers and consumers own concrete value lifetimes.
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
