import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Broad posterior thoracic muscle from thoracolumbar fascia and pelvis to the humerus. Its insertion crosses from trunk to upper limb. One side's muscle belly accepts named volume or MRI fat fraction only.
 *
 * @evidence contracts/common.md#principled-implementation Latissimus dorsi preserves independently supplied volume/PDFF of one posterior thoracic belly with shared muscle provenance.
 * @evidence contracts/common.md#clear-and-simple-design Trunk ownership names the belly while its cross-region humeral attachment stays a separate generated relation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Back skin relief cannot replace latissimus tissue or locate its humeral tendon from a scalar volume.
 * @evidence contracts/common.md#meaningful-documentation The prose gives thoracolumbar/pelvic origin scope and the insertion crossing into the upper limb.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Latissimus quantity typing computes no back-muscle boundary or humeral tendon route.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The back-to-arm muscle alias stores no completed attachment correspondence to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Latissimus inputs acquire no posterior muscle mesh or tendon-registration task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyLatissimusDorsiMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
