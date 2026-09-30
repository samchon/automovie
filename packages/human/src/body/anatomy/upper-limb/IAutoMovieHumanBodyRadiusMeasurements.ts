import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Target or observed dimensions of the lateral forearm bone, the radius.
 *
 * Its proximal head turns at the humerus and its distal surface carries the
 * wrist; this bone is independent of the ulna even when an exterior forearm
 * girth is the only user input. Its volume does not specify either joint face.
 * @author Samchon
 */
export type IAutoMovieHumanBodyRadiusMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Whole osseous radius from head to styloid, not skin forearm length. */
    maximumLength?: IAutoMovieHumanBodyAnatomicalLength;
    /** Segmented radius alone, excluding ulna and carpal bones. */
    boneVolume?: IAutoMovieHumanBodyAnatomicalVolume;
  }>;
