import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyFootSurfaceMeasurements } from "./IAutoMovieHumanBodyFootSurfaceMeasurements";
import type { IAutoMovieHumanBodyLegSurfaceMeasurements } from "./IAutoMovieHumanBodyLegSurfaceMeasurements";
import type { IAutoMovieHumanBodyThighSurfaceMeasurements } from "./IAutoMovieHumanBodyThighSurfaceMeasurements";

/**
 * One leg and foot's exterior measurements from defined skin landmarks.
 *
 * Maximum thigh and calf circumferences are distinct from the volumes of
 * quadriceps, hamstrings or triceps surae. A skin hip-to-knee distance does
 * not equal maximum femur length, and a knee-to-ankle distance does not equal
 * tibial length. Length and girth conditions can later be solved against
 * generated skin while bone and tissue remain separately validated outputs.
 * @author Samchon
 */
export type IAutoMovieHumanBodyLowerLimbSurfaceMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    thigh?: IAutoMovieHumanBodyThighSurfaceMeasurements;
    leg?: IAutoMovieHumanBodyLegSurfaceMeasurements;
    foot?: IAutoMovieHumanBodyFootSurfaceMeasurements;
  }>;
