import type { IAutoMovieConstructionView } from "../../../construction/IAutoMovieConstructionView";
import type { IAutoMovieLoftSectionFrame } from "../../../construction/IAutoMovieLoftSectionFrame";
import type { IAutoMovieLoftSectionPhase } from "../../../construction/IAutoMovieLoftSectionPhase";
import type { IAutoMovieLoftViewRead } from "../../../construction/IAutoMovieLoftViewRead";
import type { IAutoMovieLoftViewSource } from "../../../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/**
 * An original auricle plate, its named stations and whole-section readers with
 * explicit missing derivatives.
 *
 * The interface package owns these declarations; AutoMovieHumanHeadEarPlate in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanHeadEarPlate {
  /**
   * A whole original plate section, including a distinct true-zero point. Keeps
   * the native family, actual plane, signed source values and available
   * physical scalar2 together. One section record serves guide and relief
   * consumers. A true-zero source has no invented regular phase field or
   * physical derivative. Values use calibration mm; phase and physical station2
   * availability are separate. Data performs no work. The section reader owns
   * preparation. The caller owns fixed-size readings and its native closure.
   */
  export interface ISection {
    /** Exact actual source plane. */
    frame: IAutoMovieLoftSectionFrame;
    /**
     * Four actual signed-support magnitudes and effective quarter fullness
     * values.
     */
    inputs: IAutoMovieLoftViewRead.IValues;
    /** Actual physical scalar2, when finite. */
    jets: IAutoMovieLoftViewRead.IJets | null;
    /** Explicit physical-derivative failure, never zero-filled. */
    jetFailure: string | null;
    /**
     * Native full phase function; null only when all four original extents are
     * exactly zero.
     */
    phase: ((phi: number) => IAutoMovieLoftSectionPhase) | null;
  }

  /**
   * Source plate with separate named measurement stations, calibration mm.
   * Named measurement stations and all relief readers retain the identical
   * complete original section source and actual frame. One plate exposes its
   * full source and actual guide points to every relief consumer. Opposite
   * guides are read from the actual signed native field, never reflected from
   * one positive outline. Fields identify calibration units, named anatomical
   * stations and whole-section availability. Data performs no work; the factory
   * owns admission and readers. Every course borrows the same admitted source
   * instead of reconstructing the plate. The composition owns its actual part,
   * declaration and prepared original field.
   */
  export interface IOutput {
    /** Original auricle view. */
    part: IAutoMovieViewPart;
    /**
     * The identical metre declaration used by the raw part, all courses and
     * production tree.
     */
    view: IAutoMovieConstructionView;
    /**
     * Complete admitted original scalar family retained by all relief
     * consumers.
     */
    source: IAutoMovieLoftViewSource.ISource;
    /** Actual named upper/lower source stations after the one conversion. */
    top: number;
    /** Actual named subaurale station after the one conversion. */
    bottom: number;
    /** Horizontal posterior direction of each section. */
    across: [number, number, number];
    /** Horizontal plate-normal direction. */
    normal: [number, number, number];
    /** Actual c height. */
    attachment: number;
    /** Actual j height; generally different from c. */
    posterior: number;
    /** Tragal rim measurement height. */
    tragion: number;
    /** Actual attachment/posterior original guide point. */
    point(station: number, posterior: boolean): [number, number, number];
    /** Whole original source section and all available local derivatives. */
    section(station: number): ISection;
  }
}
