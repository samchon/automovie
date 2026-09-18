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
 * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `IAutoMovieAnalysisRun` as the portable data boundary for the diagnostics failed not run requirement.
 * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `IAutoMovieAnalysisRun` for the validation failed not run states system contract.
 * @author Samchon
 */
export interface IAutoMovieAnalysisRun {
  /**
   * Schema version.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `version` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `version` for the validation failed not run states system contract.
   */
  version: 1;
  /**
   * Versioned run protocol.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `protocol` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `protocol` for the validation failed not run states system contract.
   */
  protocol: "automovie.analysis-run.v1";
  /**
   * Stable run identity within the production.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `id` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `id` for the validation failed not run states system contract.
   */
  id: string;
  /**
   * Domain this run answers for.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `domain` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `domain` for the validation failed not run states system contract.
   */
  domain: AutoMovieAnalysisDomain;
  /**
   * Open subject label, usually the logical space or boundary analysed.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `subject` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `subject` for the validation failed not run states system contract.
   */
  subject: string;
  /**
   * Design revision the run read.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `inputRevision` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `inputRevision` for the validation failed not run states system contract.
   */
  inputRevision: string;
  /**
   * Solver identity.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `solver` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `solver` for the validation failed not run states system contract.
   */
  solver: IAutoMovieAnalysisSolver;
  /**
   * Digest of the canonical settings the run was configured with.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `settings` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `settings` for the validation failed not run states system contract.
   */
  settings: AutoMovieContentDigest;
  /**
   * Honest outcome.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `outcome` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `outcome` for the validation failed not run states system contract.
   */
  outcome: IAutoMovieAnalysisOutcome;
  /**
   * Digest over protocol, identity, solver, settings and outcome.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `digest` as the portable data boundary for the diagnostics failed not run requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `digest` for the validation failed not run states system contract.
   */
  digest: AutoMovieContentDigest;
}
