import { IAutoMovieSubjectBox } from "./IAutoMovieSubjectBox";

/**
 * Declared and resident-content extents kept separate in one stated coordinate basis.
 *
 * @evidence contracts/common.md#principled-implementation Subject describers report authored bounds separately from extents read or measured from compiled content, preserving model or world coordinates; compact instance-set content uses compiled slot-position bounds and excludes model extents.
 * @evidence contracts/common.md#clear-and-simple-design Two nullable boxes and one shared coordinate-space discriminator expose declaration versus observation without inventing a single merged envelope.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No absent declaration or empty content receives a guessed box, and instance position bounds must not be interpreted as the full occupied geometry envelope.
 * @evidence contracts/common.md#meaningful-documentation Defines declared and content ownership, null meaning, shared basis and the compact-position-bound limitation.
 */
export interface IAutoMovieSubjectBounds {
  /** Authored or builder-declared extent, or null when none exists. */
  declared: IAutoMovieSubjectBox | null;

  /** Extent measured from resident compiled content, or null when empty. */
  content: IAutoMovieSubjectBox | null;

  /** Coordinate basis shared by both non-null boxes. */
  coordinateSpace: "model" | "world";
}
