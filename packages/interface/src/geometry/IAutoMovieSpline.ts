/** Data and callback contracts shared by the Spline operations. */
export namespace IAutoMovieSpline {
  /**
   * Caller-owned writable numeric storage used synchronously by
   * AutoMovieEngineSpline.fit; the member contract states its capacity and meaning.
   */
  export type IFitM = { [index: number]: number };

  /**
   * Caller-owned writable numeric storage used synchronously by
   * AutoMovieEngineSpline.fit; the member contract states its capacity and meaning.
   */
  export type IFitScratch = { [index: number]: number };
}
