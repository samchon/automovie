import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Narrow posterior scapular muscle reaching humeral greater tubercle. It is not the larger teres major or a scapular bone contour. One belly's volume or MRI fat fraction cannot by itself locate its tendon.
 *
 * @evidence contracts/common.md#principled-implementation Teres minor retains its own posterior cuff identity through the shared independent belly-volume and fat-fraction schema.
 * @evidence contracts/common.md#clear-and-simple-design Reusing the muscle quantity owner keeps teres-minor measurement details separate from neighboring teres major and scapular shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A posterior skin contour or teres-major quantity cannot substitute for this muscle or locate its tendon.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes the narrow posterior muscle and states why its scalar values leave attachment geometry unresolved.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Teres-minor typing performs no posterior-border segmentation or greater-tubercle footprint solve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This named cuff quantity alias stores no equivalent posterior muscle reconstruction result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Teres-minor input records retain no tendon footprint buffer or tissue-generation task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyTeresMinorMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
