import { IAutoMovieConnectorCarriage } from "./IAutoMovieConnectorCarriage";
import { IAutoMovieConnectorState } from "./IAutoMovieConnectorState";

/**
 * The moving part of a lift, escalator, moving walk, or turning gate.
 *
 * This is the connector's counterpart to {@link IAutoMovieOpeningOperation}, and
 * deliberately the same shape: a member that travels on one degree of freedom,
 * named states that place every member at once, and the one state the design
 * currently stands in. What a run adds is where the travel leaves somebody —
 * the space a car stands at, and which way the run is driven — since that is
 * the part a stair answers by standing still and a lift cannot.
 *
 * What it does not carry is hardware, because a run's landing doors and their
 * frames, handles, and call plates are openings in their own right and already
 * carry theirs. Restating them here would put one door in two places.
 *
 * Nothing here judges traversal. Whether a person can board, how long they
 * wait, and how a building empties are separate work; this is the measurable
 * configuration such work would read.
 */
export interface IAutoMovieConnectorOperation {
  /** Travelling cars, carriages, or step bands; at least one. */
  carriages: IAutoMovieConnectorCarriage[];

  /** Named states; at least one, and each gives every carriage a value. */
  states: IAutoMovieConnectorState[];

  /** The state the design currently stands in; names one of {@link states}. */
  state: string;
}
