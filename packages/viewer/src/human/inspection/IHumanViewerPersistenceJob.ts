import type { IHumanViewerPreviewProjection } from "./IHumanViewerPreviewProjection.js";

/**
 * One successful preview retained by its producing numerical worker until
 * the page has drawn it. The immutable catalogue key and frame token are
 * captured with the build, never read from a later page generation.
 *
 * @evidence contracts/common.md#principled-implementation The successful preview is retained with its producing request, immutable cache key and authorized frame token.
 * @evidence contracts/common.md#clear-and-simple-design One job binds output to the source authority captured when it was built.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Construction results are outside this preview queue and later page state cannot replace its original token.
 * @evidence contracts/common.md#meaningful-documentation Comments distinguish numerical cache identity, frame write authority and the original admitted preview value.
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
