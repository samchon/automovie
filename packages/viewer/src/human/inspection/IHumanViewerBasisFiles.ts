/**
 * Paths of the published connected bases the viewer serves and builds on.
 *
 * @evidence contracts/common.md#principled-implementation Names the published face/body gzip basis paths used by catalogue identity reading and digest-checked data serving.
 * @evidence contracts/common.md#clear-and-simple-design Keeps filesystem locations distinct from opening ids and byte digests, allowing both consumers to share one canonical path pair.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A configured path is not admitted basis content; unreadable bytes or missing leading identity refuse at their actual reader.
 * @evidence contracts/common.md#meaningful-documentation States domain and compression format; mutable storage/input path selection remains with the host and no asset bytes are embedded here.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Two path strings perform no IO; reading, prefix inflation and hashing belong to catalogue/data owners.
 * @evidence contracts/performance.md#reuse-equivalent-work Both consumers borrow these canonical paths, while byte/stamp equality and source invalidation govern reuse of actual basis facts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The host retains two strings until configuration replacement; file descriptors, buffers and numerical basis lifetimes remain with their readers.
 *
 * @author Samchon
 */
export interface IHumanViewerBasisFiles {
  /** Published face basis, gzip JSON. */
  face: string;

  /** Published body basis, gzip JSON. */
  body: string;
}
