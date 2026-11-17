/** Type contracts exchanged by AutoMovieHumanChestWall; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanChestWall {
  /** One sex's two lines on the girth, `a + b girth`, mm.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One sex's two lines on the girth, `a + b girth`, mm.
   * @evidence contracts/development/design.md#principled-representation `depth`: Chest depth, mid-sternum to spine: intercept, mm, and slope per mm of girth. `breadth`: Chest diameter across the rib cage: intercept, mm, and slope per mm of girth.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanChestWall.LINES, AutoMovieHumanChestWall.wall.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `depth`, `breadth`; callers supply the complete record.
   */
  export interface IWall {
    /** Chest depth, mid-sternum to spine: intercept, mm, and slope per mm of girth. */
    depth: {
      /** Intercept of the table's affine predictor, in the response quantity's documented unit. */
      a: number;
      /** Slope of the table's affine predictor, response units per predictor unit. */
      b: number;
    };

    /** Chest diameter across the rib cage: intercept, mm, and slope per mm of girth. */
    breadth: {
      /** Intercept of the table's affine predictor, in the response quantity's documented unit. */
      a: number;
      /** Slope of the table's affine predictor, response units per predictor unit. */
      b: number;
    };
  }

  /** Result of AutoMovieHumanChestWall.box. The chest wall's box at a girth.
  @param measures A person's resolved measures, for the sex.
  @param girth The level's taut-tape girth, mm (the underbust girth at the fold).
  @returns Skin-template breadth and depth, mm, retaining the compressed-caliper ratio and closing the ellipse tape. This is a construction convention, not a measured skin section.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The chest wall's box at a girth.
 * @evidence contracts/development/design.md#principled-representation `breadth`: Full transverse section breadth, millimetres. `depth`: Full front-to-back section depth, millimetres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanChestWall.IBoxResult is the canonical exchange used by AutoMovieHumanChestWall.box.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `breadth`, `depth`; callers supply the complete record.
 */
  export type IBoxResult = {
    /** Full transverse section breadth, millimetres. */
    breadth: number;
    /** Full front-to-back section depth, millimetres. */
    depth: number;
  };
}
