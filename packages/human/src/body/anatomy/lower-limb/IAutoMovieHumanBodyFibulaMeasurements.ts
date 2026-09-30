import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Target or observed dimensions of one lateral fibula.
 *
 * Its head articulates near the knee and the lateral malleolus bounds the
 * ankle. It is not the tibia's lateral skin contour or an offset copy of the
 * tibial shaft; each side has its own observed bone dimensions.
 * @author Samchon
 */
export type IAutoMovieHumanBodyFibulaMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Osseous head-to-lateral-malleolus length. */
    maximumLength?: IAutoMovieHumanBodyAnatomicalLength;
    /** Segmented fibula alone, separate from tibia and ankle cartilage. */
    boneVolume?: IAutoMovieHumanBodyAnatomicalVolume;
  }>;
