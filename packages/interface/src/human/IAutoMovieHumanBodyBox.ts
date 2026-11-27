/**
 * Type contracts exchanged by AutoMovieHumanBodyBox; runtime evaluation remains
 * in Human.
 */
export namespace IAutoMovieHumanBodyBox {
  /** A trunk level whose breadth, depth and girth are all published. */
  export type Level = "chest" | "waist" | "hip";

  /** One level's three measure names. */
  export interface IFields {
    /** Its breadth, the front view's outline. */
    breadth: "chestBreadth" | "waistBreadth" | "hipBreadth";

    /** Its depth, the side view's outline. */
    depth: "chestDepth" | "waistDepth" | "buttockDepth";

    /** Its tape girth. */
    girth: "chestCircumference" | "waistCircumference" | "hipCircumference";
  }

  /** One level's box and the girth the section takes in it, mm. */
  export interface IBox {
    /** The level. */
    level: Level;

    /** Breadth, mm. */
    breadth: number;

    /** Depth, mm. */
    depth: number;

    /** The person's girth, mm, supplied or defaulted. */
    girth: number;

    /**
     * Least perimeter of a convex section touching the box, `2 sqrt(W^2 +
     * D^2)`, mm.
     */
    rhombus: number;

    /** Greatest perimeter, the box's own, `2 (W + D)`, mm. */
    box: number;

    /**
     * The girth the section takes: the person's, held at the nearest end of the
     * range when it contradicts the box, mm.
     */
    tape: number;

    /**
     * Where the tape lies in the range, `(tape - rhombus) / (box - rhombus)`: 0
     * the rhombus, 1 the box. The trunk's fullness solve reads it.
     */
    fullness: number;
  }

  /**
   * Result of AutoMovieHumanBodyBox.range. The range of taut-tape perimeters of
   * a convex section touching all four sides of a box.
   *
   * @param breadth Box breadth, mm.
   * @param depth Box depth, mm.
   * @returns The rhombus's and the box's perimeters, mm.
   */
  export type RangeResult = [number, number];

  /**
   * The supplied argument of AutoMovieHumanBodyBox.place. A level's three
   * measures with every default placed inside the range the supplied ones
   * leave, so a defaulted measure is never the cause of a contradiction. The
   * girth is the person's or its own default; each omitted breadth or depth is
   * its survey line on that girth. Then, keeping every supplied value:
   *
   * - A defaulted girth is held inside the box of the breadth and depth;
   * - With the girth supplied and both breadth and depth defaulted, both are
   *   scaled by one factor, keeping their survey proportion, until the girth
   *   lies in their box;
   * - With the girth and one of the two supplied, the other is held inside the
   *   interval that puts the girth in the box: for a supplied breadth W, the
   *   depth from `G / 2 - W` (the box's perimeter reaches G) to `sqrt(G^2 / 4 -
   *   W^2)` (the rhombus's does), an interval that is empty only when `W > G /
   *   2`, which no depth can mend;
   * - With all three supplied, nothing moves, and {@link diagnose} reports a
   *   contradiction.
   *
   * @param supplied The person's own values, each undefined when omitted, mm.
   * @param girth The girth's default when omitted, mm.
   * @param breadth The breadth's survey line on the girth, mm.
   * @param depth The depth's survey line on the girth, mm.
   * @returns The level's breadth, depth and girth, mm.
   */
  export type IPlaceSupplied = {
    /**
     * Full transverse section breadth, millimetres. Undefined leaves this
     * measure to the owning section solve.
     */
    breadth: number | undefined;
    /**
     * Full front-to-back section depth, millimetres. Undefined leaves this
     * measure to the owning section solve.
     */
    depth: number | undefined;
    /**
     * Closed section tape length, millimetres. Undefined leaves this measure to
     * the owning section solve.
     */
    girth: number | undefined;
  };

