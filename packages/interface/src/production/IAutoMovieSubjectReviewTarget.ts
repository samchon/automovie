/**
 * One compiled subject addressed independently from a film-time review target.
 *
 * The shot qualifies the compiled artifact that owns the subject; inspection uses its own viewpoint rather than that shot's film camera.
 *
 * @evidence contracts/common.md#principled-implementation A shot artifact id and namespaced subject address resolve one exact compiled subject through shared inspection, preventing identically named subjects from another artifact from sharing coverage.
 * @evidence contracts/common.md#clear-and-simple-design Two identifiers provide artifact qualification without a frame index or an unrelated film-time target.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The shot address does not imply that its delivery camera observed this subject; viewpoint authority remains with inspection and missing subjects refuse resolution.
 * @evidence contracts/common.md#meaningful-documentation Defines compiled artifact qualification, stable namespaced subject identity and independence from the shot's camera.
 */
export interface IAutoMovieSubjectReviewTarget {
  /** Compiled shot artifact that contains the subject. */
  shot: string;

  /** Stable namespaced subject id inside the compiled artifact. */
  subject: string;
}
