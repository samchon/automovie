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
 *
 * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-interior-consistency Exposes `IAutoMovieConnectorOperation` as the portable data boundary for the building opening interior consistency requirement.
 * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-host-opening-operation Types `IAutoMovieConnectorOperation` for the interior space host opening operation system contract.
 */
export interface IAutoMovieConnectorOperation {
  /**
   * Travelling cars, carriages, or step bands; at least one.
   *
   * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-interior-consistency Exposes `carriages` as the portable data boundary for the building opening interior consistency requirement.
   * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-host-opening-operation Types `carriages` for the interior space host opening operation system contract.
   */
  carriages: IAutoMovieConnectorCarriage[];

  /**
   * Named states; at least one, and each gives every carriage a value.
   *
   * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-interior-consistency Exposes `states` as the portable data boundary for the building opening interior consistency requirement.
   * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-host-opening-operation Types `states` for the interior space host opening operation system contract.
   */
  states: IAutoMovieConnectorState[];

  /**
   * The state the design currently stands in; names one of {@link states}.
   *
   * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-interior-consistency Exposes `state` as the portable data boundary for the building opening interior consistency requirement.
   * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-host-opening-operation Types `state` for the interior space host opening operation system contract.
   */
  state: string;
}
