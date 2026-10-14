import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Medial quadriceps belly guiding the patella from femur toward the common tendon. Its distal shape changes at the knee without becoming the patella.
 *
 * This named belly accepts physical volume or MRI fat fraction, never skin vertices.
 *
 * @evidence contracts/common.md#principled-implementation Medialis inherits muscle quantity provenance without equating its distal shape with the patella.
 * @evidence contracts/common.md#clear-and-simple-design The medial quadriceps belly stays separately named while sharing quantity field definitions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Medial patellar guidance is not a license to substitute patellar bone volume for muscle.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes medial location, common tendon relationship and changing distal shape.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Medialis typing computes no patellar tracking or medial muscle reconstruction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This medial-belly alias shares no evaluated knee-tracking result across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Medialis metadata holds no knee solver state or generated muscle buffers.
 * @author Samchon
 */
export type IAutoMovieHumanBodyVastusMedialisMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
