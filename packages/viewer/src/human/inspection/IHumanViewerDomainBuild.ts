/**
 * The last numerical build of one domain.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the document and duration.
 *
 * @evidence contracts/common.md#principled-implementation A domain's last completed numerical build is represented by its actual document id and worker duration.
 * @evidence contracts/common.md#clear-and-simple-design Document and milliseconds are the only fields needed for the per-domain latest-build query.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The duration is reported by a completed worker build, never invented from a display cache hit.
 *
 * @author Samchon
 */
export interface IHumanViewerDomainBuild {
  /** Document built. */
  doc: string;

  /** Worker milliseconds of the build. */
  ms: number;
}
