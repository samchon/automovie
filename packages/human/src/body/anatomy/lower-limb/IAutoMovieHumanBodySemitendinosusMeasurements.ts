import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Medial hamstring from ischial tuberosity toward the medial proximal tibia. Tendon path and belly volume are distinct outputs.
 *
 * This named belly accepts physical volume or MRI fat fraction, never skin vertices.
 *
 * @evidence contracts/common.md#principled-implementation Semitendinosus independently accepts the shared physical belly volume/Dixon fraction records under its named hamstring owner.
 * @evidence contracts/common.md#clear-and-simple-design The medial superficial belly shares schema definitions without sharing another muscle's identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Tendon path and belly volume remain distinct outputs rather than deriving either from source vertices authored here.
 * @evidence contracts/common.md#meaningful-documentation The prose defines named belly ownership and separates tendon-path from scalar-volume meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Semitendinosus measurement metadata executes no tendon-routing or belly-generation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Superficial medial hamstring input retains no achieved tendon/volume result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The semitendinosus alias acquires no tendon curve, muscle mesh or running solve.
 * @author Samchon
 */
export type IAutoMovieHumanBodySemitendinosusMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
