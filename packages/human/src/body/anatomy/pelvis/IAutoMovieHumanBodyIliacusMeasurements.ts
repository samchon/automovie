import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Iliacus belly in one iliac fossa joining the iliopsoas tendon.
 *
 * Its coxal origin and femoral insertion differ from psoas major's lumbar origin; a combined CT iliopsoas label cannot identify the two volumes.
 *
 * @evidence contracts/common.md#principled-implementation Iliacus aliases the common muscle quantity schema without claiming the lumbar-origin psoas quantity.
 * @evidence contracts/common.md#clear-and-simple-design The iliac-fossa belly has one named owner even though its tendon joins iliopsoas.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A combined iliopsoas CT quantity cannot identify independent iliacus and psoas volumes.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes coxal origin from lumbar psoas origin and names the unresolved combined-volume split.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Iliacus typing performs no combined-label decomposition or hip-flexor integration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The iliacus alias coordinates no reusable psoas/iliacus partition calculation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Iliacus metadata retains no combined segmentation bytes or tendon model resources.
 * @author Samchon
 */
export type IAutoMovieHumanBodyIliacusMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
