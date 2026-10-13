import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Deep posterior leg muscle from tibia/fibula to tarsal bones. Its tendon supports the medial arch but one volume cannot set that arch.
 *
 * This named belly accepts physical volume or MRI fat fraction, never skin vertices.
 *
 * @evidence contracts/common.md#principled-implementation Posterior tibialis inherits muscle quantity provenance while leaving arch geometry independently unresolved.
 * @evidence contracts/common.md#clear-and-simple-design The deep posterior belly reuses the muscle schema instead of embedding foot geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A single posterior muscle volume does not prescribe medial arch shape or skin position.
 * @evidence contracts/common.md#meaningful-documentation Prose identifies deep location, tarsal attachment and the limit of one measured volume.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Posterior tibialis typing performs no arch solving or tendon routing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This posterior muscle alias does not reuse or invalidate geometric computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The posterior tibialis contract retains no arch mesh or tendon resource.
 * @author Samchon
 */
export type IAutoMovieHumanBodyTibialisPosteriorMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
