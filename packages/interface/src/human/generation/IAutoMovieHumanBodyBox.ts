/**
 * Type contracts exchanged by AutoMovieHumanBodyBox; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanBodyBox exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups Level, IFields, IBox, RangeResult, IPlaceSupplied, PlaceBreadth, PlaceDepth, IPlaceResult. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanBodyBox; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the Level, IFields, IBox, RangeResult, IPlaceSupplied, PlaceBreadth, PlaceDepth, IPlaceResult contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanBodyBox {
  /** A trunk level whose breadth, depth and girth are all published.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A trunk level whose breadth, depth and girth are all published.
   * @evidence contracts/development/design.md#principled-representation A trunk level whose breadth, depth and girth are all published. The closed alternatives are "chest", "waist", "hip".
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanBodyBox.LEVELS, AutoMovieHumanBodyBox.FIELDS.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanBodyAnatomy.box, AutoMovieHumanBodyBox.LEVELS, AutoMovieHumanBodyBox.FIELDS, AutoMovieHumanBodyBox.of for a trunk level whose breadth, depth and girth are all published.
   */
  export type Level = "chest" | "waist" | "hip";

  /** One level's three measure names.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One level's three measure names.
   * @evidence contracts/development/design.md#principled-representation `breadth`: Its breadth, the front view's outline. `depth`: Its depth, the side view's outline. `girth`: Its tape girth.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanBodyAnatomy.fields, AutoMovieHumanBodyBox.FIELDS.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `breadth`, `depth`, `girth`; callers supply the complete record.
   */
  export interface IFields {
    /** Its breadth, the front view's outline. */
    breadth: "chestBreadth" | "waistBreadth" | "hipBreadth";

    /** Its depth, the side view's outline. */
    depth: "chestDepth" | "waistDepth" | "buttockDepth";

    /** Its tape girth. */
    girth: "chestCircumference" | "waistCircumference" | "hipCircumference";
  }

  /** One level's box and the girth the section takes in it, mm.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One level's box and the girth the section takes in it, mm.
   * @evidence contracts/development/design.md#principled-representation `level`: The level. `breadth`: Breadth, mm. `depth`: Depth, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBodyBox.of. Also types AutoMovieHumanTrunkViews.boxes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `level`, `breadth`, `depth`, `girth`, `rhombus`, `box`, `tape`, `fullness`; callers supply the complete record.
   */
  export interface IBox {
    /** The level. */
    level: Level;

    /** Breadth, mm. */
    breadth: number;

    /** Depth, mm. */
    depth: number;

    /** The person's girth, mm, supplied or defaulted. */
    girth: number;

    /** Least perimeter of a convex section touching the box, `2 sqrt(W^2 + D^2)`, mm. */
    rhombus: number;

    /** Greatest perimeter, the box's own, `2 (W + D)`, mm. */
    box: number;

    /**
     * The girth the section takes: the person's, held at the nearest end of
     * the range when it contradicts the box, mm.
     */
    tape: number;

    /**
     * Where the tape lies in the range, `(tape - rhombus) / (box - rhombus)`:
     * 0 the rhombus, 1 the box. The trunk's fullness solve reads it.
     */
    fullness: number;
  }

  /** Result of AutoMovieHumanBodyBox.range. The range of taut-tape perimeters of a convex section touching all four
  sides of a box.
  @param breadth Box breadth, mm.
  @param depth Box depth, mm.
  @returns The rhombus's and the box's perimeters, mm.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The range of taut-tape perimeters of a convex section touching all four sides of a box.
 * @evidence contracts/development/design.md#principled-representation The range of taut-tape perimeters of a convex section touching all four sides of a box. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanBodyBox.RangeResult is the canonical exchange used by AutoMovieHumanBodyBox.range.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanBodyBox.range for the range of taut-tape perimeters of a convex section touching all four sides of a box.
 */
  export type RangeResult = [number, number];

  /** The supplied argument of AutoMovieHumanBodyBox.place. A level's three measures with every default placed inside the range the
  supplied ones leave, so a defaulted measure is never the cause of a
  contradiction.
  The girth is the person's or its own default; each omitted breadth or
  depth is its survey line on that girth. Then, keeping every supplied value:
  - a defaulted girth is held inside the box of the breadth and depth;
  - with the girth supplied and both breadth and depth defaulted, both are
    scaled by one factor, keeping their survey proportion, until the girth
    lies in their box;
  - with the girth and one of the two supplied, the other is held inside the
    interval that puts the girth in the box: for a supplied breadth W, the
    depth from `G / 2 - W` (the box's perimeter reaches G) to
    `sqrt(G^2 / 4 - W^2)` (the rhombus's does), an interval that is empty
    only when `W > G / 2`, which no depth can mend;
  - with all three supplied, nothing moves, and {@link diagnose} reports a
    contradiction.
  @param supplied The person's own values, each undefined when omitted, mm.
  @param girth The girth's default when omitted, mm.
  @param breadth The breadth's survey line on the girth, mm.
  @param depth The depth's survey line on the girth, mm.
  @returns The level's breadth, depth and girth, mm.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A level's three measures with every default placed inside the range the supplied ones leave, so a defaulted measure is never the cause of a contradiction.
 * @evidence contracts/development/design.md#principled-representation `breadth`: Full transverse section breadth, millimetres. `depth`: Full front-to-back section depth, millimetres. `girth`: Closed section tape length, millimetres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanBodyBox.IPlaceSupplied is the canonical exchange used by AutoMovieHumanBodyBox.place.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `breadth`, `depth`, `girth`; callers supply the complete record.
 */
  export type IPlaceSupplied = {
    /** Full transverse section breadth, millimetres. Undefined leaves this measure to the owning section solve. */
    breadth: number | undefined;
    /** Full front-to-back section depth, millimetres. Undefined leaves this measure to the owning section solve. */
    depth: number | undefined;
    /** Closed section tape length, millimetres. Undefined leaves this measure to the owning section solve. */
    girth: number | undefined;
  };

  /** The breadth argument of AutoMovieHumanBodyBox.place. A level's three measures with every default placed inside the range the
  supplied ones leave, so a defaulted measure is never the cause of a
  contradiction.
  The girth is the person's or its own default; each omitted breadth or
  depth is its survey line on that girth. Then, keeping every supplied value:
  - a defaulted girth is held inside the box of the breadth and depth;
  - with the girth supplied and both breadth and depth defaulted, both are
    scaled by one factor, keeping their survey proportion, until the girth
    lies in their box;
  - with the girth and one of the two supplied, the other is held inside the
    interval that puts the girth in the box: for a supplied breadth W, the
    depth from `G / 2 - W` (the box's perimeter reaches G) to
    `sqrt(G^2 / 4 - W^2)` (the rhombus's does), an interval that is empty
    only when `W > G / 2`, which no depth can mend;
  - with all three supplied, nothing moves, and {@link diagnose} reports a
    contradiction.
  @param supplied The person's own values, each undefined when omitted, mm.
  @param girth The girth's default when omitted, mm.
  @param breadth The breadth's survey line on the girth, mm.
  @param depth The depth's survey line on the girth, mm.
  @returns The level's breadth, depth and girth, mm.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A level's three measures with every default placed inside the range the supplied ones leave, so a defaulted measure is never the cause of a contradiction.
 * @evidence contracts/development/design.md#principled-representation A level's three measures with every default placed inside the range the supplied ones leave, so a defaulted measure is never the cause of a contradiction. The callable takes girth and returns number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanBodyBox.PlaceBreadth is the canonical exchange used by AutoMovieHumanBodyBox.place.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanBodyBox.place for a level's three measures with every default placed inside the range the supplied ones leave, so a defaulted measure is never the cause of a contradiction.
 */
  export type PlaceBreadth = (girth: number) => number;

  /** The depth argument of AutoMovieHumanBodyBox.place. A level's three measures with every default placed inside the range the
  supplied ones leave, so a defaulted measure is never the cause of a
  contradiction.
  The girth is the person's or its own default; each omitted breadth or
  depth is its survey line on that girth. Then, keeping every supplied value:
  - a defaulted girth is held inside the box of the breadth and depth;
  - with the girth supplied and both breadth and depth defaulted, both are
    scaled by one factor, keeping their survey proportion, until the girth
    lies in their box;
  - with the girth and one of the two supplied, the other is held inside the
    interval that puts the girth in the box: for a supplied breadth W, the
    depth from `G / 2 - W` (the box's perimeter reaches G) to
    `sqrt(G^2 / 4 - W^2)` (the rhombus's does), an interval that is empty
    only when `W > G / 2`, which no depth can mend;
  - with all three supplied, nothing moves, and {@link diagnose} reports a
    contradiction.
  @param supplied The person's own values, each undefined when omitted, mm.
  @param girth The girth's default when omitted, mm.
  @param breadth The breadth's survey line on the girth, mm.
  @param depth The depth's survey line on the girth, mm.
  @returns The level's breadth, depth and girth, mm.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A level's three measures with every default placed inside the range the supplied ones leave, so a defaulted measure is never the cause of a contradiction.
 * @evidence contracts/development/design.md#principled-representation A level's three measures with every default placed inside the range the supplied ones leave, so a defaulted measure is never the cause of a contradiction. The callable takes girth and returns number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanBodyBox.PlaceDepth is the canonical exchange used by AutoMovieHumanBodyBox.place.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanBodyBox.place for a level's three measures with every default placed inside the range the supplied ones leave, so a defaulted measure is never the cause of a contradiction.
 */
  export type PlaceDepth = (girth: number) => number;

  /** Result of AutoMovieHumanBodyBox.place. A level's three measures with every default placed inside the range the
  supplied ones leave, so a defaulted measure is never the cause of a
  contradiction.
  The girth is the person's or its own default; each omitted breadth or
  depth is its survey line on that girth. Then, keeping every supplied value:
  - a defaulted girth is held inside the box of the breadth and depth;
  - with the girth supplied and both breadth and depth defaulted, both are
    scaled by one factor, keeping their survey proportion, until the girth
    lies in their box;
  - with the girth and one of the two supplied, the other is held inside the
    interval that puts the girth in the box: for a supplied breadth W, the
    depth from `G / 2 - W` (the box's perimeter reaches G) to
    `sqrt(G^2 / 4 - W^2)` (the rhombus's does), an interval that is empty
    only when `W > G / 2`, which no depth can mend;
  - with all three supplied, nothing moves, and {@link diagnose} reports a
    contradiction.
  @param supplied The person's own values, each undefined when omitted, mm.
  @param girth The girth's default when omitted, mm.
  @param breadth The breadth's survey line on the girth, mm.
  @param depth The depth's survey line on the girth, mm.
  @returns The level's breadth, depth and girth, mm.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A level's three measures with every default placed inside the range the supplied ones leave, so a defaulted measure is never the cause of a contradiction.
 * @evidence contracts/development/design.md#principled-representation `breadth`: Full transverse section breadth, millimetres. `depth`: Full front-to-back section depth, millimetres. `girth`: Closed section tape length, millimetres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanBodyBox.IPlaceResult is the canonical exchange used by AutoMovieHumanBodyBox.place.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `breadth`, `depth`, `girth`; callers supply the complete record.
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
