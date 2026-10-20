import type {
  IAutoMovieRecoveryInput,
  IAutoMovieRecoveryRegistration,
} from "@automovie/interface/recovery";

/**
 * Admitted observation input coupled to its declared registration.
 *
 * @evidence contracts/common.md#principled-implementation The admitted observation combines the original registered vertex and triangle arrays with the supplied extraction policy.
 * @evidence contracts/common.md#clear-and-simple-design Observation receives numerical input while its registration record retains the evaluated pose and applied-transform description.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preparation reports representation admission without certifying component visibility or changing coordinates.
 * @evidence contracts/common.md#meaningful-documentation States that geometry and registration are borrowed and remain stable while observation consumes them.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Data remain caller-owned.
 */
export interface IAutoMovieRecoveryPreparedInput {
  /** Observation wrapper borrowing the registered geometry and policy fields; keep arrays stable during observation. */
  observation: IAutoMovieRecoveryInput;

  /** Borrowed frame, evaluated pose and already applied transform; admission performs no coordinate conversion. */
  registration: IAutoMovieRecoveryRegistration;
}
