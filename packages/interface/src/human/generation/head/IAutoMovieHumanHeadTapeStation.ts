import type { IAutoMovieLoftSectionFrame } from "../../../construction/IAutoMovieLoftSectionFrame";
import type { IAutoMovieLoftSectionPhase } from "../../../construction/IAutoMovieLoftSectionPhase";
import type { IAutoMovieLoftViewRead } from "../../../construction/IAutoMovieLoftViewRead";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanHeadTapeSource } from "./IAutoMovieHumanHeadTapeSource";

/**
 * Original physical-station preparations and phase readers, retaining the exact source behind each measured point.
 *
 * The interface package owns these declarations; AutoMovieHumanHeadTapeStation in Human supplies their runtime values.
 */
export namespace IAutoMovieHumanHeadTapeStation {
  /** An actual value query and the identical station that produced it.
   */
  export interface IValue {
    /** Original world point, calibration mm. */
    point: AutoMovieVector3Tuple;

    /** Same input/station preparation, not another inverse trial. */
    source: IPrepared;
  }

  /** One original numeric station; no inverse solve or physical2 is hidden in it.
   */
  export interface IPrepared {
    /** Actual unchanged original reader owning this station. */
    readonly reader: IAutoMovieHumanHeadTapeSource.IReader;

    /** Original physical station, calibration mm. */
    readonly station: number;

    /**
     * Read the original world point in the prepared station frame.
     */
    point(phase: number): AutoMovieVector3Tuple;

    /**
     * Read the native phase jet and its world point in the prepared frame.
     */
    value(phase: number): IReading;
  }

  /** Complete phase reading before the separate physical source2 request.
   */
  export interface IReading {
    /** Original world point, calibration mm. */
    point: AutoMovieVector3Tuple;

    /** Original world frame of the prepared physical station. */
    frame: IAutoMovieLoftSectionFrame;

    /** Same native point and its first two phase derivatives. */
    local: IAutoMovieLoftSectionPhase;
  }

  /** A course reader with optional fixed integration endpoint preparations. */
  export interface IOutput {
    /** Read the admitted original scalar jets at a selected station in mm. */
    jets(station: number): IAutoMovieLoftViewRead.IJets | string;

    /**
     * Actual Point0 and the source that produced this bracket trial.
     */
    point(station: number, phase: number): IValue;

    /**
     * Read phase data from the selected trial, or its actual endpoint station.
     */
    value(station: number, phase: number, selected?: IPrepared): IReading;
  }

  /** Ordered physical stations to prepare for repeated integration, in calibration mm. */
  export type CreateEnds = readonly [number, number];

  /** The local argument of AutoMovieHumanHeadTapeStation.vector. Restore a native local vector without an origin translation.
   */
  export type VectorLocal = readonly [number, number];
}
