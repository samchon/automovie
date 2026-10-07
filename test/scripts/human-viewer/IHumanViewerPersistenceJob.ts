import type { IHumanViewerPreviewProjection } from "./IHumanViewerPreviewProjection";

/**
 * One successful preview retained by its producing numerical worker until
 * the page has drawn it. The immutable catalogue key and frame token are
 * captured with the build, never read from a later page generation.
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

  /** Original admitted-preview result; face and person constructions never enter this queue. */
  value: IHumanViewerPreviewProjection;
}
