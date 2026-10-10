import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyBicepsFemorisLongHeadMeasurements } from "./IAutoMovieHumanBodyBicepsFemorisLongHeadMeasurements";
import type { IAutoMovieHumanBodyBicepsFemorisShortHeadMeasurements } from "./IAutoMovieHumanBodyBicepsFemorisShortHeadMeasurements";
import type { IAutoMovieHumanBodySemimembranosusMeasurements } from "./IAutoMovieHumanBodySemimembranosusMeasurements";
import type { IAutoMovieHumanBodySemitendinosusMeasurements } from "./IAutoMovieHumanBodySemitendinosusMeasurements";

/**
 * Posterior thigh bellies with distinct pelvic/femoral origins and knee insertions.
 *
 * @author Samchon
 */
export type IAutoMovieHumanBodyHamstringsMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Pelvis-origin long head of biceps femoris. */
    bicepsFemorisLongHead?: IAutoMovieHumanBodyBicepsFemorisLongHeadMeasurements;

    /** Femur-origin short head, separate from the long head. */
    bicepsFemorisShortHead?: IAutoMovieHumanBodyBicepsFemorisShortHeadMeasurements;

    /** Superficial medial hamstring. */
    semitendinosus?: IAutoMovieHumanBodySemitendinosusMeasurements;

    /** Deep medial hamstring. */
    semimembranosus?: IAutoMovieHumanBodySemimembranosusMeasurements;
  }>;
