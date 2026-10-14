import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalAngle } from "../measurements/IAutoMovieHumanBodyAnatomicalAngle";
import type { IAutoMovieHumanBodyCervicalVertebraeMeasurements } from "./IAutoMovieHumanBodyCervicalVertebraeMeasurements";
import type { IAutoMovieHumanBodyLumbarVertebraeMeasurements } from "./IAutoMovieHumanBodyLumbarVertebraeMeasurements";
import type { IAutoMovieHumanBodyThoracicVertebraeMeasurements } from "./IAutoMovieHumanBodyThoracicVertebraeMeasurements";

/**
 * Sagittal spinal alignment measured between named vertebral endplates.
 *
 * A global trunk bend in an editor pose is a different quantity. Observed supine and standing curvatures are not interchangeable because loading and posture alter spinal alignment; neither scalar creates individual vertebrae.
 *
 * @evidence contracts/common.md#principled-implementation Nonempty spine measurements keep numbered vertebral regions and endplate-defined sagittal angles distinct, preserving acquisition posture in the shared angle schema.
 * @evidence contracts/common.md#clear-and-simple-design Regional collections own bone identities while this spine record owns lumbar/thoracic alignment quantities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored trunk bend, supine curvature and loaded standing alignment are different quantities; scalar angles do not create individual vertebrae.
 * @evidence contracts/common.md#meaningful-documentation Members identify L1-S1 lordosis and T4-T12 kyphosis endplates and the prose warns about posture-dependent interpretation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Spine measurement typing performs no endplate fitting or loaded sagittal alignment solve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The spine schema caches no equivalent curvature readings across different acquisition postures.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Spine quantities own no vertebral surface, endplate image or posture solver resource.
 * @author Samchon
 */
export type IAutoMovieHumanBodySpineMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Seven individually named cervical bones. */
    cervical?: IAutoMovieHumanBodyCervicalVertebraeMeasurements;

    /** Twelve individually named rib-bearing thoracic bones. */
    thoracic?: IAutoMovieHumanBodyThoracicVertebraeMeasurements;

    /** Five individually named lumbar bones. */
    lumbar?: IAutoMovieHumanBodyLumbarVertebraeMeasurements;

    /** Lumbar lordosis angle between superior L1 and superior S1 endplates. */
    lumbarLordosis?: IAutoMovieHumanBodyAnatomicalAngle;

    /** Thoracic kyphosis angle between superior T4 and inferior T12 endplates. */
    thoracicKyphosis?: IAutoMovieHumanBodyAnatomicalAngle;
  }>;
