import { IAutoMovieTravelMotion } from "./IAutoMovieTravelMotion";

/**
 * One member of a run that travels on a single degree of freedom.
 *
 * The carriage drives a visible element whose own local transform is its rest
 * pose, exactly as a door panel does, so a lift car is placed once and moved by
 * its states rather than being placed again per state. The element is one the
 * run already declares in {@link IAutoMovieBuiltConnector.elements}, or one
 * below it: a car that belongs to no run is a car nobody can point at.
 */
export interface IAutoMovieConnectorCarriage {
  /** Stable carriage identity within the connector. */
  id: string;

  /** Visible element this carriage drives; its transform is the rest pose. */
  element: string;

  /** The one degree of freedom this carriage travels on. */
  motion: IAutoMovieTravelMotion;
}
