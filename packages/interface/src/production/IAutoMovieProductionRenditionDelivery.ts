import { IAutoMovieProductionRenditionDeliveryShot } from "./IAutoMovieProductionRenditionDeliveryShot";
import { IAutoMovieRepaintSequenceObservation } from "./IAutoMovieRepaintSequenceObservation";

/**
 * Ordered visual-source and aggregate observation provenance for a feature delivery.
 *
 * @evidence contracts/common.md#principled-implementation The ordered occurrence population receives a canonical member-set digest, with current selected repaint identities and a passing aggregate sequence observation when any occurrence is repainted; final validation reconstructs and compares that population.
 * @evidence contracts/common.md#clear-and-simple-design One versioned visual-lanes record composes lane-specific occurrence records and their shared sequence observation, covering mixed and homogeneous delivery without a separate repaint-only ledger.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts All-deterministic delivery has null observation identity and payload; repaint delivery requires the current matching observation and selected receipt population, not whichever candidates remain on disk.
 * @evidence contracts/common.md#meaningful-documentation Defines ordered occurrence membership, canonical digest, lane protocol and observation presence or null meaning.
 * @author Samchon
 */
export interface IAutoMovieProductionRenditionDelivery {
  /** Versioned occurrence-lane provenance protocol. */
  version: 2;

  /** Versioned explicit visual-lane provenance kind. */
  kind: "visual-lanes";

  /** Digest of the canonical ordered occurrence-member population. */
  memberSetDigest: string;

  /** Current passing aggregate sequence observation, null for all-deterministic. */
  observationDigest: string | null;

  /** Full observation needed for parser-only readback, null for all-deterministic. */
  observation: IAutoMovieRepaintSequenceObservation | null;

  /** Every visual occurrence consumed by the current film timeline. */
  shots: IAutoMovieProductionRenditionDeliveryShot[];
}
