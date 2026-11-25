import type {
  IAutoMovieRecoveryObservationTransportRefused,
  IAutoMovieRecoveryObservationTransported,
} from "../../index";

/** Closed admitted or refused outcomes of geometric observation-chart transport. */
export type IAutoMovieRecoveryObservationTransport =
  | IAutoMovieRecoveryObservationTransportRefused
  | IAutoMovieRecoveryObservationTransported;
