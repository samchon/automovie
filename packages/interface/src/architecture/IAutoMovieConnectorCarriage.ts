import type { IAutoMovieTravelMotion } from "./IAutoMovieTravelMotion";

/**
 * One member of a run that travels on a single degree of freedom.
 *
 * The carriage drives a visible element whose own local transform is its rest
 * pose, as a door panel does, so a lift car is placed once and moved by its
 * states rather than placed again per state. The element is one the run
 * declares in {@link IAutoMovieBuiltConnector.elements}, or one below it, so
 * every car belongs to a run that can be pointed at.
 *
 * An element may be driven by only one carriage or panel in the whole work,
 * because every moving member writes its displacement into one shared table.
 */
export interface IAutoMovieConnectorCarriage {
  /** Stable carriage identity, unique within the connector's operation. */
  id: string;

  /**
   * Visible element this carriage drives; it must resolve, and its own local
   * transform is the rest pose.
   */
  element: string;

  /** The one degree of freedom this carriage travels on. */
  motion: IAutoMovieTravelMotion;
}
