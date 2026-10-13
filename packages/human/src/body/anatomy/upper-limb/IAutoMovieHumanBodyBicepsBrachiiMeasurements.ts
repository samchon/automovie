import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Biceps brachii belly spanning shoulder and elbow on one upper arm.
 *
 * Its long and short heads arise from different scapular sites and converge on the radius; one whole-belly volume does not locate either tendon or define its contour during elbow flexion and forearm supination.
 *
 * @evidence contracts/common.md#principled-implementation Biceps brachii uses shared belly-volume/PDFF quantities while retaining the muscle spanning shoulder and elbow.
 * @evidence contracts/common.md#clear-and-simple-design One upper-arm member owns biceps identity and common muscle quantities own measurement provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Whole-belly volume cannot locate the two scapular origins, radial tendon or flexion/supination contour.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes long/short heads and the unresolved tendon and motion-shape requirements.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Biceps quantity typing performs no two-head partition or elbow/forearm muscle deformation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The biceps alias caches no resolved long/short-head correspondence across poses.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Biceps measurements acquire no tendon path, muscle boundary or supination solver.
 * @author Samchon
 */
export type IAutoMovieHumanBodyBicepsBrachiiMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
