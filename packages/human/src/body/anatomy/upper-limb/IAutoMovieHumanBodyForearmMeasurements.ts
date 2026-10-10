import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyBrachioradialisMeasurements } from "./IAutoMovieHumanBodyBrachioradialisMeasurements";
import type { IAutoMovieHumanBodyExtensorDigitorumMeasurements } from "./IAutoMovieHumanBodyExtensorDigitorumMeasurements";
import type { IAutoMovieHumanBodyFlexorDigitorumSuperficialisMeasurements } from "./IAutoMovieHumanBodyFlexorDigitorumSuperficialisMeasurements";
import type { IAutoMovieHumanBodyRadiusMeasurements } from "./IAutoMovieHumanBodyRadiusMeasurements";
import type { IAutoMovieHumanBodyUlnaMeasurements } from "./IAutoMovieHumanBodyUlnaMeasurements";

/**
 * Two distinct forearm bones and separately named muscle bellies.
 *
 * Radius and ulna must remain separate under pronation/supination. Their
 * combined skin girth cannot determine either bone's length, volume, muscle
 * composition or the orientation of its proximal/distal articulations.
 *
 * @author Samchon
 */
export type IAutoMovieHumanBodyForearmMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Lateral radius on this anatomical side. */
    radius?: IAutoMovieHumanBodyRadiusMeasurements;
    /** Medial ulna carrying the olecranon. */
    ulna?: IAutoMovieHumanBodyUlnaMeasurements;
    /** Lateral elbow-to-radius muscle belly. */
    brachioradialis?: IAutoMovieHumanBodyBrachioradialisMeasurements;
    /** Superficial anterior digital flexor belly. */
    flexorDigitorumSuperficialis?: IAutoMovieHumanBodyFlexorDigitorumSuperficialisMeasurements;
    /** Posterior finger extensor belly. */
    extensorDigitorum?: IAutoMovieHumanBodyExtensorDigitorumMeasurements;
  }>;
