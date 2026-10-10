import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyClavicleMeasurements } from "./IAutoMovieHumanBodyClavicleMeasurements";
import type { IAutoMovieHumanBodyDeltoidMeasurements } from "./IAutoMovieHumanBodyDeltoidMeasurements";
import type { IAutoMovieHumanBodyRotatorCuffMeasurements } from "./IAutoMovieHumanBodyRotatorCuffMeasurements";
import type { IAutoMovieHumanBodyScapulaMeasurements } from "./IAutoMovieHumanBodyScapulaMeasurements";

/**
 * One side's shoulder-complex measurements, with independently owned parts.
 *
 * Clavicle and scapula have different thoracic articulations; the upper arm's
 * humerus turns at the glenoid. Deltoid originates here and inserts on that
 * humerus. Pectoralis major belongs to the chest wall and also crosses to the
 * humerus. A single `leftShoulder` rig transform or skin morph cannot be
 * substituted for these components. The authored data are optional direct
 * dimensions/volumes, while geometry, attachments and motion are generated
 * and validated separately.
 *
 * @author Samchon
 */
export type IAutoMovieHumanBodyShoulderMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** This side's clavicle. */
    clavicle?: IAutoMovieHumanBodyClavicleMeasurements;
    /** This side's scapula. */
    scapula?: IAutoMovieHumanBodyScapulaMeasurements;
    /** This side's deltoid belly. */
    deltoid?: IAutoMovieHumanBodyDeltoidMeasurements;
    /** Four scapular rotator-cuff bellies with humeral insertions. */
    rotatorCuff?: IAutoMovieHumanBodyRotatorCuffMeasurements;
  }>;
