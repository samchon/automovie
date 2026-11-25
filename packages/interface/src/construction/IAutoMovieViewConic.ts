import type { IAutoMovieConicArc } from "./IAutoMovieConicArc";
import type { IAutoMovieConicHermite } from "./IAutoMovieConicHermite";

/** Data and callback contracts shared by the ViewConic operations. */
export namespace IAutoMovieViewConic {
  /** Selected quarter location, preserving the source's actual numeric clock. */
  export interface IRay extends IAutoMovieConicArc.IRay {
    /** Original quarter index in[0,3]. */
    quarter: number;

    /** Actual selected source piece. */
    kind: "conic" | "start" | "end";

    /** Original quarter-local polar angle, radians. */
    angle: number;

    /** Small angular distance in the selected end chart, radians. */
    distance: number;
  }

  /** One source quarter and its disjoint initial/final C2 supports. */
  export interface IQuarter<T = number> {
    /** First and second positive half extents, millimetres. */
    extents: readonly [T, T];

    /** Original conic shoulder in (0,1). */
    shoulder: T;

    /** Optional initial convex G2 end; null preserves the exact quadratic. */
    start: IAutoMovieConicHermite.IPatch<T> | null;

    /** Optional reflected final convex G2 end, with the same ownership. */
    end: IAutoMovieConicHermite.IPatch<T> | null;

    /**
     * Original quadratic native-turn partition in create; empty in
     * geometry-only prepareGeometry.
     */
    parameters: readonly number[];

    /**
     * Shared radial second derivatives at the two zero-slope main guides,
     * millimetres.
     */
    guides: readonly [T, T];

    /**
     * Shared geometric guide curvatures; auxiliary branch jets at a tie are not
     * derivatives of min.
     */
    curvatures: readonly [T, T];
  }

  /** Prepared closed source with an explicit admission failure state. */
  export interface ICurve<T = number> {
    /** Four source quarters on success; empty on admission failure. */
    quarters: readonly IAutoMovieViewConic.IQuarter<T>[];

    /** Original admission rule and numbers, or null. */
    failure: string | null;
  }
}
