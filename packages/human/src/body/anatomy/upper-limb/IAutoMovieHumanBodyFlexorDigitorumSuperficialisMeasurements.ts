import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Forearm flexor digitorum superficialis supplying digits two through five.
 *
 * Its separate belly and distal tendons are not encoded by one forearm girth; finger flexion moves its tendon through the wrist and hand groups.
 *
 * @evidence contracts/common.md#principled-implementation Flexor digitorum superficialis retains its separately measured belly volume/PDFF under common muscle quantity provenance.
 * @evidence contracts/common.md#clear-and-simple-design The forearm member owns the superficial flexor belly while tendons crossing wrist/hand remain separate relations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A forearm girth cannot determine this belly or the distal tendon paths serving digits two through five.
 * @evidence contracts/common.md#meaningful-documentation The prose gives digit scope and separates belly quantities from tendon motion across regional groups.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Superficial digital-flexor typing performs no tendon excursion or forearm tissue segmentation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This flexor alias caches no wrist-to-finger routing or reconstructed belly boundary.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Flexor quantities own no distal tendon buffers or finger-flexion runtime task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyFlexorDigitorumSuperficialisMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
