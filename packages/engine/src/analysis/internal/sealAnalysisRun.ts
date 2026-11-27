import {
  IAutoMovieAnalysisRun,
  IAutoMovieConstraintViolation,
  type IAutoMovieSealAnalysisRun,
  IAutoMovieValidation,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { renderDigest } from "../../render/internal/renderDigest";
import { AutoMovieEngineViolationCollector } from "../../validation/AutoMovieEngineViolationCollector";
import { analysisRunDigest } from "./analysisRunDigest";
import { validateAnalysisRunContents } from "./validateAnalysisRunContents";

/*
 * Seal one run: digest the settings, check the record, and digest it only once
 * it is known to validate.
 *
 * Building and checking are the same call on purpose. A builder that can hand
 * back an invalid artifact is a hole in exactly the contract this module exists
 * to hold, so the seal applies the same contents rules a deserialized run faces
 * (`validateAnalysisRunContents`) and throws on the first violation
 * rather than shipping it. The error names the run id and the first violation's
 * path and expectation. The digest it then writes is the one
 * `validateAnalysisRun` recomputes, so the sealed run validates.
 *
 * The settings text is kept only as its SHA-256 digest. The returned run holds
 * the caller's `solver` and `outcome` objects by reference rather than copying
 * them, so editing a covered field after sealing generally breaks digest
 * agreement; unencoded extra fields and numerically equivalent signed zeros do
 * not change the canonical text, and a digest is not a collision-free identity
 * proof.
 */
export function sealAnalysisRun(
  props: IAutoMovieSealAnalysisRun.IProps,
): IAutoMovieAnalysisRun {
  const draft: Omit<IAutoMovieAnalysisRun, "digest"> = {
    version: 1,
    protocol: "automovie.analysis-run.v1",
    id: props.id,
    domain: props.domain,
    subject: props.subject,
    inputRevision: props.inputRevision,
    solver: props.solver,
    settings: renderDigest(props.settings),
    outcome: props.outcome,
  };
  const out: IAutoMovieViolationCollector = new AutoMovieEngineViolationCollector();
  validateAnalysisRunContents(draft, out);
  const validated: IAutoMovieValidation = out.toValidation();
  if (validated.success === false) {
    const first: IAutoMovieConstraintViolation = validated.violations[0]!;
    throw new Error(
      `analysis run "${props.id}" is invalid at ${first.path}: ${first.expected}`,
    );
  }
  return { ...draft, digest: analysisRunDigest(draft) };
}
