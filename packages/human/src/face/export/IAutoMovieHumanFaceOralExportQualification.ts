import type { IAutoMovieHumanFaceOralExportPartQualification } from "./IAutoMovieHumanFaceOralExportPartQualification";

/**
 * Explicit qualification of an actual generated coarse oral static assembly.
 * Source hashes identify its canonical licensed provenance; clinical gaps
 * remain distinct from mathematical, runtime or Float32 admission. The
 * static geometry carries no promise to restore an editable person document.
 *
 * @evidence contracts/common.md#principled-implementation Versioned coarse oral qualification carries admitted producer generation/native digest, source receipt/license and explicit clinical gaps beside exact emitted tongue/member ids. The factory recomputes the native source digest and the static writer separately binds actual output intervals; neither is clinical validation.
 * @evidence contracts/common.md#clear-and-simple-design Source provenance, qualification limits and ordered source members stay separate from canonical primitive geometry/physical correspondence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The coarse-authored label and CC0 license are supplied supported metadata, not proof of rights authenticity or measured tissue. Static output promises no editable reconstruction, population validity or anatomy certificate.
 * @evidence contracts/common.md#meaningful-documentation Prose/member comments give independent schema, original rather than posed hashes, exact Person-prefixed identities, clinical gaps and primitive member order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This schema computes no digest, accessor interval or export geometry; its factory/readers own those operations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Receipt hashes declare source provenance rather than a posed-geometry cache key or accepted clinical equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller-owned metadata arrays acquire no asset, hash task, IO stream or renderer handle in this declaration.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOralExportQualification {
  /** Independent namespace schema version. */
  version: 1;

  /** Authored anatomy is not clinical acquisition or validation. */
  qualification: "coarse-authored-oral-no-clinical-validation";

  /** Canonical generation of the actual oral registration. */
  generation: string;

  /** Producer SHA-256 of original dental neutral/target/attachment/region data. */
  dentalNativeSha256: string;

  /** Original licensed inputs and producer registration receipt hashes. */
  sourceSha256: string[];

  /** Publisher's native source license, not inferred from final appearance. */
  sourceLicense: "CC0-1.0";

  /** Named unknowns, rather than guessed populations, roots or tissue values. */
  clinicalGaps: string[];

  /** Exact native tongue region IDs consumed by this assembly, including person prefix. */
  tonguePartIds: string[];

  /** Source members in actual static primitive member order. */
  parts: IAutoMovieHumanFaceOralExportPartQualification[];
}
