import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyCoxalBoneMeasurements } from "./IAutoMovieHumanBodyCoxalBoneMeasurements";
import type { IAutoMovieHumanBodyHipMeasurements } from "./IAutoMovieHumanBodyHipMeasurements";
import type { IAutoMovieHumanBodySacrumMeasurements } from "./IAutoMovieHumanBodySacrumMeasurements";
import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";

/**
 * Target or observed pelvic-girdle dimensions, with one shared sacrum.
 *
 * The sacrum and two coxal bones form the bony group; each pelvic hip region
 * owns gluteal muscles. Its femur belongs to the same-side lower limb. A
 * gluteal origin can refer across this ownership tree to sacrum or coxal
 * bone, and an insertion to femur or fascia. The groups
 * express component identity rather than an instruction to duplicate their
 * geometry. The bilateral femoral-head distance is an internal dimension,
 * not a tape hip girth or the distance between skin landmarks.
 * Optional values remain absent if no target or imaging exists;
 * the generated model must declare whether it has a supported population
 * estimate or cannot resolve that part.
 * @author Samchon
 */
export type IAutoMovieHumanBodyPelvisMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
  interFemoralHeadDistance?: IAutoMovieHumanBodyAnatomicalLength;
  sacrum?: IAutoMovieHumanBodySacrumMeasurements;
  leftCoxalBone?: IAutoMovieHumanBodyCoxalBoneMeasurements;
  rightCoxalBone?: IAutoMovieHumanBodyCoxalBoneMeasurements;
  leftHip?: IAutoMovieHumanBodyHipMeasurements;
  rightHip?: IAutoMovieHumanBodyHipMeasurements;
  }>;
