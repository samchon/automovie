import type { IAutoMovieConicFieldJet } from "./IAutoMovieConicFieldJet";
import type { IAutoMoviePolarSector } from "./IAutoMoviePolarSector";

/** Data and callback contracts shared by the ConicArcField operations. */
export namespace IAutoMovieConicArcField {
  /** Cartesian point and increasing-polar unit tangent in one quarter chart. */
  export interface IGeometry<T> {
    /** Cartesian point, in the selected quarter chart. */
    point: readonly [T, T];

    /** Unit tangent in increasing original polar direction. */
    tangent: readonly [T, T];
  }

  /** Required fixed-clock source jets, paired with the same primal ray geometry. */
  export interface IReading {
    /** Successful source reading discriminator. */
    kind: "reading";

    /** Two Cartesian source Hessians in source length units. */
    point: readonly [
      IAutoMovieConicFieldJet.IJet,
      IAutoMovieConicFieldJet.IJet,
    ];

    /** Two unit-tangent source gradients. */
    tangent: readonly [
      readonly [number, number, number],
      readonly [number, number, number],
    ];

    /** Existing numeric radial phase jet. */
    radial: IAutoMoviePolarSector.Jet;

    /** Natural logarithm of positive geometric curvature, inverse length. */
    logCurvature: number;
  }

  /** Named source-reading failure, never a replacement derivative. */
  export interface IFailure {
    /** Failed source-reading discriminator. */
    kind: "failure";

    /** Original failed numerical premise. */
    detail: string;
  }
}
