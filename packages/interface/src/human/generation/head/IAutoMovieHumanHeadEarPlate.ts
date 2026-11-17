import type { IAutoMovieConstructionView } from "../../../construction/IAutoMovieConstructionView";
import type { IAutoMovieLoftFrame } from "../../../construction/IAutoMovieLoftFrame";
import type { IAutoMovieLoftSectionPhase } from "../../../construction/IAutoMovieLoftSectionPhase";
import type { IAutoMovieLoftViewRead } from "../../../construction/IAutoMovieLoftViewRead";
import type { IAutoMovieLoftViewSource } from "../../../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/** Type contracts exchanged by AutoMovieHumanHeadEarPlate; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHeadEarPlate {
  /**
   * A whole original plate section, including a distinct true-zero point.
   * @evidence contracts/common.md#principled-implementation Keeps the native family, actual plane, signed source values and available physical scalar2 together.
   * @evidence contracts/common.md#clear-and-simple-design One section record serves guide and relief consumers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A true-zero source has no invented regular phase field or physical derivative.
   * @evidence contracts/common.md#meaningful-documentation Values use calibration mm; phase and physical station2 availability are separate.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The section reader owns preparation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns fixed-size readings and its native closure.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A whole original plate section, including a distinct true-zero point.
   * @evidence contracts/development/design.md#principled-representation `frame`: Exact actual source plane. `inputs`: Four actual signed-support magnitudes and effective quarter fullness values. `jets`: Actual physical scalar2, when finite.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanHeadEarPlate.section, AutoMovieHumanHeadEarPlate.read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `frame`, `inputs`, `jets`, `jetFailure`, `phase`; callers supply the complete record.
   */
  export interface ISection {
    /** Exact actual source plane. */
    frame: IAutoMovieLoftFrame.IFrame;
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
   * @evidence contracts/common.md#principled-implementation Named measurement stations and all relief readers retain the identical complete original section source and actual frame.
   * @evidence contracts/common.md#clear-and-simple-design One plate exposes its full source and actual guide points to every relief consumer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Opposite guides are read from the actual signed native field, never reflected from one positive outline.
   * @evidence contracts/common.md#meaningful-documentation Fields identify calibration units, named anatomical stations and whole-section availability.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no work; the factory owns admission and readers.
   * @evidence contracts/performance.md#reuse-equivalent-work Every course borrows the same admitted source instead of reconstructing the plate.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The composition owns its actual part, declaration and prepared original field.
   *
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
    /** Actual attachment/posterior original guide point. */
    point(station: number, posterior: boolean): [number, number, number];
    /** Whole original source section and all available local derivatives. */
    section(station: number): ISection;
  }
}
