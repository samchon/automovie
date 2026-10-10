import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyInfraspinatusMeasurements } from "./IAutoMovieHumanBodyInfraspinatusMeasurements";
import type { IAutoMovieHumanBodySubscapularisMeasurements } from "./IAutoMovieHumanBodySubscapularisMeasurements";
import type { IAutoMovieHumanBodySupraspinatusMeasurements } from "./IAutoMovieHumanBodySupraspinatusMeasurements";
import type { IAutoMovieHumanBodyTeresMinorMeasurements } from "./IAutoMovieHumanBodyTeresMinorMeasurements";

/**
 * Four distinct scapula-to-humerus rotator cuff bellies around one joint.
 *
 * These muscles stabilize and rotate the humeral head through independent
 * tendon footprints; they cannot be replaced by one shoulder skin bulge.
 *
 * @author Samchon
 */
export type IAutoMovieHumanBodyRotatorCuffMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Superior scapular fossa to greater tubercle. */
    supraspinatus?: IAutoMovieHumanBodySupraspinatusMeasurements;
    /** Posterior scapular fossa to greater tubercle. */
    infraspinatus?: IAutoMovieHumanBodyInfraspinatusMeasurements;
    /** Posterior scapular border to greater tubercle. */
    teresMinor?: IAutoMovieHumanBodyTeresMinorMeasurements;
    /** Anterior scapular fossa to lesser tubercle. */
    subscapularis?: IAutoMovieHumanBodySubscapularisMeasurements;
  }>;
