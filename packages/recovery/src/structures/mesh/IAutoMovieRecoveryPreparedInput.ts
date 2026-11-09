import type {
  IAutoMovieRecoveryInput,
  IAutoMovieRecoveryRegistration,
} from "@automovie/interface";

/**
 * Admitted observation input coupled to its declared registration.
 *
 * @evidence contracts/development/design.md#principled-representation The admitted observation combines the original registered vertex and triangle arrays with the supplied extraction policy.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Observation receives numerical input while its registration record retains the evaluated pose and applied-transform description.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Preparation reports representation admission without certifying component visibility or changing coordinates.
 * @evidence contracts/development/common.md#meaningful-documentation States that geometry and registration are borrowed and remain stable while observation consumes them.
 */
export interface IAutoMovieRecoveryPreparedInput {
  /** Observation wrapper borrowing the registered geometry and policy fields; keep arrays stable during observation. */
  observation: IAutoMovieRecoveryInput;

  /** Borrowed frame, evaluated pose and already applied transform; admission performs no coordinate conversion. */
  registration: IAutoMovieRecoveryRegistration;
}
