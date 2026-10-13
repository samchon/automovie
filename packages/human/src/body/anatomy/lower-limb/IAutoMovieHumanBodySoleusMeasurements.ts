import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Deep calf plantarflexor from tibia and fibula into the calcaneal tendon. It does not cross the knee like gastrocnemius.
 *
 * This named belly accepts physical volume or MRI fat fraction, never skin vertices.
 *
 * @evidence contracts/common.md#principled-implementation Soleus aliases the muscle quantity schema, preserving volume/fat provenance without knee-crossing geometry assumptions.
 * @evidence contracts/common.md#clear-and-simple-design One named calf belly shares the existing muscle contract rather than copying quantity fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Skin vertices and calf girth cannot substitute for a separately identified soleus quantity.
 * @evidence contracts/common.md#meaningful-documentation Prose identifies deep plantarflexor ownership and distinguishes its knee relationship from gastrocnemius.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Soleus quantity typing performs no calf segmentation or inverse surface reconstruction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This calf alias coordinates no equivalent muscle integration across body requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The soleus declaration retains no calf mesh, acquisition bytes or running task.
 * @author Samchon
 */
export type IAutoMovieHumanBodySoleusMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
