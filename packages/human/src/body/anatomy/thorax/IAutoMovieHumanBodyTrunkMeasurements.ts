import type { IAutoMovieHumanBodyAnatomicalAngle } from "../measurements/IAutoMovieHumanBodyAnatomicalAngle";
import type { IAutoMovieHumanBodyAbdominalAdiposeMeasurements } from "./IAutoMovieHumanBodyAbdominalAdiposeMeasurements";
import type { IAutoMovieHumanBodyBreastMeasurements } from "./IAutoMovieHumanBodyBreastMeasurements";
import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";

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
  lumbarLordosis?: IAutoMovieHumanBodyAnatomicalAngle;
  thoracicKyphosis?: IAutoMovieHumanBodyAnatomicalAngle;
  leftBreast?: IAutoMovieHumanBodyBreastMeasurements;
  rightBreast?: IAutoMovieHumanBodyBreastMeasurements;
  abdominalAdipose?: IAutoMovieHumanBodyAbdominalAdiposeMeasurements;
  }>;
