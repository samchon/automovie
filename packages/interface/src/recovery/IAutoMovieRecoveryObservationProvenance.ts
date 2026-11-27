import type {
  IAutoMovieRecoveryObservedInteriorPoint,
  IAutoMovieRecoveryObservedPoint,
} from "..";

/** Closed point-origin choices for a transported geometric observation chart. */
export type IAutoMovieRecoveryObservationProvenance =
  | IAutoMovieRecoveryObservedPoint
  | IAutoMovieRecoveryObservedInteriorPoint;
