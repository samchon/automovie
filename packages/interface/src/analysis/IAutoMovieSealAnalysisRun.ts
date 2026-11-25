import type { AutoMovieAnalysisDomain } from "./AutoMovieAnalysisDomain";
import type { IAutoMovieAnalysisOutcome } from "./IAutoMovieAnalysisOutcome";
import type { IAutoMovieAnalysisSolver } from "./IAutoMovieAnalysisSolver";

/** Data and callback contracts shared by the SealAnalysisRun operations. */
export namespace IAutoMovieSealAnalysisRun {
  /**
   * Seal one run: digest the settings, check the record, and digest it only
   * once it is known to validate.
   *
   * Building and checking are the same call on purpose. A builder that can hand
   * back an invalid artifact is a hole in exactly the contract this module
   * exists to hold, so the seal applies the same contents rules a deserialized
   * run faces (`validateAutoMovieAnalysisRunContents`) and throws on the first
   * violation rather than shipping it. The error names the run id and the first
   * violation's path and expectation. The digest it then writes is the one
   * `validateAutoMovieAnalysisRun` recomputes, so the sealed run validates.
   *
   * The settings text is kept only as its SHA-256 digest. The returned run
   * holds the caller's `solver` and `outcome` objects by reference rather than
   * copying them, so editing a covered field after sealing generally breaks
   * digest agreement; unencoded extra fields and numerically equivalent signed
   * zeros do not change the canonical text, and a digest is not a
   * collision-free identity proof.
   */
  export type IProps = {
    /** Stable run identity; non-blank. */
    id: string;

    /** Domain the run answers for. */
    domain: AutoMovieAnalysisDomain;

    /** Open subject label; non-blank. */
    subject: string;

    /** Design revision read; non-blank. */
    inputRevision: string;

    /** Solver identity, kept by reference in the sealed run. */
    solver: IAutoMovieAnalysisSolver;

    /**
     * Canonical text of every setting that changes the result; the run stores
     * only its digest.
     */
    settings: string;

    /** Honest outcome, kept by reference in the sealed run. */
    outcome: IAutoMovieAnalysisOutcome;
  };
}
