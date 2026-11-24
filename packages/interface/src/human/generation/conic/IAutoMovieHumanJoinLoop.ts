import type { IAutoMovieHumanLandmarkSurface } from "./IAutoMovieHumanLandmarkSurface";
import type { IAutoMovieConstructionPortLoop } from "../../../construction/IAutoMovieConstructionPortLoop";

/**
 * The shared contact where an attached Human part meets its host.
 */
export namespace IAutoMovieHumanJoinLoop {
  /** The independently registered material support and a finite radial bound for its intersection with a landmark divider. */
  export interface IRegisteredOwner {
    (point: readonly number[], closure?: boolean): boolean;
    /** Upper bound in figure mm from the divider origin, using the actual final course tube and the divider's normal slab. */
    extent: (divider: IAutoMovieHumanLandmarkSurface.ISurface) => number;
  }

  /**
   * The actual preimages of each original port column and optionally its held midpoint.
   */
  export type IObserve = ((host: [number, number], child: [number, number]) => void) & {
    /** The original port clock in radians and the two corrected source preimages. */
    held?: (clock: number, host: [number, number], child: [number, number]) => void;
  };

  /**
   * Report a measured world-space separation at one ordinary or held clock on the authored and reflected attachment.
   */
  export type IMeasure = (name: string, clock: number, held: boolean, gapMm: number, mirroredGapMm: number) => void;

  /**
   * A prepared shared loop, point seed and observed gap.
   */
  export interface IContact {
    /** The shared loop on the host's chart, sampling its declared clock. */
    loop: IAutoMovieConstructionPortLoop;

    /** The part's point seed as [station, phase] in metres and radians. */
    part: [number, number];

    /** The host's point seed as [station, phase] in metres and radians. */
    host: [number, number];

    /**
     * Distance between the skins in millimetres. The part-phase and transverse readers report their sampled maximum,
     * while the host-field reader reports the gap measured at its seed.
     */
    gap: number;

    /** Sampled part-course stations in millimetres, in the producer's trace order. Empty for the host-field reader. */
    stations: number[];
  }
}
