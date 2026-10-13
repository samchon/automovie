import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Lateral quadriceps belly from femur to the patellar extensor mechanism. It remains a distinct tissue from rectus femoris and posterior hamstrings.
 *
 * This named belly accepts physical volume or MRI fat fraction, never skin vertices.
 *
 * @evidence contracts/common.md#principled-implementation Lateralis retains the muscle quantity union and distinct lateral quadriceps identity.
 * @evidence contracts/common.md#clear-and-simple-design One lateral quadriceps owner reuses the common muscle schema without merging neighboring bellies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shared patellar extension cannot replace lateralis with rectus femoris or posterior hamstrings.
 * @evidence contracts/common.md#meaningful-documentation Comments identify lateral femoral origin, extensor mechanism and neighboring tissue exclusions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Lateralis type evaluation runs no extensor mechanism solver or muscle boundary scan.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The lateralis alias coordinates no reusable patellar or thigh computation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The lateral-belly declaration retains no extensor mesh or runtime subscription.
 * @author Samchon
 */
export type IAutoMovieHumanBodyVastusLateralisMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
