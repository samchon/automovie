import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Medial superficial calf head crossing knee and ankle toward the calcaneal tendon. Its belly is distinct from the lateral head and soleus.
 *
 * This named belly accepts physical volume or MRI fat fraction, never skin vertices.
 *
 * @evidence contracts/common.md#principled-implementation A distinct medial gastrocnemius alias preserves its own muscle volume/composition request under the common quantitative contract.
 * @evidence contracts/common.md#clear-and-simple-design Medial-head ownership separates it from lateral gastrocnemius and deeper soleus.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The medial record substitutes no second copy of another calf muscle or outer skin contour.
 * @evidence contracts/common.md#meaningful-documentation Comments identify medial calf-belly scope and physical volume/MRI-fat inputs.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Medial gastrocnemius typing runs no posterior-calf reconstruction algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Medial-head quantities coordinate no repeated calf-volume computation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The medial alias retains no imaged calf bytes or active belly generator.
 * @author Samchon
 */
export type IAutoMovieHumanBodyGastrocnemiusMedialHeadMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
