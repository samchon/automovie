import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Posterior upper-arm triceps brachii with three anatomical heads.
 *
 * The long head crosses shoulder and elbow from scapula; the lateral and medial heads arise on humerus. Their common tendon reaches the ulnar olecranon. Whole-belly volume does not specify head-by-head boundaries.
 *
 * @evidence contracts/common.md#principled-implementation Triceps brachii retains shared whole-belly volume and MRI fat fraction while acknowledging three differently originating heads.
 * @evidence contracts/common.md#clear-and-simple-design The upper-arm member owns triceps identity while separate generated relations must resolve scapular/humeral origins and the common ulnar tendon.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Whole-belly scalar measurements cannot divide long, lateral and medial boundaries or replace individual tendon geometry.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies shoulder-crossing long head, humeral heads and the shared olecranon insertion.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Triceps quantity typing performs no three-head partition or common-tendon route solve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The triceps alias owns no resolved head-by-head mesh or scapular attachment cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Triceps inputs acquire no head boundaries, tendon buffers or elbow-extension task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyTricepsBrachiiMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
