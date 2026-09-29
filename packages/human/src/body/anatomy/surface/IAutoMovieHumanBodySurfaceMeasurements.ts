import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyMass } from "../measurements/IAutoMovieHumanBodyMass";
import type { IAutoMovieHumanBodyStandingStature } from "../measurements/IAutoMovieHumanBodyStandingStature";
import type { IAutoMovieHumanBodyLowerLimbSurfaceMeasurements } from "./IAutoMovieHumanBodyLowerLimbSurfaceMeasurements";
import type { IAutoMovieHumanBodyTrunkSurfaceMeasurements } from "./IAutoMovieHumanBodyTrunkSurfaceMeasurements";
import type { IAutoMovieHumanBodyUpperLimbSurfaceMeasurements } from "./IAutoMovieHumanBodyUpperLimbSurfaceMeasurements";

/**
 * The editor's desired or observed anthropometric dimensions.
 *
 * Existing simple stature, mass and six symmetric girths can enter as
 * `target` values. Its shoulder-joint distance is not the biacromial skin
 * breadth defined here. A detailed editor can preserve real left/right
 * asymmetry and
 * additional named measures. No property denotes a mesh vertex, spline
 * control point or arbitrary deformation weight. A missing value is
 * unknown; population inference must carry its source and validation. A
 * fictional target never claims a stadiometer, scan or clinical observation.
 * @author Samchon
 */
export type IAutoMovieHumanBodySurfaceMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    stature?: IAutoMovieHumanBodyStandingStature;
    mass?: IAutoMovieHumanBodyMass;
    trunk?: IAutoMovieHumanBodyTrunkSurfaceMeasurements;
    leftUpperLimb?: IAutoMovieHumanBodyUpperLimbSurfaceMeasurements;
    rightUpperLimb?: IAutoMovieHumanBodyUpperLimbSurfaceMeasurements;
    leftLowerLimb?: IAutoMovieHumanBodyLowerLimbSurfaceMeasurements;
    rightLowerLimb?: IAutoMovieHumanBodyLowerLimbSurfaceMeasurements;
  }>;
