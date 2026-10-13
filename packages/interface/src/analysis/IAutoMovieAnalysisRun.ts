import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";
import { AutoMovieAnalysisDomain } from "./AutoMovieAnalysisDomain";
import { IAutoMovieAnalysisOutcome } from "./IAutoMovieAnalysisOutcome";
import { IAutoMovieAnalysisSolver } from "./IAutoMovieAnalysisSolver";

/**
 * One analysis run: what was asked, of which design revision, by which solver,
 * and what honestly came back.
 *
 * {@link inputRevision} is what makes a result perishable. A run that read
 * revision `r7` is evidence about `r7` and about nothing else, so a report
 * assembled at `r8` reports it as stale rather than counting it as an answer.
 * {@link digest} seals the whole record, so an artifact whose outcome was edited
 * after the fact fails validation instead of passing as a measurement.
 *
 * @author Samchon
 */
export interface IAutoMovieAnalysisRun {
  /** Schema version. */
  version: 1;

  /** Versioned run protocol. */
  protocol: "automovie.analysis-run.v1";

  /** Stable run identity; a report refuses two runs with the same id. */
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
  settings: AutoMovieContentDigest;

  /** Honest outcome. */
  outcome: IAutoMovieAnalysisOutcome;

  /**
   * Digest over protocol, version, id, domain, subject, input revision, solver,
   * settings and outcome, in the same `sha256:` form; validation recomputes it.
   */
  digest: AutoMovieContentDigest;
}
