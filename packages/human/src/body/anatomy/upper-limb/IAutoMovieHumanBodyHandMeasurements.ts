import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyCarpusMeasurements } from "./IAutoMovieHumanBodyCarpusMeasurements";
import type { IAutoMovieHumanBodyFingerMeasurements } from "./IAutoMovieHumanBodyFingerMeasurements";
import type { IAutoMovieHumanBodyThumbMeasurements } from "./IAutoMovieHumanBodyThumbMeasurements";

/**
 * One hand's wrist and five rays, with thumb's two-phalange distinction.
 *
 * Outer hand length/breadth is kept in the connected-skin measurements;
 * independent bone targets belong here and do not directly sculpt fingers.
 * @author Samchon
 */
export type IAutoMovieHumanBodyHandMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Eight distinct wrist bones. */
    carpus?: IAutoMovieHumanBodyCarpusMeasurements;
    /** First ray with two phalanges. */
    thumb?: IAutoMovieHumanBodyThumbMeasurements;
    /** Second ray. */
    indexFinger?: IAutoMovieHumanBodyFingerMeasurements;
    /** Third ray. */
    middleFinger?: IAutoMovieHumanBodyFingerMeasurements;
    /** Fourth ray. */
    ringFinger?: IAutoMovieHumanBodyFingerMeasurements;
    /** Fifth ray. */
    littleFinger?: IAutoMovieHumanBodyFingerMeasurements;
  }>;
