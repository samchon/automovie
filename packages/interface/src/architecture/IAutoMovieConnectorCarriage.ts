import { IAutoMovieTravelMotion } from "./IAutoMovieTravelMotion";

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
 *
 * @evidence contracts/common.md#principled-implementation A carriage is a joint: its state value becomes a rigid displacement composed after the element's own local transform, so it rides down the element hierarchy exactly like an opening panel's travel and needs no second placement per state.
 * @evidence contracts/common.md#clear-and-simple-design Identity, driven element, and motion are the whole record; the travel per state lives on `IAutoMovieCarriageValue` and the run membership on the connector, so the carriage repeats neither.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An element already driven by another carriage or panel is refused by name instead of letting the later member overwrite the shared displacement, and an element outside the run's declared elements is refused.
 * @evidence contracts/common.md#meaningful-documentation States that the element's transform is the rest pose, which elements a carriage may drive, the one-driver-per-element rule and its reason, and the scope of the id's uniqueness.
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
