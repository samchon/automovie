import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Target or observed deltoid volume or MRI fat fraction, distinct from skin relief.
 *
 * Its clavicular, acromial and scapular-spine origins converge on the humeral deltoid tuberosity. A whole-muscle volume does not reveal their separate bellies or the skin shift during humeral elevation. A future generator must resolve those bony attachments and the muscle's own volume before using it to support the axillary or shoulder surface.
 *
 * @evidence contracts/common.md#principled-implementation The deltoid aliases the shared nonempty muscle-belly volume/PDFF representation, preserving each supplied quantity's provenance.
 * @evidence contracts/common.md#clear-and-simple-design Deltoid identity remains with its shoulder member while common muscle measurement rules stay centralized.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Whole-deltoid volume does not resolve its separate regions or the skin shift during humeral elevation.
 * @evidence contracts/common.md#meaningful-documentation The prose separates internal muscle quantities from skin relief and states unresolved attachment and surface requirements.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The deltoid alias performs no regional belly partition or elevated-arm surface solve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Deltoid quantity typing has no resolved clavicular/acromial/spinal regions to reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This muscle input owns no deltoid-region mesh, MRI image or elevation simulation.
 * @author Samchon
 */
export type IAutoMovieHumanBodyDeltoidMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
