import type { IHumanViewerPreviewProjection } from "./IHumanViewerPreviewProjection.js";

/**
 * One successful preview retained by its producing numerical worker until the page has drawn it. The immutable catalogue key and frame token are captured with the build, never read from a later page generation.
 *
 * @evidence contracts/common.md#principled-implementation Pins a successful preview with its producing request id, immutable numerical key and frame token before optional display-triggered persistence.
 * @evidence contracts/common.md#clear-and-simple-design Keeps cache-write authority attached to actual produced values instead of rereading a later page generation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Construction/export values do not enter the preview queue; the shared shallow guard still does not validate nested numerical schema.
 * @evidence contracts/common.md#meaningful-documentation Documents source/document/AO identity and generation-write token, which the server checks before storing bytes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This job performs no encoding; chunked preview serialization and HTTP publication scale with full model payload.
 * @evidence contracts/performance.md#reuse-equivalent-work Latest pending jobs supersede older pending work, while active and pending keys/tokens remain distinct and cannot be merged by result timing.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The persistence owner retains one active and one pending projection; aborted active IO/buffers remain until actual settlement and no payload-byte cap exists.
 *
 * @author Samchon
 */
export interface IHumanViewerPersistenceJob {
  /** Worker request that produced this projection. */
  id: number;

  /** Document, source and AO cache identity. */
  key: string;

  /** Proven source generation permitted to write by the server. */
  token: string;

  /**
   * Original admitted-preview result; face and person constructions never enter this queue.
   */
  value: IHumanViewerPreviewProjection;
}
