import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyTrunkSurfaceMeasurementFields } from "./IAutoMovieHumanBodyTrunkSurfaceMeasurementFields";

/**
 * Target or observed exterior chest, waist and buttock dimensions, with hip
 * breadth (ANSUR II 6.4.51) and buttock depth (6.4.18) at the pelvis.
 *
 * Each landmark must be reproduced by the same named measurement on the
 * generated standing skin. A bust girth includes overlying breast tissue;
 * neither it nor a waist or buttock girth measures the internal organ, muscle
 * or adipose volumes. These are independent conditions, not a request to
 * move selected skin vertices until a preferred silhouette appears.
 * @author Samchon
 */
export type IAutoMovieHumanBodyTrunkSurfaceMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<IAutoMovieHumanBodyTrunkSurfaceMeasurementFields>;
