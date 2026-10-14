import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Short biceps femoris head arising along femur and crossing the knee. It does not share the long head's pelvic origin.
 *
 * This named belly accepts physical volume or MRI fat fraction, never skin vertices.
 *
 * @evidence contracts/common.md#principled-implementation Short-head biceps femoris independently reuses the muscle quantitative contract, preserving its records apart from the long head.
 * @evidence contracts/common.md#clear-and-simple-design One short-head alias keeps part responsibility named without reproducing shared volume/composition fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Short-head inputs do not inherit long-head geometry or pelvic-origin validity.
 * @evidence contracts/common.md#meaningful-documentation Comments state separate short-head ownership and physical volume/MRI-fat controls.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Short-head muscle inputs choose no femoral-belly reconstruction algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A short-head schema stores no previously evaluated hamstring measurement.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Short-head records create no source surface resident or muscle-solving task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyBicepsFemorisShortHeadMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
