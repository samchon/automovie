import {
  AutoMovieAnalysisDomain,
  IAutoMovieAnalysisOutcome,
  IAutoMovieAnalysisRun,
  IAutoMovieAnalysisSolver,
  IAutoMovieConstraintViolation,
  IAutoMovieValidation,
} from "@automovie/interface";

import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { ViolationCollector } from "../validation/ViolationCollector";
import { autoMovieAnalysisRunDigest } from "./autoMovieAnalysisRunDigest";
import { validateAutoMovieAnalysisRunContents } from "./validateAutoMovieAnalysisRunContents";

/**
 * Seal one run: digest the settings, check the record, and digest it only once
 * it is known to validate.
 *
 * Building and checking are the same call on purpose. A builder that can hand
 * back an invalid artifact is a hole in exactly the contract this module exists
 * to hold, so the seal applies the same contents rules a deserialized run faces
 * (`validateAutoMovieAnalysisRunContents`) and throws on the first violation
 * rather than shipping it. The error names the run id and the first violation's
 * path and expectation. The digest it then writes is the one
 * `validateAutoMovieAnalysisRun` recomputes, so the sealed run validates.
 *
 * The settings text is kept only as its SHA-256 digest. The returned run holds
 * the caller's `solver` and `outcome` objects by reference rather than copying
 * them, so editing either after sealing makes the run fail its own digest.
 *
 * @evidence contracts/common.md#principled-implementation Writes the record with the contract's `version: 1` and `automovie.analysis-run.v1` protocol, replaces the settings text with its SHA-256 digest, checks the draft with the contents rules shared with the validator, and only then seals it with `autoMovieAnalysisRunDigest`; because the digest is computed from the very draft returned, the received-run digest check would pass by construction.
 * @evidence contracts/common.md#clear-and-simple-design Every analyzer emits runs through this one function, so the header constants, the settings digest and the refusal live in one place; it reuses the contents validator instead of the public one because the public one adds only the digest check this function makes true by construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The only fixed values are the contract's version and protocol; no solver, domain or outcome is special-cased, and the self-check is a production gate rather than a test hook.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why building and checking are one call, which rules apply, the error's contents, that the settings text is kept only as a digest, and that solver and outcome are held by reference with the consequence of editing them.
 * @evidence contracts/performance.md#efficient-algorithms Dominated by one SHA-256 pass over the canonical run text, linear in metrics, samples (at most 4096) and warnings, plus one hash of the settings text and a linear contents check; a refused draft is never hashed.
 * @evidence contracts/performance.md#reuse-equivalent-work The run digest is computed once and the contents are checked once; the former second hash, which the public validator would spend recomputing a digest this call just wrote from the same draft, is not paid.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The collector is call-local; the returned run, owned by the analyzer that receives it, retains the caller's solver and outcome objects plus two digest strings and nothing else.
 * @author Samchon
 */
export const sealAutoMovieAnalysisRun = (props: {
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
}): IAutoMovieAnalysisRun => {
  const draft: Omit<IAutoMovieAnalysisRun, "digest"> = {
    version: 1,
    protocol: "automovie.analysis-run.v1",
    id: props.id,
    domain: props.domain,
    subject: props.subject,
    inputRevision: props.inputRevision,
    solver: props.solver,
    settings: autoMovieRenderDigest(props.settings),
    outcome: props.outcome,
  };
  const out: ViolationCollector = new ViolationCollector();
  validateAutoMovieAnalysisRunContents(draft, out);
  const validated: IAutoMovieValidation = out.toValidation();
  if (validated.success === false) {
    const first: IAutoMovieConstraintViolation = validated.violations[0]!;
    throw new Error(
      `analysis run "${props.id}" is invalid at ${first.path}: ${first.expected}`,
    );
  }
  return { ...draft, digest: autoMovieAnalysisRunDigest(draft) };
};
