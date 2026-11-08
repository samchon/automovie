import { IAutoMovieSubjectChange } from "./IAutoMovieSubjectChange";
import { IAutoMovieSubjectMemberSummary } from "./IAutoMovieSubjectMemberSummary";

/**
 * Stable-identity structural comparison of two compiled subject inventories without rendering.
 *
 * @evidence contracts/development/design.md#principled-representation diffAutoMovieSubjects matches namespaced ids and independently compares placement and reusable structure projections with one inclusive numeric tolerance and quaternion sign equivalence; additions and removals are exclusive while common subjects can both move and reshape.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four complete change lists and one bounded unchanged summary expose structural consequences without mixing image-digest changes or visual review verdicts into the result.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unknown identities cannot be merged by delimiter collisions, and tolerance is currently shared across all numeric fields including counts and seeds rather than claiming unit-specific physical error thresholds.
 * @evidence contracts/development/common.md#meaningful-documentation Defines revisions, inclusive common tolerance, placement versus shape categories, possible moved/reshaped overlap and bounded unchanged members.
 */
export interface IAutoMovieSubjectDiff {
  /** Structural-diff schema version. */
  version: 1;

  /** Revision of the earlier compiled artifact. */
  fromRevision: string;

  /** Revision of the later compiled artifact. */
  toRevision: string;

  /** Inclusive absolute tolerance shared by all numbers; rotation compares one minus the absolute quaternion half-angle cosine. */
  tolerance: number;

  /** Subjects present only in the later revision. */
  added: IAutoMovieSubjectChange[];

  /** Subjects present only in the earlier revision. */
  removed: IAutoMovieSubjectChange[];

  /** Common subjects whose placement state changed. */
  moved: IAutoMovieSubjectChange[];

  /** Common subjects whose reusable structure or population law changed. */
  reshaped: IAutoMovieSubjectChange[];

  /** Bounded summary of common subjects in neither changed category. */
  unchanged: IAutoMovieSubjectMemberSummary;
}
