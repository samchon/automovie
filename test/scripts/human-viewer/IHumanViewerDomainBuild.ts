/**
 * The last numerical build of one domain.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the document and duration.
 * @author Samchon
 */
export interface IHumanViewerDomainBuild {
  /** Document built. */
  doc: string;

  /** Worker milliseconds of the build. */
  ms: number;
}
