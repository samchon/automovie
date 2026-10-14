import { IAutoMovieDrawingStyle } from "@automovie/interface";

/** Unequal line weights, with overhead and hidden roles dashed. */
export const canonicalDrawingStyle: () => IAutoMovieDrawingStyle =
  (): IAutoMovieDrawingStyle => ({
    weights: { cut: 0.5, projected: 0.25, overhead: 0.18, hidden: 0.13 },
    dashes: { cut: [], projected: [], overhead: [3, 1.5], hidden: [1, 1] },
    textHeight: 2.5,
  });
