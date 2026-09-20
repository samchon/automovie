import { IAutoMovieSubjectDescription } from "./IAutoMovieSubjectDescription";
import { IAutoMovieFormationSubjectReviewDescription } from "./IAutoMovieFormationSubjectReviewDescription";

/**
 * Compiled description accepted by the subject-review unit.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-identity Combines structural subjects with the independently compiled formation kind acceptance may name.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-record Preserves the different source records instead of forcing one into the other's vocabulary.
 * @author Samchon
 */
export type AutoMovieSubjectReviewDescription =
  | IAutoMovieSubjectDescription
  | IAutoMovieFormationSubjectReviewDescription;
