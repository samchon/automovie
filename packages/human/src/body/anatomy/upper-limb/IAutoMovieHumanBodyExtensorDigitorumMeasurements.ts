import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Posterior forearm extensor digitorum with tendons to four fingers.
 *
 * Its belly and wrist/hand tendons cross distinct groups; a muscle volume target cannot be interpreted as independent 3D finger-tendon paths.
 *
 * @evidence contracts/common.md#principled-implementation Extensor digitorum adopts shared muscle-belly quantities while preserving its posterior forearm identity and four-finger tendon scope.
 * @evidence contracts/common.md#clear-and-simple-design Forearm ownership contains the belly and leaves distal wrist/hand tendon relations separately generated.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A muscle volume target cannot encode independent three-dimensional finger-tendon paths.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes the posterior belly from tendons crossing into wrist and hand groups.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Extensor quantity typing performs no four-finger tendon routing or hand deformation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The extensor alias stores no resolved wrist-to-digit path result to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Extensor inputs acquire no digital tendon arrays or cross-group motion task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyExtensorDigitorumMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
