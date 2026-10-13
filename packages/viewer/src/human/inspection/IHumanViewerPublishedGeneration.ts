/**
 * What the catalogue needs of the published person generation to build the standard people on it: the view basis ids their documents name and the digests of both view files for their cache keys.
 *
 * @evidence contracts/common.md#principled-implementation Projects a checked head/body view pair's required face/body basis ids and full byte digests for person and paired-body catalogue identity.
 * @evidence contracts/common.md#clear-and-simple-design Keeps basis names documents declare separate from view bytes used by canonical tokens/cache keys.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal opening generation ids and required members admit naming only; missing/pending/malformed views refuse or wait and numerical Person admission remains separate.
 * @evidence contracts/common.md#meaningful-documentation Documents head face id, body basis id and each compressed view file's SHA-256, without claiming collision-free shortened display tokens.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The projection hashes nothing; asynchronous facts own byte work and pair selection adds fixed identity/member checks.
 * @evidence contracts/performance.md#reuse-equivalent-work Both digests accompany the selected pair and replaced bytes invalidate downstream keys, rather than reusing by generation name alone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned four strings retain no whole basis/geometry arrays or stream; source facts and numerical runtimes have independent lifetimes.
 *
 * @author Samchon
 */
export interface IHumanViewerPublishedGeneration {
  /** `face.id` of the head view, the face basis the standard people name. */
  face: string;

  /** `body.id` of the body view, the body basis the standard people name. */
  body: string;

  /** Hex SHA-256 of the head view file. */
  headDigest: string;

  /** Hex SHA-256 of the body view file. */
  bodyDigest: string;
}
