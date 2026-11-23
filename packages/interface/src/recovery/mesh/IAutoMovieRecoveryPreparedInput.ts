import type {
  IAutoMovieRecoveryInput,
  IAutoMovieRecoveryRegistration,
} from "../../index";

/** Admitted observation input coupled to its declared registration. */
export interface IAutoMovieRecoveryPreparedInput {
  /**
   * Observation wrapper borrowing the registered geometry and policy fields;
   * keep arrays stable during observation.
   */
  observation: IAutoMovieRecoveryInput;

  /**
   * Borrowed frame, evaluated pose and already applied transform; admission
   * performs no coordinate conversion.
   */
  registration: IAutoMovieRecoveryRegistration;
}
