import type { IAutoMoviePoses } from "@automovie/interface";

/** Goal, actual and interval-start poses of one body's collider-relative fit. */
export interface IPhysicalContactTargetSeed {
  /** Goal poses the fit starts from: support, balance or authored. */
  readonly targets: IAutoMoviePoses;
  /** Actual poses, with an authored root replacing the native root. */
  readonly actual: IAutoMoviePoses;
  /** Interval start when no earlier plan of this body continues. */
  readonly initial: IAutoMoviePoses;
}
