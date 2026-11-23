import type { IAutoMovieLoftSectionFrame } from "../../../construction/IAutoMovieLoftSectionFrame";
import type { IAutoMovieLoftSectionPhase } from "../../../construction/IAutoMovieLoftSectionPhase";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanHeadTapeSource } from "./IAutoMovieHumanHeadTapeSource";

/**
 * Original physical-station preparations and phase readers, retaining the exact
 * source behind each measured point.
 *
 * The interface package owns these declarations; AutoMovieHumanHeadTapeStation
 * in Human supplies their runtime values.
 */
export namespace IAutoMovieHumanHeadTapeStation {
  /** An actual value query and the identical station that produced it. */
  export interface IValue {
    /** Original world point, calibration mm. */
    point: AutoMovieVector3Tuple;

    /** Same input/station preparation, not another inverse trial. */
    source: IPrepared;
  }

  /**
   * One original numeric station; no inverse solve or physical2 is hidden in
   * it.
   */
  export interface IPrepared {
    /** Actual unchanged original reader owning this station. */
    readonly reader: IAutoMovieHumanHeadTapeSource.IReader;

    /** Original physical station, calibration mm. */
    readonly station: number;

    /**
     * Point0 inversion retains its exact prepared frame after a successful
     * first read.
     */
    point(phase: number): AutoMovieVector3Tuple;

    /**
     * Explicit phase demand reads its actual frame and shares only the numeric
     * native source.
     */
    value(phase: number): IReading;
  }

  /** Complete phase reading before the separate physical source2 request. */
  export interface IReading {
    /** Original world point, calibration mm. */
    point: AutoMovieVector3Tuple;

    /**
     * Actual current world frame; phase reads do not borrow an inverse trial's
     * frame.
     */
    frame: IAutoMovieLoftSectionFrame;

    /** Same native point and its first two phase derivatives. */
    local: IAutoMovieLoftSectionPhase;
  }

  /** One measured course retains only its two successful endpoint preparations. */
  export interface IOutput {
    /** Actual Point0 and the source that produced this bracket trial. */
    point(station: number, phase: number): IValue;

    /** Read phase data from the selected trial, or its actual endpoint station. */
    value(station: number, phase: number, selected?: IPrepared): IReading;
  }

  /**
   * The ends argument of AutoMovieHumanHeadTapeStation.create. Share only exact
   * unchanged endpoints, and carry an arbitrary selected bracket trial directly
   * into its final phase read. No trial-station map, failed preparation, whole
   * part or physical Hessian is cached.
   */
  export type CreateEnds = readonly [number, number];

  /**
   * The local argument of AutoMovieHumanHeadTapeStation.vector. Restore a
   * native local vector without an origin translation.
   */
  export type VectorLocal = readonly [number, number];
}
