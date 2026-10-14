import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyVertebraMeasurements } from "./IAutoMovieHumanBodyVertebraMeasurements";

/**
 * Five lumbar vertebrae between thorax and sacrum, each one midline bone. Their separate volumes do not determine loaded standing lordosis.
 *
 * @evidence contracts/common.md#principled-implementation Nonempty L1-L5 fields preserve individual midline lumbar bone measurements rather than one combined spine quantity.
 * @evidence contracts/common.md#clear-and-simple-design A lumbar collection composes the common vertebra input while sagittal alignment remains owned by the spine record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Separate lumbar volumes cannot determine loaded standing lordosis or intervertebral disc geometry.
 * @evidence contracts/common.md#meaningful-documentation The prose gives thorax-to-sacrum ownership and members retain each lumbar identity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Lumbar grouping performs no loaded curvature fit or disc assembly.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Five lumbar fields retain no evaluated standing-spine solution across acquisitions.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Numbered lumbar inputs own no vertebral mesh or posture simulation.
 * @author Samchon
 */
export type IAutoMovieHumanBodyLumbarVertebraeMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Numbered L1 vertebra. */
    l1?: IAutoMovieHumanBodyVertebraMeasurements;

    /** Numbered L2 vertebra. */
    l2?: IAutoMovieHumanBodyVertebraMeasurements;

    /** Numbered L3 vertebra. */
    l3?: IAutoMovieHumanBodyVertebraMeasurements;

    /** Numbered L4 vertebra. */
    l4?: IAutoMovieHumanBodyVertebraMeasurements;

    /** Numbered L5 vertebra. */
    l5?: IAutoMovieHumanBodyVertebraMeasurements;
  }>;
