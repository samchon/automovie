import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** A continuous query over two capsules with explicitly supplied motion. */
export namespace IAutoMovieSweptCapsuleCollision {
  /**
   * One constant-radius capsule with affine endpoint motion over the admitted
   * interval.
   */
  export interface ISpan {
    /** Segment's first endpoint at interval start, world metres. */
    a0: IAutoMovieVector3;
    /** Segment's second endpoint at interval start, world metres. */
    b0: IAutoMovieVector3;
    /** Segment's first endpoint at interval end, world metres. */
    a1: IAutoMovieVector3;
    /** Segment's second endpoint at interval end, world metres. */
    b1: IAutoMovieVector3;
    /**
     * Positive world radius in metres. A degenerate segment can describe a
     * sphere.
     */
    radius: number;
    /** The source's authority for the supplied solid over this interval. */
    basis: "displayed" | "proxy";
  }

  /** One pair of spans read on the same uninterrupted source clock. */
  export interface IProps {
    /** First capsule or null when the source cannot certify this motion. */
    first: ISpan | null;
    /** Second capsule or null when the source cannot certify this motion. */
    second: ISpan | null;
    /** Inclusive start, layer-local seconds. */
    startSeconds: number;
    /** Inclusive end, strictly later than start, on the same clock. */
    endSeconds: number;
    /** Nonnegative depth allowed throughout this interval. */
    maxPenetration: number;
    /** Maximum intervals whose bound and optional centre sample can be examined. */
    maxIntervals: number;
  }

  /** A deterministic result for the supplied geometry and work budget. */
  export type IResult =
    | {
        /**
         * A bound proves the permitted depth holds over every elementary
         * interval.
         */
        status: "clear";
        /**
         * Whether every participating capsule describes the actual displayed
         * solid.
         */
        basis: "displayed" | "proxy";
        /** Intervals examined. */
        compared: number;
      }
    | {
        /** One sampled violation within a checked interval. */
        status: "confirmed" | "proxy";
        /** Seconds of the actual sample, on the input clock. */
        seconds: number;
        /** Enclosing interval start on the input clock. */
        startSeconds: number;
        /** Enclosing interval end on the input clock. */
        endSeconds: number;
        /**
         * Measured distance between the chosen axis points, less the two radii,
         * in metres.
         */
        separation: number;
        /**
         * World-metre contact witness between the axis points, weighted by the
         * two radii.
         */
        point: IAutoMovieVector3;
        /** Intervals examined before finding the sample. */
        compared: number;
      }
    | {
        /** The complete interval lacks a proof. */
        status: "deferred";
        /** Why remaining coverage could not be established. */
        reason: "unsupported-motion" | "budget" | "precision";
        /** Intervals examined before deferral. */
        compared: number;
      };
}
