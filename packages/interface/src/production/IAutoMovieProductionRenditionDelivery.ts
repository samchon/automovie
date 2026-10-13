import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieProductionRenditionDeliveryShot } from "./IAutoMovieProductionRenditionDeliveryShot";
import { IAutoMovieRepaintSequenceObservation } from "./IAutoMovieRepaintSequenceObservation";

/** Review and receipt provenance for one repainted feature delivery. */
export interface IAutoMovieProductionRenditionDelivery {
  /** Versioned occurrence-lane provenance protocol. */
  version: 2;

  /** Versioned explicit visual-lane provenance kind. */
  kind: "visual-lanes";

  /** Digest of the canonical ordered occurrence-member population. */
  memberSetDigest: AutoMovieContentDigest;

  /** Current passing aggregate sequence observation, null for all-deterministic. */
  observationDigest: AutoMovieContentDigest | null;

  /** Full observation needed for parser-only readback, null for all-deterministic. */
  observation: IAutoMovieRepaintSequenceObservation | null;

  /** Every visual occurrence consumed by the current film timeline. */
  shots: IAutoMovieProductionRenditionDeliveryShot[];
}
