import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryChartLeafControls,
  IAutoMovieRecoveryChartLeafFit,
} from "../../index";

/** Prepare fixed outer collar coefficients from the original boundary cubics. */

export namespace IAutoMovieRecoveryChartLeafBoundaryPreparationOperation {
  /** Prepare fixed outer collar coefficients from the original boundary cubics. */

  export type Operation = (
    input: IAutoMovieRecoveryChartLeafFit.Input,
    registry: ReturnType<IAutoMovieRecoveryChartLeafControls.Operation>,
  ) => (Readonly<AutoMovieVector3Tuple> | null)[];
}
