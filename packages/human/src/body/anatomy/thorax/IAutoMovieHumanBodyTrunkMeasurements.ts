import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAbdominalAdiposeMeasurements } from "./IAutoMovieHumanBodyAbdominalAdiposeMeasurements";
import type { IAutoMovieHumanBodyBreastMeasurements } from "./IAutoMovieHumanBodyBreastMeasurements";
import type { IAutoMovieHumanBodySpineMeasurements } from "./IAutoMovieHumanBodySpineMeasurements";
import type { IAutoMovieHumanBodyThoracicCageMeasurements } from "./IAutoMovieHumanBodyThoracicCageMeasurements";
import type { IAutoMovieHumanBodyTrunkMusclesMeasurements } from "./IAutoMovieHumanBodyTrunkMusclesMeasurements";

/**
 * Target or observed trunk anatomy above the pelvic girdle.
 *
 * The spine's sagittal curvatures refer to the acquisition posture and must
 * not be confused with an authored joint rotation. Left and right breasts
 * are independent tissue groups over the chest wall; abdominal subcutaneous
 * and visceral adipose are distinct from both. Ribs, vertebrae, abdominal
 * muscles, skin and connective-tissue support still require separately
 * resolved geometry before a visible trunk can be generated. No field here
 * is a triangle or point-level sculpt control.
 * @author Samchon
 */
export type IAutoMovieHumanBodyTrunkMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Midline vertebral curvatures separate from pose commands. */
    spine?: IAutoMovieHumanBodySpineMeasurements;
    /** Bony ribs and sternum beneath soft tissue and skin. */
    thoracicCage?: IAutoMovieHumanBodyThoracicCageMeasurements;
    leftBreast?: IAutoMovieHumanBodyBreastMeasurements;
    rightBreast?: IAutoMovieHumanBodyBreastMeasurements;
    /** Independent left chest, abdominal and back muscle bellies. */
    leftMuscles?: IAutoMovieHumanBodyTrunkMusclesMeasurements;
    /** Independent right chest, abdominal and back muscle bellies. */
    rightMuscles?: IAutoMovieHumanBodyTrunkMusclesMeasurements;
    abdominalAdipose?: IAutoMovieHumanBodyAbdominalAdiposeMeasurements;
  }>;
