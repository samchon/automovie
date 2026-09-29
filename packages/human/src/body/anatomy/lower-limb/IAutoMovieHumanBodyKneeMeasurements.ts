import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyPatellaMeasurements } from "./IAutoMovieHumanBodyPatellaMeasurements";

/**
 * Regional knee observations for the patella and its moving articulation.
 *
 * Femoral condyles and tibial plateau remain owned by their respective long
 * bones; the knee relates them and does not copy those bone surfaces.
 * @author Samchon
 */
export type IAutoMovieHumanBodyKneeMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Separate sesamoid bone anterior to the distal femoral condyles. */
    patella?: IAutoMovieHumanBodyPatellaMeasurements;
  }>;
