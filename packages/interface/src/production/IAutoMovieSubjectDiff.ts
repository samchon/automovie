import type { IAutoMovieSubjectChange } from "./IAutoMovieSubjectChange";
import type { IAutoMovieSubjectMemberSummary } from "./IAutoMovieSubjectMemberSummary";

/**
 * Stable-identity structural comparison of two compiled subject inventories
 * without rendering.
 */
export interface IAutoMovieSubjectDiff {
  /** Structural-diff schema version. */
  version: 1;

  /** Revision of the earlier compiled artifact. */
  fromRevision: string;

  /** Revision of the later compiled artifact. */
  toRevision: string;

  /**
   * Inclusive absolute tolerance shared by all numbers; rotation compares one
   * minus the absolute quaternion half-angle cosine.
   */
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
