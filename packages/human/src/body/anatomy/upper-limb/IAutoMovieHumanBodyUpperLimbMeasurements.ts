import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyShoulderMeasurements } from "../shoulder/IAutoMovieHumanBodyShoulderMeasurements";
import type { IAutoMovieHumanBodyForearmMeasurements } from "./IAutoMovieHumanBodyForearmMeasurements";
import type { IAutoMovieHumanBodyHandMeasurements } from "./IAutoMovieHumanBodyHandMeasurements";
import type { IAutoMovieHumanBodyUpperArmMeasurements } from "./IAutoMovieHumanBodyUpperArmMeasurements";

/**
 * One upper limb's nested shoulder girdle, arm and forearm anatomy.
 *
 * The shoulder owns clavicle, scapula and deltoid; the arm owns humerus;
 * the forearm owns radius and ulna. Cross-group attachments and joints are
 * typed separately instead of duplicating a bone in each adjacent region.
 * The hand owns carpal bones and digit rays; its exterior dimensions remain
 * in the one connected skin observation.
 * @author Samchon
 */
export type IAutoMovieHumanBodyUpperLimbMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Clavicle, scapula and deltoid of this side. */
    shoulder?: IAutoMovieHumanBodyShoulderMeasurements;
    /** Humerus and arm tissues of this side. */
    upperArm?: IAutoMovieHumanBodyUpperArmMeasurements;
    /** Separate radius and ulna of this side. */
    forearm?: IAutoMovieHumanBodyForearmMeasurements;
    /** Wrist and five independently measured hand rays. */
    hand?: IAutoMovieHumanBodyHandMeasurements;
  }>;
