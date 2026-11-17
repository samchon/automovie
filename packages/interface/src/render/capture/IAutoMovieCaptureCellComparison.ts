/**
 * One cell of either capture: paired with its counterpart, or unmatched with the cause.
 *
 * Only pairs whose stills identify the same backend carry numerical pixel differences. Different or unstated backends produce side-by-side outcomes; unmatched outcomes preserve the cause rather than imply equality.
 *
 * @evidence contracts/development/design.md#principled-representation The state and mode discriminants require paired names and distinguish numerical differences from unmatched causes. Numeric ranges, ordered pixel bounds and at least one nonnull unmatched name are producer invariants not enforced by this shape.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The round comparator publishes each cell's comparison independently; command reporting consumes the same paired or unmatched outcome.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An unmatched cell is never counted as unchanged.
 * @evidence contracts/development/common.md#meaningful-documentation States what each member holds and its unit.
 */
export type IAutoMovieCaptureCellComparison =
  | {
      /** Both captures hold the cell and their stills were measured against each other. */
      state: "paired";

      /** Both stills came from the same backend, so pixels are compared. */
      mode: "difference";

      /** Cell name in this capture. */
      current: string;

      /** Cell name in the earlier round. */
      earlier: string;

      /** Pixels whose largest channel difference exceeds the tolerance. */
      changed: number;

      /** `changed` over the pixel count. */
      ratio: number;

      /** Largest channel difference in bytes. */
      maximum: number;

      /** Smallest box holding every changed pixel, inclusive pixel bounds, or null when none changed. */
      bounds: {
        /** Inclusive leftmost changed pixel column, from zero. */
        left: number;

        /** Inclusive topmost changed pixel row, from zero. */
        top: number;

        /** Inclusive rightmost changed pixel column. */
        right: number;

        /** Inclusive bottommost changed pixel row. */
        bottom: number;
      } | null;

      /** File name of the difference image, or null when no pixel changed. */
      difference: string | null;
    }
  | {
      /** Both captures hold the cell, drawn by different or unstated backends. */
      state: "paired";

      /** The stills are laid side by side without a difference image, because pixels from different backends are not compared. */
      mode: "side-by-side";

      /** Cell name in this capture. */
      current: string;

      /** Cell name in the earlier round. */
      earlier: string;
    }
  | {
      /** One capture holds the cell and the other does not, or one of them could not draw it. */
      state: "unmatched";

      /** Cell name in this capture, or null when only the earlier round has it. */
      current: string | null;

      /** Cell name in the earlier round, or null when it has no counterpart. */
      earlier: string | null;

      /** Why the cell is unmatched. */
      cause: string;
    };
