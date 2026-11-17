/**
 * What a fitted view frames: the drawn objects and marks a path pattern selects, or every drawn flagged mark.
 *
 * The focus selects drawn geometry and marks for world-space bounds; it contains no camera or interactive focus state. focusAutoMovieInspection refuses a selection with no drawn bounds, including flagged focus when no drawn mark is flagged.
 *
 * @evidence contracts/development/design.md#principled-representation The two focus forms need different data, so they are a union keyed by `type`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface View parsing, headless capture framing, inspection bounds measurement and recorded pattern resolution share the focus selection independently of a camera view.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The flagged form is its own member rather than a reserved pattern, so no path name is taken from the path grammar.
 * @evidence contracts/development/common.md#meaningful-documentation States what each form frames.
 */
export type IAutoMovieInspectionFocus =
  | {
      /** Select path-pattern framing or the bounds of flagged marks. */
      type: "pattern";

      /** Inspection path pattern selecting the objects/marks to frame. */
      pattern: string;
    }
  | {
      /** Select path-pattern framing or the bounds of flagged marks. */
      type: "flagged";
    };