  /**
   * The breadth argument of AutoMovieHumanBodyBox.place. A level's three
   * measures with every default placed inside the range the supplied ones
   * leave, so a defaulted measure is never the cause of a contradiction. The
   * girth is the person's or its own default; each omitted breadth or depth is
   * its survey line on that girth. Then, keeping every supplied value:
   *
   * - A defaulted girth is held inside the box of the breadth and depth;
   * - With the girth supplied and both breadth and depth defaulted, both are
   *   scaled by one factor, keeping their survey proportion, until the girth
   *   lies in their box;
   * - With the girth and one of the two supplied, the other is held inside the
   *   interval that puts the girth in the box: for a supplied breadth W, the
   *   depth from `G / 2 - W` (the box's perimeter reaches G) to `sqrt(G^2 / 4 -
   *   W^2)` (the rhombus's does), an interval that is empty only when `W > G /
   *   2`, which no depth can mend;
   * - With all three supplied, nothing moves, and {@link diagnose} reports a
   *   contradiction.
   *
   * @param supplied The person's own values, each undefined when omitted, mm.
   * @param girth The girth's default when omitted, mm.
   * @param breadth The breadth's survey line on the girth, mm.
   * @param depth The depth's survey line on the girth, mm.
   * @returns The level's breadth, depth and girth, mm.
   */
  export type PlaceBreadth = (girth: number) => number;

  /**
   * The depth argument of AutoMovieHumanBodyBox.place. A level's three measures
   * with every default placed inside the range the supplied ones leave, so a
   * defaulted measure is never the cause of a contradiction. The girth is the
   * person's or its own default; each omitted breadth or depth is its survey
   * line on that girth. Then, keeping every supplied value:
   *
   * - A defaulted girth is held inside the box of the breadth and depth;
   * - With the girth supplied and both breadth and depth defaulted, both are
   *   scaled by one factor, keeping their survey proportion, until the girth
   *   lies in their box;
   * - With the girth and one of the two supplied, the other is held inside the
   *   interval that puts the girth in the box: for a supplied breadth W, the
   *   depth from `G / 2 - W` (the box's perimeter reaches G) to `sqrt(G^2 / 4 -
   *   W^2)` (the rhombus's does), an interval that is empty only when `W > G /
   *   2`, which no depth can mend;
   * - With all three supplied, nothing moves, and {@link diagnose} reports a
   *   contradiction.
   *
   * @param supplied The person's own values, each undefined when omitted, mm.
   * @param girth The girth's default when omitted, mm.
   * @param breadth The breadth's survey line on the girth, mm.
   * @param depth The depth's survey line on the girth, mm.
   * @returns The level's breadth, depth and girth, mm.
   */
  export type PlaceDepth = (girth: number) => number;

  /**
   * Result of AutoMovieHumanBodyBox.place. A level's three measures with every
   * default placed inside the range the supplied ones leave, so a defaulted
   * measure is never the cause of a contradiction. The girth is the person's or
   * its own default; each omitted breadth or depth is its survey line on that
   * girth. Then, keeping every supplied value:
   *
   * - A defaulted girth is held inside the box of the breadth and depth;
   * - With the girth supplied and both breadth and depth defaulted, both are
   *   scaled by one factor, keeping their survey proportion, until the girth
   *   lies in their box;
   * - With the girth and one of the two supplied, the other is held inside the
   *   interval that puts the girth in the box: for a supplied breadth W, the
   *   depth from `G / 2 - W` (the box's perimeter reaches G) to `sqrt(G^2 / 4 -
   *   W^2)` (the rhombus's does), an interval that is empty only when `W > G /
   *   2`, which no depth can mend;
   * - With all three supplied, nothing moves, and {@link diagnose} reports a
   *   contradiction.
   *
   * @param supplied The person's own values, each undefined when omitted, mm.
   * @param girth The girth's default when omitted, mm.
   * @param breadth The breadth's survey line on the girth, mm.
   * @param depth The depth's survey line on the girth, mm.
   * @returns The level's breadth, depth and girth, mm.
   */
  export type IPlaceResult = {
    /** Full transverse section breadth, millimetres. */
    breadth: number;
    /** Full front-to-back section depth, millimetres. */
    depth: number;
    /** Closed section tape length, millimetres. */
    girth: number;
  };
}
