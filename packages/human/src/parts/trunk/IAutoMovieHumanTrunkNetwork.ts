import { IAutoMovieSurfaceNetwork } from "@automovie/engine";

import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";

/**
 * The trunk's surface network before it is sampled, with the shapes of the junction rings its cage reports.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanTrunkNetwork {
  /** The network, in metres. */
  value: IAutoMovieSurfaceNetwork;

  /** Torso sweep and upper curve patches' fixed rectangles in the trunk chart. */
  charts: Record<string, { u: [number, number]; v: [number, number] }>;

  /** Each junction ring the cage reports, by the network ring's name, with the shape the neighbouring part shares. */
  shapes: Array<{ ring: string; shape: IAutoMovieHumanRingShape }>;
}
