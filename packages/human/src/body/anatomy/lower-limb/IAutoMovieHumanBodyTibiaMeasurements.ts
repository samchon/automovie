import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Target or observed dimensions of one weight-bearing tibia.
 *
 * The proximal tibial plateau belongs to the knee and the distal plafond to
 * the ankle. Neither articular shape follows from leg length or calf girth;
 * the fibula remains a different bone sharing those joints.
 * @author Samchon
 */
export type IAutoMovieHumanBodyTibiaMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Maximum bony tibial length rather than knee-to-ankle skin distance. */
    maximumLength?: IAutoMovieHumanBodyAnatomicalLength;
    /** Segmented tibia alone, excluding fibula and patella. */
    boneVolume?: IAutoMovieHumanBodyAnatomicalVolume;
  }>;
