import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyLegSurfaceMeasurementFields } from "./IAutoMovieHumanBodyLegSurfaceMeasurementFields";

/**
 * Exterior dimensions of one anatomical leg between knee and ankle.
 *
 * Calf size includes gastrocnemius, soleus and overlying tissues; the
 * knee-to-ankle skin distance cannot stand in for tibia or fibula length.
 * The knee and ankle girths delimit distinct joints and remain independent.
 * Knee height (ANSUR II 6.4.57) is the midpatella's height above the floor.
 * @author Samchon
 */
export type IAutoMovieHumanBodyLegSurfaceMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<IAutoMovieHumanBodyLegSurfaceMeasurementFields>;
