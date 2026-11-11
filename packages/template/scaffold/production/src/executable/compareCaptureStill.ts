import {
  type IAutoMovieRasterComparison,
  type IAutoMovieRasterImage,
  compareAutoMovieRasters,
} from "@automovie/viewer";

/**
 * Compare one still against the still of the same name in an earlier round.
 *
 * The entry is the still's line of the comparison record: its name, its changed pixel count, their share of the picture, the largest channel difference and the box that holds the change. A still with at least one changed pixel also gets a difference image named `diff-<still>`, the newer picture in dimmed grey with every changed pixel in magenta; an unchanged still gets none.
 *
 * It throws naming the still when the pair differs in size, which means the two rounds were not drawn at one raster.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the entry lists, when a difference image is made and how it is named and coloured, and the refusal with its meaning.
 * @evidence contracts/development/implementation.md#principled-implementation The measure and the difference image are the viewer's comparison, so a round is judged by the same pixel rule as any two rasters.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One comparison, then the entry and the optional image.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Pictures of different sizes throw with the still's name instead of being resampled, and no verdict is stored: the reader knows what was meant to change.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the pixels of the pair, in the viewer's one pass.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each pair is compared once.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Neither picture is retained; an unchanged still's difference image is dropped here.
 */
export function compareCaptureStill(props: {
  /** File name of the still in both rounds. */
  frame: string;

  /** The earlier round's picture. */
  earlier: IAutoMovieRasterImage;

  /** The picture just written. */
  later: IAutoMovieRasterImage;

  /** Largest channel difference, in bytes, that still counts as unchanged. */
  tolerance: number;
}): {
  /** The still's line of the comparison record. */
  entry: Omit<IAutoMovieRasterComparison, "image"> & {
    /** File name of the still. */
    frame: string;
  };

  /** The difference image of a changed still, or undefined when no pixel changed. */
  difference:
    | {
        /** File name of the difference image, `diff-<still>`. */
        file: string;

        /** The picture. */
        image: IAutoMovieRasterImage;
      }
    | undefined;
} {
  let comparison: IAutoMovieRasterComparison;
  try {
    comparison = compareAutoMovieRasters(
      props.earlier,
      props.later,
      props.tolerance,
    );
  } catch (error) {
    throw new Error(
      `${props.frame} cannot be compared against the earlier round: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
  const { image, ...numbers } = comparison;
  return {
    entry: { frame: props.frame, ...numbers },
    difference:
      comparison.changed > 0
        ? { file: `diff-${props.frame}`, image }
        : undefined,
  };
}
