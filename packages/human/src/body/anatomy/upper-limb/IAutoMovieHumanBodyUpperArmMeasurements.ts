import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyBicepsBrachiiMeasurements } from "./IAutoMovieHumanBodyBicepsBrachiiMeasurements";
import type { IAutoMovieHumanBodyBrachialisMeasurements } from "./IAutoMovieHumanBodyBrachialisMeasurements";
import type { IAutoMovieHumanBodyHumerusMeasurements } from "./IAutoMovieHumanBodyHumerusMeasurements";
import type { IAutoMovieHumanBodyTricepsBrachiiMeasurements } from "./IAutoMovieHumanBodyTricepsBrachiiMeasurements";

/**
 * One anatomical arm from shoulder to elbow, distinct from its shoulder girdle.
 *
 * The humerus, biceps, brachialis and triceps are owned here while deltoid
 * and pectoralis major attach across the shoulder/chest boundary. Missing
 * internal observations are unknown,
 * never a zero-volume bone or permission to draw a generic tube.
 *
 * @author Samchon
 */
export type IAutoMovieHumanBodyUpperArmMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Same side's humerus and articular head. */
    humerus?: IAutoMovieHumanBodyHumerusMeasurements;
    /** Two-head anterior muscle extending onto proximal radius. */
    bicepsBrachii?: IAutoMovieHumanBodyBicepsBrachiiMeasurements;
    /** Deep anterior elbow flexor separate from biceps. */
    brachialis?: IAutoMovieHumanBodyBrachialisMeasurements;
    /** Three-head posterior elbow extensor inserting on olecranon. */
    tricepsBrachii?: IAutoMovieHumanBodyTricepsBrachiiMeasurements;
  }>;
