import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * One patella embedded in the quadriceps–patellar tendon mechanism.
 *
 * Its posterior articular face slides across the distal femur; a knee joint
 * centre alone cannot place or shape that face through flexion.
 *
 * @author Samchon
 */
export type IAutoMovieHumanBodyPatellaMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Maximum bony medial-to-lateral patellar breadth. */
    breadth?: IAutoMovieHumanBodyAnatomicalLength;

    /** Segmented patella alone, separate from distal femur and cartilage. */
    boneVolume?: IAutoMovieHumanBodyAnatomicalVolume;
  }>;
