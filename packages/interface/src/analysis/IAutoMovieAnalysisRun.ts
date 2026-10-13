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
 * @evidence contracts/common.md#principled-implementation `sealAutoMovieAnalysisRun` digests the settings text and the canonical record with the engine's pure-TypeScript SHA-256 and validates the result before returning it; staleness is a plain string comparison of `inputRevision` with the report revision.
 * @evidence contracts/common.md#clear-and-simple-design Identity, provenance and outcome sit in one flat record so a deserialized run can be checked on its own, with the outcome kept as its own union because the seal builder takes it before any digest exists.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is trusted from the producer: validation recomputes the digest, so an outcome edited after sealing fails, and a revision mismatch is reported as stale rather than silently refreshed.
 * @evidence contracts/common.md#meaningful-documentation States why the input revision makes a result perishable, the digest text format and which fields it covers, and that run ids must be unique within one report.
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
