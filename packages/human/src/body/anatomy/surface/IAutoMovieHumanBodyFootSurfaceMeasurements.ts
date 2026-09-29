import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySurfaceDistance } from "../measurements/IAutoMovieHumanBodySurfaceDistance";

/**
 * One foot's overall skin dimensions from heel to longest toe and across.
 *
 * Foot length and breadth constrain the exterior but cannot locate the
 * calcaneus, metatarsals, arch or toe joints by themselves. Those structures
 * need independent generated geometry and evaluated population inference.
 * @author Samchon
 */
export type IAutoMovieHumanBodyFootSurfaceMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Posterior heel to the most distal toe in a weight-bearing stance. */
    length?: IAutoMovieHumanBodySurfaceDistance;
    /** Greatest mediolateral forefoot span in a weight-bearing stance. */
    breadth?: IAutoMovieHumanBodySurfaceDistance;
  }>;
