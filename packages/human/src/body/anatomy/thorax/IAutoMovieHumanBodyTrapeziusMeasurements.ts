import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Posterior cervical and upper-thoracic muscle from axial skeleton toward clavicle and scapula. Scapular rotation changes its path without making it a shoulder bone. One side's muscle belly accepts named volume or MRI fat fraction only.
 *
 * @evidence contracts/common.md#principled-implementation Trapezius adopts shared volume/PDFF quantities for one side's posterior cervical and upper-thoracic muscle belly.
 * @evidence contracts/common.md#clear-and-simple-design Trunk ownership names the belly while cross-region clavicular/scapular relations remain generated attachment responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Scapular motion or upper-back skin shape cannot replace trapezius tissue or turn it into a shoulder bone.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies axial-to-girdle scope and the muscle-path change under scapular rotation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Trapezius quantity typing performs no cervical/scapular path evaluation or muscle segmentation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This upper-back muscle alias stores no equivalent rotated-scapula attachment evaluation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Trapezius inputs own no shoulder-girdle tendon buffer or path-solving task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyTrapeziusMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
