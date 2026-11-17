import type { IAutoMovieConstructionView } from "../../../construction/IAutoMovieConstructionView";
import type { IAutoMovieLoftViewSource } from "../../../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/** Type contracts exchanged by AutoMovieHumanGlutealParent; runtime evaluation remains in Human. */
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
    /** Admitted source-native AP intervals, or the explicit unavailable premise. */
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

  /** Result of AutoMovieHumanGlutealParent.levelCut. Read a named world-height cut of the identical original parent field, in calibration-mm X/Z.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Read a named world-height cut of the identical original parent field, in calibration-mm X/Z.
   * @evidence contracts/development/design.md#principled-representation Read a named world-height cut of the identical original parent field, in calibration-mm X/Z. Alternatives are [number, number][]; string.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanGlutealParent.LevelCutResult is the canonical exchange used by AutoMovieHumanGlutealParent.levelCut.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanGlutealParent.levelCut for read a named world-height cut of the identical original parent field, in calibration-mm X/Z.
   */
  export type LevelCutResult = [number, number][] | string;

  /** The leg argument of AutoMovieHumanGlutealParent.create. Prepare the actual trunk and same leg once; values and jets remain separate capabilities.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Prepare the actual trunk and same leg once; values and jets remain separate capabilities.
   * @evidence contracts/development/design.md#principled-representation `part`: Geometric part with its original axis and section laws; its declared source frame and units apply. `view`: The same part expressed as the canonical construction view, with physical lengths in metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanGlutealParent.ICreateLeg is the canonical exchange used by AutoMovieHumanGlutealParent.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `part`, `view`; callers supply the complete record.
   */
  export type ICreateLeg = {
    /** Geometric part with its original axis and section laws; its declared source frame and units apply. */
    part: IAutoMovieViewPart;
    /** The same part expressed as the canonical construction view, with physical lengths in metres. */
    view: IAutoMovieConstructionView;
  };
}
