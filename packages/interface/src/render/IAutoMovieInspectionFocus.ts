/**
 * What a fitted view frames: the drawn objects and marks a path pattern
 * selects, or every drawn flagged mark.
 *
 * The focus selects drawn geometry and marks for world-space bounds; it
 * contains no camera or interactive focus state. focusInspection
 * refuses a selection with no drawn bounds, including flagged focus when no
 * drawn mark is flagged.
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
