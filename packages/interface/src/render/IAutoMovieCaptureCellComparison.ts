/**
 * One cell of either capture: paired with its counterpart, or unmatched with
 * the cause.
 *
 * Only pairs whose stills identify the same backend carry numerical pixel
 * differences. Different or unstated backends produce side-by-side outcomes;
 * unmatched outcomes preserve the cause rather than imply equality.
 */
export type IAutoMovieCaptureCellComparison =
  | {
      /**
       * Both captures hold the cell and their stills were measured against each
       * other.
       */
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

      /**
       * Smallest box holding every changed pixel, inclusive pixel bounds, or
       * null when none changed.
       */
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

      /**
       * The stills are laid side by side without a difference image, because
       * pixels from different backends are not compared.
       */
      mode: "side-by-side";

      /** Cell name in this capture. */
      current: string;

      /** Cell name in the earlier round. */
      earlier: string;
    }
  | {
      /** A compatible counterpart is absent, ambiguous or undrawn. */
      state: "unmatched";

      /** Cell name in this capture, or null when only the earlier round has it. */
      current: string | null;

      /** Cell name in the earlier round, or null when it has no counterpart. */
      earlier: string | null;

      /** Why the cell is unmatched. */
      cause: string;
    };
