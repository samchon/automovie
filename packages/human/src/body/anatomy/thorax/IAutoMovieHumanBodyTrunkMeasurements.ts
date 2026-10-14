import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAbdominalAdiposeMeasurements } from "./IAutoMovieHumanBodyAbdominalAdiposeMeasurements";
import type { IAutoMovieHumanBodyBreastMeasurements } from "./IAutoMovieHumanBodyBreastMeasurements";
import type { IAutoMovieHumanBodySpineMeasurements } from "./IAutoMovieHumanBodySpineMeasurements";
import type { IAutoMovieHumanBodyThoracicCageMeasurements } from "./IAutoMovieHumanBodyThoracicCageMeasurements";
import type { IAutoMovieHumanBodyTrunkMusclesMeasurements } from "./IAutoMovieHumanBodyTrunkMusclesMeasurements";

/**
 * Target or observed trunk anatomy above the pelvic girdle.
 *
 * The spine's sagittal curvatures refer to the acquisition posture and must not be confused with an authored joint rotation. Left and right breasts are independent tissue groups over the chest wall; abdominal subcutaneous and visceral adipose are distinct from both. Ribs, vertebrae, abdominal muscles, skin and connective-tissue support still require separately resolved geometry before a visible trunk can be generated. No field here is a triangle or point-level sculpt control.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty trunk tree preserves spine/cage, bilateral breast and muscle groups, and separately bounded abdominal adipose quantities.
 * @evidence contracts/common.md#clear-and-simple-design Each anatomical component owns its measurement schema; the trunk root only composes their anatomical relationships.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Acquisition curvature cannot substitute for pose commands and measured scalar groups cannot bypass independently resolved bone, tissue and support geometry.
 * @evidence contracts/common.md#meaningful-documentation Members state midline and bilateral ownership while the prose distinguishes tissue compartments and excludes point-level sculpt controls.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Trunk anatomy typing performs no tissue generation or posture-dependent spine solve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The anatomical trunk tree has no evaluated multi-tissue construction result to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Composed trunk measurements acquire no internal tissue buffers or body-generation runtime.
 * @author Samchon
 */
export type IAutoMovieHumanBodyTrunkMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Midline vertebral curvatures separate from pose commands. */
    spine?: IAutoMovieHumanBodySpineMeasurements;

    /** Bony ribs and sternum beneath soft tissue and skin. */
    thoracicCage?: IAutoMovieHumanBodyThoracicCageMeasurements;

    /** Tissue of the left breast. */
    leftBreast?: IAutoMovieHumanBodyBreastMeasurements;

    /** Tissue of the right breast, independent of the left. */
    rightBreast?: IAutoMovieHumanBodyBreastMeasurements;

    /** Independent left chest, abdominal and back muscle bellies. */
    leftMuscles?: IAutoMovieHumanBodyTrunkMusclesMeasurements;

    /** Independent right chest, abdominal and back muscle bellies. */
    rightMuscles?: IAutoMovieHumanBodyTrunkMusclesMeasurements;

    /** Subcutaneous and visceral abdominal fat depots. */
    abdominalAdipose?: IAutoMovieHumanBodyAbdominalAdiposeMeasurements;
  }>;
