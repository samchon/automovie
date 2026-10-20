import { IAutoMovieConnectorCarriage } from "./IAutoMovieConnectorCarriage";
import { IAutoMovieConnectorState } from "./IAutoMovieConnectorState";

/**
 * The moving part of a lift, escalator, moving walk, or turning gate.
 *
 * This is the connector's counterpart to {@link IAutoMovieOpeningOperation},
 * with the same shape: members that travel on one degree of freedom, named
 * states that place every member at once, and the one state the design
 * currently stands in. A run adds where the travel leaves somebody, the space
 * a car stands at, and which way the run is driven.
 *
 * It carries no hardware: a run's landing doors, frames, handles, and call
 * plates are openings in their own right and carry theirs there. Nothing here
 * judges traversal, such as boarding, waiting, or evacuation; this is the
 * measurable configuration such work would read.
 *
 * A connector that declares an operation must list the elements it is built
 * from, because every carriage element has to be one of them or below one.
 *
 * @evidence contracts/common.md#principled-implementation Admission requires complete finite in-range carriage assignments. Service validation checks each claiming state's carriage origins with other operations current; the separate staged gate checks current, alternative and interacting named-state combinations for finite TRS representability within its 1e-8 scaled basis tolerance. It does not repeat service containment for every cross-operation combination or prove continuous trajectories between states.
 * @evidence contracts/common.md#clear-and-simple-design Mirrors the opening operation's members-states-current shape so both feed one displacement table, and leaves doors and hardware on openings so one door is never declared in two places.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An operation with no carriage, no state, or a current state that does not resolve is refused, and alternative states are validated for shear rather than trusting that only the current one is ever staged.
 * @evidence contracts/common.md#meaningful-documentation States what the record carries and leaves to openings, that it judges no traversal, that the connector must list its elements, the at-least-one rules, and what lowering and validation do with the current and other states.
 */
export interface IAutoMovieConnectorOperation {
  /** Travelling cars, carriages, or step bands; at least one. */
  carriages: IAutoMovieConnectorCarriage[];

  /**
   * Named states with unique ids; at least one, and each gives every carriage
   * exactly one value.
   */
  states: IAutoMovieConnectorState[];

  /**
   * The state the design currently stands in; names one of {@link states}.
   *
   * Lowering and placement queries without an override use this state. A placement query's explicit state name applies to every opening/connector declaring that name; other members stay at rest, while a per-member world-matrix selector can choose independently. Every declared connector state still undergoes its own service and hierarchy checks under their stated scope.
   */
  state: string;
}
