import { IAutoMovieTravelMotion } from "./IAutoMovieTravelMotion";

/**
 * One member of a run that travels on a single degree of freedom.
 *
 * The carriage drives a visible element whose own local transform is its rest
 * pose, exactly as a door panel does, so a lift car is placed once and moved by
 * its states rather than being placed again per state. The element is one the
 * run already declares in {@link IAutoMovieBuiltConnector.elements}, or one
 * below it: a car that belongs to no run is a car nobody can point at.
 *
 * An element may be driven by only one carriage or panel in the whole work,
 * because every moving member writes its displacement into one shared table.
 *
 * @evidence contracts/common.md#principled-implementation A carriage applies one revolute or prismatic displacement after its element's rest transform, so the travel rides down the element hierarchy to anything parented below the car.
 * @evidence contracts/common.md#clear-and-simple-design The rest pose stays the element's own transform and states only add a displacement, so a lift car is placed once and each state is a number rather than a second placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A second carriage or panel driving the same element is refused rather than letting the later displacement overwrite the earlier one, and a carriage element outside the run's elements is refused.
 * @evidence contracts/common.md#meaningful-documentation States which elements a carriage may drive, that one element has one driver, the rest-pose meaning, and the single degree of freedom.
 */
export interface IAutoMovieConnectorCarriage {
  /** Stable carriage identity within the connector. */
  id: string;

  /** Visible element this carriage drives; its transform is the rest pose. */
  element: string;

  /** The one degree of freedom this carriage travels on. */
  motion: IAutoMovieTravelMotion;
}
