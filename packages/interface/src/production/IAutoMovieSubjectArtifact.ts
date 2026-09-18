import { IAutoMovieCompiledShotSource } from "./IAutoMovieCompiledShotSource";

/**
 * One compiled shot paired with the revision that makes its answers fresh.
 *
 * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-description Binds every subject answer to the compiled revision that supplied it.
 * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-record Supplies the artifact and revision inputs of deterministic subject inspection.
 */
export interface IAutoMovieSubjectArtifact {
  /**
   * Stable content or compile revision of {@link compiled}.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-description Makes the answer's source revision explicit to the reviewer.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-record Types the revision copied into every description record.
   */
  revision: string;
  /**
   * Fully compiled shot data inspected by the engine.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-compiled-truth Makes render-consumed compiled data the authority for subject answers.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-bounds Supplies the compiled geometry and placement facts measured by inspection.
   */
  compiled: IAutoMovieCompiledShotSource;
}
