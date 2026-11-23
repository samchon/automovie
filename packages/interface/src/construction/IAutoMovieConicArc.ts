import type { IAutoMoviePolarSector } from "./IAutoMoviePolarSector";

/** Data and callback contracts shared by the ConicArc operations. */
export namespace IAutoMovieConicArc {
  /** One numeric ray location shared with source derivative readers. */
  export interface IRay {
    /** Physical point in the original quarter chart. */
    point: readonly [number, number];

    /** Unit tangent in increasing original polar direction. */
    tangent: readonly [number, number];

    /** Actual radial phase jet. */
    radial: IAutoMoviePolarSector.Jet;

    /** Logarithm of positive geometric curvature. */
    logCurvature: number;

    /** Selected first-half quadratic parameter, or null for a cubic. */
    native: number | null;

    /** Selected cubic log odds, or null at an endpoint or quadratic. */
    clock: number | null;

    /**
     * Explicit endpoint identity; a null clock never implies an interior
     * parameter.
     */
    position: "first" | "interior" | "last";

    /** Selected chart was reflected from the original quarter. */
    reverse: boolean;
  }
}
