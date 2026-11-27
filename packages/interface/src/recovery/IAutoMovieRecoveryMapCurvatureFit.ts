import type {
  IAutoMovieRecoveryMapMetric,
  IAutoMovieSimplexAtom,
} from "..";

/** Complete optional factor/row pair or explicit pre-return arithmetic absence. */
export interface IAutoMovieRecoveryMapCurvatureFit {
  /** Complete current numerical metric, or null when unsupported before return. */
  metric: IAutoMovieRecoveryMapMetric | null;

  /** Complete matching whitened original rows, or null on any refusal. */
  rows: IAutoMovieSimplexAtom[] | null;

  /** Latest optional arithmetic stage; null denotes supported numerical use. */
  reason:
    | "local-formation"
    | "point-pivot"
    | "camera-pivot"
    | "row-whitening"
    | null;
}
