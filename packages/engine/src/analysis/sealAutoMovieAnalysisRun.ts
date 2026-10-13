import {
  AutoMovieAnalysisDomain,
  IAutoMovieAnalysisOutcome,
  IAutoMovieAnalysisRun,
  IAutoMovieAnalysisSolver,
} from "@automovie/interface";

import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { autoMovieAnalysisRunDigest } from "./autoMovieAnalysisRunDigest";
import { validateAutoMovieAnalysisRun } from "./validateAutoMovieAnalysisRun";

/**
 * Seal one run: digest the settings, digest the record, and refuse to emit a
 * record that would not validate.
 *
 * Building and checking are the same call on purpose. A builder that can hand
 * back an invalid artifact is a hole in exactly the contract this module exists
 * to hold, so the seal runs the same validator a deserialized run faces and
 * throws on the first violation rather than shipping it. The error names the
 * run id and the first violation's path and expectation.
 *
 * The settings text is kept only as its SHA-256 digest. The returned run holds
 * the caller's `solver` and `outcome` objects by reference rather than copying
 * them, so editing either after sealing makes the run fail its own digest.
 *
 * @evidence contracts/common.md#principled-implementation Writes the record in canonical field order, replaces the settings text with its SHA-256 digest, seals the draft with `autoMovieAnalysisRunDigest`, then runs `validateAutoMovieAnalysisRun` and throws on its first violation, so emitting and accepting a run share one rule set.
 * @evidence contracts/common.md#clear-and-simple-design The daylight, envelope, acoustics and space-air analyzers all seal through this function, which alone owns the schema version, protocol string and digest order instead of each solver writing them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The only fixed values are the contract's `version: 1` and `automovie.analysis-run.v1` protocol; no solver, domain or outcome is special-cased, and the self-validation is a production gate rather than a test hook.
 * @evidence contracts/common.md#meaningful-documentation States the two digests, the refusal and what its message names, that settings survive only as a digest, and that solver and outcome are aliased rather than copied.
 * @evidence contracts/performance.md#cost-and-resources Dominated by building and hashing the canonical run text in pure TypeScript SHA-256, linear in metrics, samples (at most 4096) and warnings; the validator then rebuilds and rehashes the same draft, so every seal pays that hash twice although the second cannot differ. The returned run retains the caller's solver and outcome objects plus two digest strings, owned by the analyzer that receives it.
 * @author Samchon
 */
export const sealAutoMovieAnalysisRun = (props: {
  /** Stable run identity. */
  id: string;

  /** Domain the run answers for. */
  domain: AutoMovieAnalysisDomain;

  /** Open subject label. */
  subject: string;

  /** Design revision read. */
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
}): IAutoMovieAnalysisRun => {
  const draft = {
    version: 1,
    protocol: "automovie.analysis-run.v1",
    id: props.id,
    domain: props.domain,
    subject: props.subject,
    inputRevision: props.inputRevision,
    solver: props.solver,
    settings: autoMovieRenderDigest(props.settings),
    outcome: props.outcome,
  } as const;
  const run: IAutoMovieAnalysisRun = {
    ...draft,
    digest: autoMovieAnalysisRunDigest(draft),
  };
  const validated = validateAutoMovieAnalysisRun({ run });
  if (validated.success === false) {
    const first = validated.violations[0]!;
    throw new Error(
      `analysis run "${props.id}" is invalid at ${first.path}: ${first.expected}`,
    );
  }
  return run;
};
