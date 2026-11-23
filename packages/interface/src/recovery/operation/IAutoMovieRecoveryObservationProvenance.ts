import type {
  IAutoMovieRecoveryObservedInteriorPoint,
  IAutoMovieRecoveryObservedPoint,
} from "../../index";

/** Closed point-origin choices for a transported geometric observation chart. */
export type IAutoMovieRecoveryObservationProvenance =
  | IAutoMovieRecoveryObservedPoint
  | IAutoMovieRecoveryObservedInteriorPoint;
