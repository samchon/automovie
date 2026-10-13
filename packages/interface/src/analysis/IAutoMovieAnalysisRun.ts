import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";
import { AutoMovieAnalysisDomain } from "./AutoMovieAnalysisDomain";
import { IAutoMovieAnalysisOutcome } from "./IAutoMovieAnalysisOutcome";
import { IAutoMovieAnalysisSolver } from "./IAutoMovieAnalysisSolver";

/**
 * One analysis run: what was asked, of which design revision, by which solver,
 * and what came back.
 *
 * {@link inputRevision} makes a result perishable. A run that read revision
 * `r7` is evidence about `r7` only, so a report assembled at `r8` counts it as
 * stale rather than as an answer. {@link digest} seals the record, so a run
 * whose outcome was edited after sealing fails validation instead of passing as
 * a measurement.
 *
 * @evidence contracts/common.md#principled-implementation `sealAutoMovieAnalysisRun` digests the settings text, checks the record with the contents rules `validateAutoMovieAnalysisRun` also applies, throws on the first violation, and only then digests the record; the validator recomputes that digest, so the stored seal is checked against the same canonical text that produced it.
 * @evidence contracts/common.md#clear-and-simple-design The settings are stored only as a digest because a run must prove what it was configured with, not replay it; the solver and outcome stay nested records the digest reads in fixed order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The canonical digest text writes every line as one JSON array, so a newline or `|` inside a field is escaped and cannot move across a field boundary without changing the digest; no character is forbidden to make the text unambiguous.
 * @evidence contracts/common.md#meaningful-documentation States why the input revision makes a result stale, what the digest seals and that validation recomputes it, the digest text form, and the id uniqueness a report enforces.
 * @author Samchon
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
  settings: AutoMovieContentDigest;

  /** What the run produced, or why it produced nothing. */
  outcome: IAutoMovieAnalysisOutcome;

  /**
   * Digest over protocol, version, id, domain, subject, input revision, solver,
   * settings and outcome, in the same `sha256:` form; validation recomputes it.
   */
  digest: AutoMovieContentDigest;
}
