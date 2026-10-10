import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Target or observed dimensions of one clavicle between sternum and scapula.
 *
 * Its sternoclavicular and acromioclavicular ends are distinct articular
 * attachments. A rig shoulder slot or one clavicle length cannot reconstruct
 * those ends, its S-shaped shaft or its independent elevation and rotation.
 * This input holds named dimensions only, not a user-authored bone path.
 *
 * @author Samchon
 */
export type IAutoMovieHumanBodyClavicleMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Greatest osseous length of this clavicle, not a skin distance. */
    maximumLength?: IAutoMovieHumanBodyAnatomicalLength;
    /** Segmented clavicle alone, excluding adjacent muscle and cartilage. */
    boneVolume?: IAutoMovieHumanBodyAnatomicalVolume;
  }>;
