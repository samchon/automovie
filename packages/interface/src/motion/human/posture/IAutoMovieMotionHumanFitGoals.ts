import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";

/**
 * Included angles and a centre-of-mass position in the whole-body fit. These
 * are relationships of the displayed body, rather than a bone moved as a
 * substitute for them. The sprint set needs its knee, hip and centre
 * constrained together with its four supports.
 */
export namespace IAutoMovieMotionHumanFitGoals {
  /**
   * An unsigned included angle or closed angle interval, strictly between zero
   * and 180 degrees. A solve needs a noncollinear starting configuration for
   * its analytic derivative; collinear or coincident rays are reported
   * explicitly.
   */
  export interface IAngle {
    /** First endpoint, vertex, second endpoint. */
    points: readonly [
      IAutoMovieMotionHumanFitGoals.Landmark,
      IAutoMovieMotionHumanFitGoals.Landmark,
      IAutoMovieMotionHumanFitGoals.Landmark,
    ];
    /** Desired included angle or ordered inclusive bounds, degrees in (0, 180). */
    degrees: number | readonly [number, number];
    /** Price per milliradian missed; the fit's price when absent. */
    price?: number;
  }

  /**
   * The arithmetic mean of one or more bone-carried points: a joint or, for
   * example, the midpoint of the two shoulders.
   */
  export type Landmark = readonly [
    IAutoMovieMotionHumanFitGoals.IPoint,
    ...IAutoMovieMotionHumanFitGoals.IPoint[],
  ];

  /** One point carried by a bone. */
  export interface IPoint {
    /** The bone carrying the point. */
    bone: AutoMovieHumanoidBone;
    /** Metres in that bone's frame; its origin when absent. */
    point?: IAutoMovieVector3;
  }

  /** A world position of the body's segmental centre of mass. */
  export interface ICentre {
    /** Desired world metres, finite on every axis. */
    point: IAutoMovieVector3;
    /**
     * Projection axes held: world axes or finite nonzero world directions,
     * normalized by the reading; all three world axes when absent.
     */
    axes?: readonly ("x" | "y" | "z" | IAutoMovieVector3)[];
    /** Price per millimetre missed; the fit's price when absent. */
    price?: number;
  }
}
