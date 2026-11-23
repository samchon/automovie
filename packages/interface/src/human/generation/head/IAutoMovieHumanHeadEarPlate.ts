import type { IAutoMovieConstructionView } from "../../../construction/IAutoMovieConstructionView";
import type { IAutoMovieLoftSectionFrame } from "../../../construction/IAutoMovieLoftSectionFrame";
import type { IAutoMovieLoftSectionPhase } from "../../../construction/IAutoMovieLoftSectionPhase";
import type { IAutoMovieLoftViewRead } from "../../../construction/IAutoMovieLoftViewRead";
import type { IAutoMovieLoftViewSource } from "../../../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/**
 * An original auricle plate, its named stations and whole-section readers with explicit missing derivatives.
 *
 * The interface package owns these declarations; AutoMovieHumanHeadEarPlate in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation An original auricle plate, its named stations and whole-section readers with explicit missing derivatives. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only ISection, IOutput declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation ISection, IOutput separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanHeadEarPlate exchanges the named ISection, IOutput contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanHeadEarPlate {
  /**
   * A whole original plate section, including a distinct true-zero point.
   * Keeps the native family, actual plane, signed source values and available physical scalar2 together.
   * One section record serves guide and relief consumers.
   * A true-zero source has no invented regular phase field or physical derivative.
   * Values use calibration mm; phase and physical station2 availability are separate.
   * Data performs no work.
   * The section reader owns preparation.
   * The caller owns fixed-size readings and its native closure.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A whole original plate section, including a distinct true-zero point.
   * @evidence contracts/development/design.md#principled-representation `frame`: Exact actual source plane. `inputs`: Four actual signed-support magnitudes and effective quarter fullness values. `jets`: Actual physical scalar2, when finite.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanHeadEarPlate.section, AutoMovieHumanHeadEarPlate.read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `frame`, `inputs`, `jets`, `jetFailure`, `phase`; callers supply the complete record.
   */
  export interface ISection {
    /** Exact actual source plane. */
    frame: IAutoMovieLoftSectionFrame;
    /** Four actual signed-support magnitudes and effective quarter fullness values. */
    inputs: IAutoMovieLoftViewRead.IValues;
    /** Actual physical scalar2, when finite. */
    jets: IAutoMovieLoftViewRead.IJets | null;
    /** Explicit physical-derivative failure, never zero-filled. */
    jetFailure: string | null;
    /** Native full phase function; null only when all four original extents are exactly zero. */
    phase: ((phi: number) => IAutoMovieLoftSectionPhase) | null;
  }

  /**
   * Source plate with separate named measurement stations, calibration mm.
   * Named measurement stations and all relief readers retain the identical complete original section source and actual frame.
   * One plate exposes its full source and actual guide points to every relief consumer.
   * Opposite guides are read from the actual signed native field, never reflected from one positive outline.
   * Fields identify calibration units, named anatomical stations and whole-section availability.
   * Data performs no work; the factory owns admission and readers.
   * Every course borrows the same admitted source instead of reconstructing the plate.
   * The composition owns its actual part, declaration and prepared original field.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Source plate with separate named measurement stations, calibration mm.
   * @evidence contracts/development/design.md#principled-representation `part`: Original auricle view. `view`: The identical metre declaration used by the raw part, all courses and production tree. `source`: Complete admitted original scalar family retained by all relief consumers.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadEarPlate.of. Read by AutoMovieHumanHeadEarParts.insetHelix. Also types AutoMovieHumanHeadCanonical.plate, AutoMovieHumanHeadEarParts.plate.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `part`, `view`, `source`, `top`, `bottom`, `across`, `normal`, `attachment`, `posterior`, `tragion`; callers supply the complete record.
   */
  export interface IOutput {
    /** Original auricle view. */
    part: IAutoMovieViewPart;
    /** The identical metre declaration used by the raw part, all courses and production tree. */
    view: IAutoMovieConstructionView;
    /** Complete admitted original scalar family retained by all relief consumers. */
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
    /**
     * Actual attachment/posterior original guide point.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Actual attachment/posterior original guide point.
     */
    point(station: number, posterior: boolean): [number, number, number];
    /**
     * Whole original source section and all available local derivatives.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Whole original source section and all available local derivatives.
     */
    section(station: number): ISection;
  }
}
