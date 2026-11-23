import type { IAutoMovieFormationSubjectReviewDescription } from "./IAutoMovieFormationSubjectReviewDescription";
import type { IAutoMovieSubjectDescription } from "./IAutoMovieSubjectDescription";

/** Compiled description accepted by the subject-review unit. */
export type IAutoMovieSubjectReviewDescription =
  | IAutoMovieSubjectDescription
  | IAutoMovieFormationSubjectReviewDescription;
