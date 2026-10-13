import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieProductionPublicationIdentity } from "./IAutoMovieProductionPublicationIdentity";
import { IAutoMovieProductionRenderedDeliverable } from "./IAutoMovieProductionRenderedDeliverable";

/** Aggregate final-delivery ledger bound to one exact render-plan runtime. */
export interface IAutoMovieProductionRenderManifest {
  /** Aggregate manifest format. */
  version: 2;

  /** Exact builder input that produced every listed output. */
  compileFingerprint: AutoMovieContentDigest;

  /** Structured and self-verifying render-plan identity. */
  publication: IAutoMovieProductionPublicationIdentity;

  /** Materialized required and optional deliverables. */
  deliverables: IAutoMovieProductionRenderedDeliverable[];
}
