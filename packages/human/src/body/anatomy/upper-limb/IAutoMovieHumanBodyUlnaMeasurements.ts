import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Target or observed dimensions of the medial forearm bone, the ulna.
 *
 * Its olecranon contributes to the elbow, while the radius rotates relative
 * to it during pronation and supination. A single forearm cylinder cannot
 * replace the two-bone relationship or reveal the olecranon from skin girth.
 *
 * @author Samchon
 */
export type IAutoMovieHumanBodyUlnaMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Olecranon-to-styloid osseous extent, not a surface tape length. */
    maximumLength?: IAutoMovieHumanBodyAnatomicalLength;
    /** Segmented ulna alone, excluding radius and elbow cartilage. */
    boneVolume?: IAutoMovieHumanBodyAnatomicalVolume;
  }>;
