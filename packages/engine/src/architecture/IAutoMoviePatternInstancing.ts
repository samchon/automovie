import { IAutoMovieExplicitInstanceTransform } from "@automovie/interface";

/** Explicit instance slots and the occurrences that cannot become one. */
export interface IAutoMoviePatternInstancing {
  /** One exact full-TRS slot per whole occurrence, in placement order. */
  transforms: IAutoMovieExplicitInstanceTransform[];
  /** Occurrence ids that were cut and therefore need their own geometry. */
  cut: string[];
}
