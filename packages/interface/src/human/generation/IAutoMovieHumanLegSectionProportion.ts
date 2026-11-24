/**
 * Type contracts exchanged by AutoMovieHumanLegSectionProportion; runtime
 * evaluation remains in Human.
 */
export namespace IAutoMovieHumanLegSectionProportion {
  /** One station's breadth-to-depth ratio and dimensionless fullness. */
  export interface IRow {
    /** Share of the ankle-to-crotch span. */
    share: number;

    /** Breadth (lateral) over depth (front to back). */
    ratio: number;

    /** The girth's place in its box range, 0 the rhombus, 1 the box. */
    fullness: number;
  }

  /** Section ratio and fullness at a normalized station. */
  export type IAtResult = {
    /** Section breadth divided by depth, dimensionless. */
    ratio: number;
    /**
     * Dimensionless position of girth between the section's rhombus perimeter
     * (0) and box perimeter (1).
     */
    fullness: number;
  };

  /**
   * Result of AutoMovieHumanLegSectionProportion.box. The breadth and depth of
   * a section of girth G at a share.
   *
   * @param girth The section's taut-tape girth, mm.
   * @param share Share of the ankle-to-crotch span.
   * @returns Breadth and depth, mm.
   */
  export type IBoxResult = {
    /** Full transverse section breadth, millimetres. */
    breadth: number;
    /** Full front-to-back section depth, millimetres. */
    depth: number;
  };
}
