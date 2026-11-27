import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieBlendColumn } from "./IAutoMovieBlendColumn";
import type { IAutoMovieConstructionSplit } from "./IAutoMovieConstructionSplit";
import type { IAutoMovieConstructionSplitSeam } from "./IAutoMovieConstructionSplitSeam";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * Borrowed rail inputs and published strips for continuation, split and port
 * bands.
 */
export namespace IAutoMovieConstructionSplitBand {
  /**
   * One side of a band: the face's surface, the rail's station on it and the
   * station's sign into the band's continuation.
   */
  export interface ISide {
    /** The face's surface, mm. */
    surface: IAutoMovieSolidSurface;

    /** The rail's station, mm. */
    station: number;

    /**
     * The station's sign leaving the rail: out of the host into the band, or
     * from the child's rail into the child's kept side.
     */
    into: 1 | -1;

    /**
     * The rail's station at phase psi in radians when the rail is a curve round
     * the face (a port's rails), mm; absent, station at every phase. railAt
     * calls this synchronously without clamping, caching or catching
     * exceptions. Keep the callback and source surface stable during a build.
     */
    along?: (psi: number) => number;
  }

  /** What one band is built from. */
  export interface IInput {
    /** The band's chain name. */
    name: string;

    /** The host side: its surface, its end station, `into` leaving the host. */
    host: IAutoMovieConstructionSplitBand.ISide;

    /** The arc's start and end host phases, radians, increasing. */
    arc: [number, number];

    /** The host end section's unit normal pointing out of the host. */
    normal: AutoMovieVector3Tuple;

    /** The child side: its surface, its rail station, `into` into its kept side. */
    child: IAutoMovieConstructionSplitBand.ISide;

    /** Columns, a multiple of 4 of at least 8. */
    count: number;

    /** The declared crease window, or absent. */
    crease?: IAutoMovieConstructionSplit.ICrease;

    /**
     * The curved seam both bands share and the ribbons' turn at each fork,
     * radians of clock (`IAutoMovieConstructionSplit.IProfile`), or absent for
     * the straight chord.
     */
    seam?: IInputSeam;

    /**
     * How the child's rail is matched to the loop
     * (`IAutoMovieConstructionSplit.IChild.correspondence`); absent, by angle.
     */
    correspondence?: "angle" | "length";
  }

  /** The seam object of {@link IInput}. */
  export type IInputSeam = {
    /**
     * Prepared shared seam used by both adjoining bands, read by arc-length
     * share with millimetre positions.
     */
    curve: IAutoMovieConstructionSplitSeam.ISeam;

    /** Ribbon-turn window at each fork, in radians of the band's loop clock. */
    corner: number;
  };

  /** One built band. */
  export interface IBand extends IAutoMovieConstructionSplitBand.IStrip {
    /** The arc's host phases at columns `0..n/2`, radians. */
    hostPhases: number[];
  }

  /** One built strip from a loop to a child's rail. */
  export interface IStrip {
    /** The strip chain: station 0 the loop, station `length` the child's rail. */
    chain: IAutoMovieLoftChain;

    /** The chain's surface, chart `(station, clock)`. */
    surface: IAutoMovieSolidSurface;

    /** The station span, mm. */
    length: number;

    /**
     * Loop points in world millimetres at the returned mesh columns. The
     * container is copied but its point tuples may alias supplied loop or
     * ribbon data.
     */
    loop: AutoMovieVector3Tuple[];

    /**
     * The child's rail phase at every column, radians, unwrapped along the
     * clock.
     */
    childPhases: number[];

    /**
     * Diagnostics on the strip's construction columns. create may refine these
     * internally then downsample loop/childPhases without downsampling this
     * report.
     */
    scale: IStripScale;

    /**
     * The factor each column's ribbons were scaled by: the common one, or each
     * column's own (`ribbons: "column"`). A port's exact band joins them round
     * the loop (`AutoMovieConstructionPortBand`).
     */
    field: number[];

    /**
     * Each column's ribbon pair as scaled by `field`: the values the chain's
     * two rail layers interpolate.
     */
    columns: IAutoMovieBlendColumn[];

    /**
     * The start surface's outward normal at column 0, the anchor of the chain's
     * orientation.
     */
    outward: AutoMovieVector3Tuple;
  }

  /** The scale object of {@link IStrip}. */
  export type IStripScale = {
    /**
     * Minimum applied dimensionless ribbon scale; common mode uses it
     * everywhere, while column mode has a varying smoothed field.
     */
    applied: number;

    /**
     * Initial monotone factors at or below 1, in forward construction-column
     * order with backward columns omitted. Empty when every column is
     * backward; not the applied scale field.
     */
    columns: number[];

    /**
     * Zero-based construction-column ordinals failing either positive
     * endpoint tangent/chord dot product; these columns remain in the strip
     * without a monotonicity guarantee.
     */
    backward: number[];
  };

  /**
   * One stretch of a band's loop in a split into more than two: a host arc, or
   * a seam read from one of its forks to the other.
   */
  export type IStretch =
    | {
        /**
         * A host-ring arc or a prepared shared seam; stretches are supplied in
         * loop-clock order.
         */
        kind: "arc";

        /** Initial host phase of an arc stretch, radians. */
        from: number;

        /**
         * Terminal host phase of the arc stretch, radians, with the realization
         * owning its intended orientation.
         */
        to: number;

        /**
         * Number of loop-clock intervals assigned to this stretch; all stretch
         * counts sum to the band's column count.
         */
        columns: number;
      }
    | {
        /**
         * A host-ring arc or a prepared shared seam; stretches are supplied in
         * loop-clock order.
         */
        kind: "seam";

        /**
         * Prepared seam joining this stretch's forks, with millimetre geometry
         * and arc-length-share evaluation.
         */
        curve: IAutoMovieConstructionSplitSeam.ISeam;

        /**
         * True traverses the seam from its first end to its second; false
         * reverses that traversal in the band's loop.
         */
        forward: boolean;

        /**
         * Number of loop-clock intervals assigned to this stretch; all stretch
         * counts sum to the band's column count.
         */
        columns: number;
      };

  /** What one band of a split into more than two is built from. */
  export interface IFanInput {
    /** The band's chain name. */
    name: string;

    /** The host side: its surface, its end station, `into` leaving the host. */
    host: IAutoMovieConstructionSplitBand.ISide;

    /** The child side: its surface, its rail station, `into` into its kept side. */
    child: IAutoMovieConstructionSplitBand.ISide;

    /**
     * Stretches in loop-clock order, starting with an arc; seam layouts
     * alternate arcs and seams, while a bridge may use one full-ring arc. Their
     * positive integral interval counts must sum to the requested count.
     */
    stretches: IAutoMovieConstructionSplitBand.IStretch[];

    /** The ribbons' turn at each fork, radians of clock. */
    corner: number;

    /** The declared crease window, or absent. */
    crease?: IAutoMovieConstructionSplit.ICrease;

    /**
     * How the child's rail is matched to the loop
     * (IAutoMovieConstructionSplit.IChild.correspondence); absent, by angle.
     */
    correspondence?: "angle" | "length";

    /**
     * The share of its length a ribbon keeps at a fork
     * (`IAutoMovieConstructionSplit.IProfile.reach`), in `(0, 1]`; absent, 1.
     */
    reach?: number;

    /**
     * Whether the bands leave the host's arc square to its end ring
     * (`IAutoMovieConstructionSplit.IProfile.square`); absent, along its
     * station line.
     */
    square?: boolean;
  }
}
