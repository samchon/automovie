import { IAutoMovieSubjectBox } from "./IAutoMovieSubjectBox";

/**
 * Declared and measured extents kept separate for honest inspection.
 *
 * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-compiled-truth Keeps a logical space's declared volume distinct from what its placed content actually fills.
 * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-bounds Types the separate declared and content measurements.
 */
export interface IAutoMovieSubjectBounds {
  /**
   * Authored or builder-declared extent, or null when none exists.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-compiled-truth Preserves absence instead of fabricating a declared extent.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-bounds Carries the independently derived logical-space or compact-set declaration.
   */
  declared: IAutoMovieSubjectBox | null;

  /**
   * Extent measured from resident compiled content, or null when empty.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-compiled-truth Reports actual compiled geometry independently from declarations.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-bounds Carries the deterministic content measurement or explicit absence.
   */
  content: IAutoMovieSubjectBox | null;

  /**
   * Coordinate basis shared by both non-null boxes.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-description Makes spatial answers judgeable without an implicit coordinate frame.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-bounds Distinguishes model-local prototype boxes from world-space placement and space boxes.
   */
  coordinateSpace: "model" | "world";
}
