import type { IAutoMovieConstructionView } from "../../../construction/IAutoMovieConstructionView";
import type { IAutoMovieLoftViewSource } from "../../../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/**
 * Shared original parents and native AP chord boundaries with explicit unavailable results. Runtime construction and admission remain with AutoMovieHumanGlutealParent in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes shared original parents and native AP chord boundaries with explicit unavailable results; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Shared original parents and native AP chord boundaries with explicit unavailable results. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanGlutealParent; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing GlutealParent contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanGlutealParent {
  /** Shared original definitions and their local contact reader.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Shared original definitions and their local contact reader.
   * @evidence contracts/development/design.md#principled-representation `parts`: The identical original parts consumed by the production parent lofts. `sources`: Same prepared scalar/fullness/cap owners; physical jets stay available through the public reader.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanGlutealParent.trunkOnly, AutoMovieHumanGlutealParent.create. Also types AutoMovieHumanBreastConnection.parent, AutoMovieHumanGlutealConnection.parent.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `parts`, `sources`; callers supply the complete record.
   */
  export interface IParent {
    /** The identical original parts consumed by the production parent lofts. */
    parts: readonly IAutoMovieViewPart[];
    /** Same prepared scalar/fullness/cap owners; physical jets stay available through the public reader. */
    sources: readonly {
      /** Geometric part with its original axis and section laws; its declared source frame and units apply. */
      part: IAutoMovieViewPart;
      /** Admitted original scalar/section owner for this geometric part; consumers read its declared source parameter. */
      source: IAutoMovieLoftViewSource.ISource;
    }[];
    /**
     * Admitted source-native AP intervals, or the explicit unavailable premise.
     */
    chord(y: number, z: number): IChord[] | string;
  }

  /** One occupied AP interval at the queried world height/across position.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One occupied AP interval at the queried world height/across position.
   * @evidence contracts/development/design.md#principled-representation `back`: Posterior and anterior actual source boundaries. `front`: Anterior actual source boundary.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by trunkChord, legReader, unite. Read by unite. Also types AutoMovieHumanMassSource.chords, AutoMovieHumanMassSource.chord.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `back`, `front`; callers supply the complete record.
   */
  export interface IChord {
    /** Posterior and anterior actual source boundaries. */
    back: IBoundary;
    /** Anterior actual source boundary. */
    front: IBoundary;
  }

  /** A boundary point and the actual original chart that supplied it.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A boundary point and the actual original chart that supplied it.
   * @evidence contracts/development/design.md#principled-representation `x`: World AP coordinate, calibration mm. `owner`: Source part name; a union keeps the actual outer boundary's owner. `station`: Physical source station, calibration mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by boundary. Also types AutoMovieHumanMassSource.at, AutoMovieHumanMassSource.boundary.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `x`, `owner`, `station`, `phase`; callers supply the complete record.
   */
  export interface IBoundary {
    /** World AP coordinate, calibration mm. */
    x: number;
    /** Source part name; a union keeps the actual outer boundary's owner. */
    owner: string;
    /** Physical source station, calibration mm. */
    station: number;
    /** Original polar phase, radians. */
    phase: number;
  }

  /**
   * World-height cut points [X, Z] in calibration millimetres from the identical original parent, or the original unavailable reason as a string. A string is not an empty successful cut.
   *
   * @evidence contracts/development/common.md#meaningful-documentation World-height cut points [X, Z] in calibration millimetres from the identical original parent, or the original unavailable reason as a string. A string is not an empty successful cut.
   * @evidence contracts/development/design.md#principled-representation World-height cut points [X, Z] in calibration millimetres from the identical original parent, or the original unavailable reason as a string. A string is not an empty successful cut.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanGlutealParent.LevelCutResult is the canonical exchange used by AutoMovieHumanGlutealParent.levelCut.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias retains the existing AutoMovieHumanGlutealParent input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
   */
  export type LevelCutResult = [number, number][] | string;

  /**
   * The actual leg's millimetre view part and its corresponding metre construction view, borrowed together when preparing the trunk/leg parent source.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The actual leg's millimetre view part and its corresponding metre construction view, borrowed together when preparing the trunk/leg parent source.
   * @evidence contracts/development/design.md#principled-representation The actual leg's millimetre view part and its corresponding metre construction view, borrowed together when preparing the trunk/leg parent source.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanGlutealParent.ICreateLeg is the canonical exchange used by AutoMovieHumanGlutealParent.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias retains the existing AutoMovieHumanGlutealParent input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
   */
  export type ICreateLeg = {
    /** Geometric part with its original axis and section laws; its declared source frame and units apply. */
    part: IAutoMovieViewPart;
    /** The same part expressed as the canonical construction view, with physical lengths in metres. */
    view: IAutoMovieConstructionView;
  };
}
