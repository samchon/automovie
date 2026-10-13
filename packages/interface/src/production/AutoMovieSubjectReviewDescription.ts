import { IAutoMovieFormationSubjectReviewDescription } from "./IAutoMovieFormationSubjectReviewDescription";
import { IAutoMovieSubjectDescription } from "./IAutoMovieSubjectDescription";

/**
 * Compiled description accepted by the subject-review unit.
 *
 * @author Samchon
 */
export type AutoMovieSubjectReviewDescription =
  | IAutoMovieSubjectDescription
  | IAutoMovieFormationSubjectReviewDescription;
