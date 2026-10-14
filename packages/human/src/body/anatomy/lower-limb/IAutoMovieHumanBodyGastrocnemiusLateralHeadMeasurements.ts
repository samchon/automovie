import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Lateral superficial calf head crossing knee and ankle toward the calcaneal tendon. It has a separate proximal femoral origin.
 *
 * This named belly accepts physical volume or MRI fat fraction, never skin vertices.
 *
 * @evidence contracts/common.md#principled-implementation The lateral gastrocnemius head uses the shared volume/fat-fraction schema as one independent calf-belly owner.
 * @evidence contracts/common.md#clear-and-simple-design Lateral calf-head identity remains separate while quantitative field definitions are reused.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The lateral head does not duplicate medial-head or soleus geometry or infer it from calf skin.
 * @evidence contracts/common.md#meaningful-documentation The comment names the independent lateral calf head and scalar authoring controls.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Lateral gastrocnemius inputs execute no calf-belly measurement or surface solve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Lateral-head naming retains no cached calcaneal-tendon or composition result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This calf-head alias owns no MRI segmentation or generated lateral belly.
 * @author Samchon
 */
export type IAutoMovieHumanBodyGastrocnemiusLateralHeadMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
