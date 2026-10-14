import type { IHumanViewerNodeWorkerData } from "./IHumanViewerNodeWorkerData.js";

/**
 * Host initialization is distinct from every original product request.
 *
 * @evidence contracts/common.md#principled-implementation Carries the explicit host initialization envelope delivered only after the child installs its startup receiver.
 * @evidence contracts/common.md#clear-and-simple-design Separates source/entry/witness startup authority from every original numerical document request.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The initialization handshake is not numerical readiness; the checked child validates input fields and loaded authority before replying ready.
 * @evidence contracts/common.md#meaningful-documentation Documents the initialize discriminator and original host witness, with actual document admission occurring later through product requests.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The shape performs no send; child startup parses fixed envelope fields then scans witness entries/actual input bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work One session has one startup authority and later commands cannot substitute a document message for this handshake.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The child retains resolved startup values while its realm is live; the envelope itself owns no process or HTTP stream.
 *
 * @author Samchon
 */
export interface IHumanViewerNodeInitialization {
  /**
   * Host-startup message discriminant, separate from numerical document requests.
   */
  type: "initialize";

  /** Original host source witness, checked before numerical readiness. */
  input: IHumanViewerNodeWorkerData;
}
