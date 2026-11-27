/**
 * Chest breadth/depth regressions and the skin-template box closed against a
 * requested girth.
 *
 * The interface package owns these declarations; AutoMovieHumanChestWall in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanChestWall {
  /** One sex's two lines on the girth, `a + b girth`, mm. */
  export interface IWall {
    /**
     * Chest depth, mid-sternum to spine: intercept, mm, and slope per mm of
     * girth.
     */
    depth: IWallDepth;

    /**
     * Chest diameter across the rib cage: intercept, mm, and slope per mm of
     * girth.
     */
    breadth: IWallBreadth;
  }

  /** The breadth object of {@link IWall}. */
  export type IWallBreadth = {
    /**
     * Intercept of the table's affine predictor, in the response quantity's
     * documented unit.
     */
    a: number;
    /**
     * Slope of the table's affine predictor, response units per predictor
     * unit.
     */
    b: number;
  };

  /** The depth object of {@link IWall}. */
  export type IWallDepth = {
    /**
     * Intercept of the table's affine predictor, in the response quantity's
     * documented unit.
     */
    a: number;
    /**
     * Slope of the table's affine predictor, response units per predictor
     * unit.
     */
    b: number;
  };

  /**
   * Result of AutoMovieHumanChestWall.box. The chest wall's box at a girth.
   *
   * @param measures A person's resolved measures, for the sex.
   * @param girth The level's taut-tape girth, mm (the underbust girth at the
   *   fold).
   * @returns Skin-template breadth and depth, mm, retaining the
   *   compressed-caliper ratio and closing the ellipse tape. This is a
   *   construction convention, not a measured skin section.
   */
  export type IBoxResult = {
    /** Full transverse section breadth, millimetres. */
    breadth: number;
    /** Full front-to-back section depth, millimetres. */
    depth: number;
  };
}
