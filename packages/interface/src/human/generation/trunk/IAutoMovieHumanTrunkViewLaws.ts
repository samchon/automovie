/**
 * Person-specific trunk profile and section-box laws with named upper stations and retained mass setbacks. Runtime construction and admission remain with AutoMovieHumanTrunkViews in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes person-specific trunk profile and section-box laws with named upper stations and retained mass setbacks; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Person-specific trunk profile and section-box laws with named upper stations and retained mass setbacks. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanTrunkViews; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing TrunkViewLaws contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanTrunkViewLaws {
  /** The laws the views read beyond the published measures, each a pure function of the person in calibration millimetres.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The laws the views read beyond the published measures, each a pure function of the person in calibration millimetres.
   * @evidence contracts/development/design.md#principled-representation `chest`: Shared chest/bust-apex height from the generating placement, calibration mm; the interim caller still transfers its old course solve. `backStations`: Retained stations of the same back law. `perineum`: The perineum's forward place, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanTrunkInterim.upperSites, AutoMovieHumanTrunkLaws.of. Read by AutoMovieHumanMassInterim.breast, AutoMovieHumanMassInterim.gluteal, AutoMovieHumanTrunkViews.of. Also types AutoMovieHumanBodyLaneInterim.pending, AutoMovieHumanBodyLaneInterim.laws.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `backStations`: Retained stations of the same back law.
   */
  export interface ILaws {
    /** Shared chest/bust-apex height from the generating placement, calibration mm; the interim caller still transfers its old course solve. */
    chest: number;

    /**
     * The back's forward place at a height, mm: the median section's back extreme, the gluteal apex at the buttock.
     *
     * @evidence contracts/development/common.md#meaningful-documentation The back's forward place at a height, mm: the median section's back extreme, the gluteal apex at the buttock.
     */
    back(y: number): number;

    /** Retained stations of the same back law. Bare-wall offsets transfer between neighbouring named sites without a new fit. */
    backStations?: readonly {
      /** Anatomical measurement-site identity, shared by the source law and its diagnostic rows. */
      site: string;
      /** Vertical station in the registered body frame, calibration millimetres. */
      y: number;
    }[];

    /**
     * The navel section's box at a girth (top hip).
     *
     * @evidence contracts/development/common.md#meaningful-documentation The navel section's box at a girth (top hip).
     */
    lumbar(girth: number): IBox;

    /**
     * The thorax's box without the breasts at a girth (the underbust).
     *
     * @evidence contracts/development/common.md#meaningful-documentation The thorax's box without the breasts at a girth (the underbust).
     */
    chestWall(girth: number): IBox;

    /** The perineum's forward place, mm. */
    perineum: number;

    /** The sites above the chest, by rising height: each with its half breadth, front, back (the back profile's where absent) and sourced shoulder; the last the trunk's open top inside the neck. */
    upper: {
      /** Anatomical measurement-site identity, shared by the source law and its diagnostic rows. */
      site: string;
      /** Vertical station in the registered body frame, calibration millimetres. */
      y: number;
      /** Left half breadth at this physical site, calibration millimetres. */
      half: number;
      /** Front profile's forward coordinate, calibration millimetres. */
      front: number;
      /** Back profile's forward coordinate, calibration millimetres. */
      back?: number;
      /** Dimensionless native conic shoulder controlling section fullness; the owning section builder admits its range. */
      shoulder: number;
    }[];
  }

  /** A breadth and depth of a level, mm.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A breadth and depth of a level, mm.
   * @evidence contracts/development/design.md#principled-representation `breadth`: Whole breadth. `depth`: Whole depth.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanTrunkViews.topHipBox, AutoMovieHumanTrunkViews.underbust.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `breadth`, `depth`; callers supply the complete record.
   */
  export interface IBox {
    /** Whole breadth. */
    breadth: number;

    /** Whole depth. */
    depth: number;
  }

  /**
   * Retained breast and gluteal wall setbacks in calibration millimetres. Actual local mass projections remain separately determined by their source wall and anatomical AP apex.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Retained breast and gluteal wall setbacks in calibration millimetres. Actual local mass projections remain separately determined by their source wall and anatomical AP apex.
   * @evidence contracts/development/design.md#principled-representation Retained breast and gluteal wall setbacks in calibration millimetres. Actual local mass projections remain separately determined by their source wall and anatomical AP apex.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanTrunkViewLaws.IOfAmplitudes is the canonical exchange used by AutoMovieHumanTrunkViews.of.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias retains the existing AutoMovieHumanTrunkViews input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
   */
  export type IOfAmplitudes = {
    /** Breast relief amplitude over the chest wall, millimetres. */
    breast: number;
    /** Gluteal relief amplitude over its trunk base, millimetres. */
    gluteal: number;
  };
}
