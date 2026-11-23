import type { AutoMovieAnalysisDomain } from "./AutoMovieAnalysisDomain";
import type { IAutoMovieAnalysisOutcome } from "./IAutoMovieAnalysisOutcome";
import type { IAutoMovieAnalysisSolver } from "./IAutoMovieAnalysisSolver";

/**
 * One analysis run: what was asked, of which design revision, by which solver,
 * and what came back.
 *
 * {@link inputRevision} makes a result perishable. A run that names revision
 * `r7` is counted stale by a report for `r8`; the producing owner must
 * establish which inputs were actually read. The digest binds covered canonical
 * fields, not solver execution or scientific accuracy: changed encoded fields
 * generally break the seal, while extra unencoded fields and signed-zero
 * changes do not, and hash collisions remain possible.
 */
export interface IAutoMovieAnalysisRun {
  /** Schema version. */
  version: 1;

  /** Versioned run protocol. */
  protocol: "automovie.analysis-run.v1";

  /** Non-blank stable run identity; a report refuses two runs with one id. */
  id: string;

  /** Domain this run answers for. */
  domain: AutoMovieAnalysisDomain;

  /**
   * Non-blank open subject label, usually the logical space or boundary
   * analysed.
   */
  subject: string;

  /** Non-blank design revision the run read. */
  inputRevision: string;

  /** Solver identity. */
  solver: IAutoMovieAnalysisSolver;

  /**
   * Digest of the canonical settings text the run was configured with, written
   * `sha256:` followed by 64 lowercase hex digits.
   */
  settings: string;

  /** What the run produced, or why it produced nothing. */
  outcome: IAutoMovieAnalysisOutcome;

  /**
   * Digest over protocol, version, id, domain, subject, input revision, solver,
   * settings and outcome, in the same `sha256:` form; validation recomputes
   * it.
   */
  digest: string;
}
