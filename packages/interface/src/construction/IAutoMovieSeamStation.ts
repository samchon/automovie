/** Data and callback contracts shared by the SeamStation operations. */
export namespace IAutoMovieSeamStation {
  /** A shared layer's copied section/plane values and station derivatives. */
  export interface ICopy {
    /** The owner's coefficients. */
    coefficients: number[];

    /**
     * The owner's plane as nine numbers `[origin, u, v]`; horizontal at its
     * station when the owner's layer has no frame.
     */
    plane: number[];

    /** Station slopes, signed into the neighbour's direction. */
    slopes: number[];

    /** Second station derivatives; the sign squared leaves them as they are. */
    curvatures: number[];

    /** The plane's station slopes, signed. */
    frameSlopes: number[];

    /** The plane's second station derivatives. */
    frameCurvatures: number[];
  }
}
