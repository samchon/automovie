import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Anterior leg dorsiflexor along tibia with insertion on medial foot bones. Its belly is separate from posterior calf tissue.
 *
 * This named belly accepts physical volume or MRI fat fraction, never skin vertices.
 *
 * @evidence contracts/common.md#principled-implementation Anterior tibialis uses the shared muscle quantity contract without claiming its surface or attachment reconstruction.
 * @evidence contracts/common.md#clear-and-simple-design A named anterior leg belly remains one alias of the existing muscle schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Anterior muscle quantities cannot be replaced with posterior calf tissue or skin vertices.
 * @evidence contracts/common.md#meaningful-documentation The description supplies anterior location, medial insertion ownership and quantity-only scope.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Anterior tibialis typing executes no dorsiflexion simulation or muscle boundary extraction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The alias orchestrates no repeat muscle integration requiring equivalence decisions.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Anterior tibialis metadata owns no tendon-path buffers or simulation handles.
 * @author Samchon
 */
export type IAutoMovieHumanBodyTibialisAnteriorMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
