/**
 * Person-specific trunk profile and section-box laws with named upper stations
 * and retained mass setbacks. Runtime construction and admission remain with
 * AutoMovieHumanTrunkViews in Human.
 */
export namespace IAutoMovieHumanTrunkViewLaws {
  /**
   * The laws the views read beyond the published measures, each a pure function
   * of the person in calibration millimetres.
   */
  export interface ILaws {
    /**
     * Shared chest/bust-apex height from the generating placement, calibration
     * mm; the interim caller still transfers its old course solve.
     */
    chest: number;

    /**
     * The back's forward place at a height, mm: the median section's back
     * extreme, the gluteal apex at the buttock.
     */
    back(y: number): number;

    /**
     * Retained stations of the same back law. Bare-wall offsets transfer
     * between neighbouring named sites without a new fit.
     */
    backStations?: readonly {
      /**
       * Anatomical measurement-site identity, shared by the source law and its
       * diagnostic rows.
       */
      site: string;
      /** Vertical station in the registered body frame, calibration millimetres. */
      y: number;
    }[];

    /** The navel section's box at a girth (top hip). */
    lumbar(girth: number): IBox;

    /** The thorax's box without the breasts at a girth (the underbust). */
    chestWall(girth: number): IBox;

    /** The perineum's forward place, mm. */
    perineum: number;

    /**
     * The sites above the chest, by rising height: each with its half breadth,
     * front, back (the back profile's where absent) and sourced shoulder; the
     * last the trunk's open top inside the neck.
     */
    upper: {
      /**
       * Anatomical measurement-site identity, shared by the source law and its
       * diagnostic rows.
       */
      site: string;
      /** Vertical station in the registered body frame, calibration millimetres. */
      y: number;
      /** Left half breadth at this physical site, calibration millimetres. */
      half: number;
      /** Front profile's forward coordinate, calibration millimetres. */
      front: number;
      /** Back profile's forward coordinate, calibration millimetres. */
      back?: number;
      /**
       * Dimensionless native conic shoulder controlling section fullness; the
       * owning section builder admits its range.
       */
      shoulder: number;
    }[];
  }

  /** A breadth and depth of a level, mm. */
  export interface IBox {
    /** Whole breadth. */
    breadth: number;

    /** Whole depth. */
    depth: number;
  }

  /**
   * Retained breast and gluteal wall setbacks in calibration millimetres.
   * Actual local mass projections remain separately determined by their source
   * wall and anatomical AP apex.
   */
  export type IOfAmplitudes = {
    /** Breast relief amplitude over the chest wall, millimetres. */
    breast: number;
    /** Gluteal relief amplitude over its trunk base, millimetres. */
    gluteal: number;
  };
}
