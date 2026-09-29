import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyForearmSurfaceMeasurements } from "./IAutoMovieHumanBodyForearmSurfaceMeasurements";
import type { IAutoMovieHumanBodyHandSurfaceMeasurements } from "./IAutoMovieHumanBodyHandSurfaceMeasurements";
import type { IAutoMovieHumanBodyUpperArmSurfaceMeasurements } from "./IAutoMovieHumanBodyUpperArmSurfaceMeasurements";

/**
 * One arm's independently specified exterior lengths and circumferences.
 *
 * A shoulder-to-elbow or elbow-to-wrist skin landmark distance does not
 * determine humeral or forearm bone length. Upper-arm, forearm and wrist
 * girths condition the exterior separately; they do not specify deltoid,
 * biceps, triceps or subcutaneous-fat volume. Left and right may be targeted
 * or observed independently, because a symmetric mean hides real asymmetry.
 * The hand's named dimensions remain exterior scalars, not finger meshes.
 * @author Samchon
 */
export type IAutoMovieHumanBodyUpperLimbSurfaceMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    upperArm?: IAutoMovieHumanBodyUpperArmSurfaceMeasurements;
    forearm?: IAutoMovieHumanBodyForearmSurfaceMeasurements;
    hand?: IAutoMovieHumanBodyHandSurfaceMeasurements;
  }>;
