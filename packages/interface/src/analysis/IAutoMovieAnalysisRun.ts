import { AutoMovieAnalysisDomain } from "./AutoMovieAnalysisDomain";
import { IAutoMovieAnalysisOutcome } from "./IAutoMovieAnalysisOutcome";
import { IAutoMovieAnalysisSolver } from "./IAutoMovieAnalysisSolver";

/**
 * One analysis run: what was asked, of which design revision, by which solver, and what came back.
 *
 * {@link inputRevision} makes a result perishable. A run that names revision `r7` is counted stale by a report for `r8`; the producing owner must establish which inputs were actually read. The digest binds covered canonical fields, not solver execution or scientific accuracy: changed encoded fields generally break the seal, while extra unencoded fields and signed-zero changes do not, and hash collisions remain possible.
 *
 * @evidence contracts/common.md#principled-implementation `sealAutoMovieAnalysisRun` digests the settings text, checks the record with the contents rules `validateAutoMovieAnalysisRun` also applies, throws on the first violation, and only then digests the record; the validator recomputes that digest, so the stored seal is checked against the same canonical text that produced it.
 * @evidence contracts/common.md#clear-and-simple-design Only the supplied canonical settings text's digest is stored; complete settings acquisition belongs to the producer. Solver and outcome stay nested records read in fixed order and are retained by reference by sealing, so later mutation requires resealing or renewed validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts JSON-array lines escape embedded separators without banning characters. Admission visits missing metric/sample/warning slots, but other nested containers and ordinary data fields remain typed premises and malformed host records can throw before returning violations; sealing is neither an exact-key schema check nor independent execution provenance.
 * @evidence contracts/common.md#meaningful-documentation States why the input revision makes a result stale, what the digest seals and that validation recomputes it, the digest text form, and the id uniqueness a report enforces.
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
   * Non-blank open subject label, usually the logical space or boundary analysed.
   */
  subject: string;

  /** Non-blank design revision the run read. */
  inputRevision: string;

  /** Solver identity. */
  solver: IAutoMovieAnalysisSolver;

  /**
   * Digest of the canonical settings text the run was configured with, written `sha256:` followed by 64 lowercase hex digits.
   */
  settings: string;

  /** What the run produced, or why it produced nothing. */
  outcome: IAutoMovieAnalysisOutcome;

  /**
   * Digest over protocol, version, id, domain, subject, input revision, solver, settings and outcome, in the same `sha256:` form; validation recomputes it.
   */
  digest: string;
}
