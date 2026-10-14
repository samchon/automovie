import type { IHumanViewerFaceDocuments } from "./IHumanViewerFaceDocuments.js";

/**
 * The face documents of the last reading and what they were read from.
 *
 * @evidence contracts/common.md#principled-implementation Caches one face projection under subject-file mtime/size, face basis/source digests and serialized reference parameters.
 * @evidence contracts/common.md#clear-and-simple-design Stores one signature/value pair with null before first reading instead of another per-document cache.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A metadata stamp can miss a same-size/same-time rewrite; memo equality is a provider-limited premise, not fresh byte proof.
 * @evidence contracts/common.md#meaningful-documentation Documents all current signature inputs, null initialization and the matching projection's source authority.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no hashing; its consumer builds a signature and skips parse/hash only under actual signature equality.
 * @evidence contracts/performance.md#reuse-equivalent-work Changed stamp, basis, face source or reference parameters replaces the value; owner invalidation must deliver relevant source changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One latest projection/signature remains with the source owner, retaining its subject-sized parameter arrays until replacement and no native handles.
 *
 * @author Samchon
 */
export interface IHumanViewerFaceDocumentsMemo {
  /**
   * The subject list's mtime/size stamp, face basis/source digests and serialized reference parameters; null before the first reading. Same-stamp byte rewrites can escape this identity.
   */
  signature: string | null;

  /** The documents read under that signature. */
  value: IHumanViewerFaceDocuments | null;
}
