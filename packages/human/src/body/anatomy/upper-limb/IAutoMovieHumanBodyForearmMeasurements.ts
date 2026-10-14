import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyBrachioradialisMeasurements } from "./IAutoMovieHumanBodyBrachioradialisMeasurements";
import type { IAutoMovieHumanBodyExtensorDigitorumMeasurements } from "./IAutoMovieHumanBodyExtensorDigitorumMeasurements";
import type { IAutoMovieHumanBodyFlexorDigitorumSuperficialisMeasurements } from "./IAutoMovieHumanBodyFlexorDigitorumSuperficialisMeasurements";
import type { IAutoMovieHumanBodyRadiusMeasurements } from "./IAutoMovieHumanBodyRadiusMeasurements";
import type { IAutoMovieHumanBodyUlnaMeasurements } from "./IAutoMovieHumanBodyUlnaMeasurements";

/**
 * Two distinct forearm bones and separately named muscle bellies.
 *
 * Radius and ulna must remain separate under pronation/supination. Their combined skin girth cannot determine either bone's length, volume, muscle composition or the orientation of its proximal/distal articulations.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty same-side forearm tree independently owns radius, ulna and three named muscle bellies under their measurement schemas.
 * @evidence contracts/common.md#clear-and-simple-design Bone and muscle owners define quantities while this region composes anatomically distinct components.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Combined skin girth cannot supply either bone's shape/articulations or merge radius and ulna during pronation/supination.
 * @evidence contracts/common.md#meaningful-documentation Members identify lateral/medial bones and anterior/posterior muscles while prose states unresolved geometry and composition limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Forearm composition typing performs no pronation/supination solve or compartment-volume inference.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This anatomical grouping stores no equivalent radius/ulna articulation evaluation across poses.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Forearm component inputs retain no paired-bone mesh or muscle-generation resource.
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
