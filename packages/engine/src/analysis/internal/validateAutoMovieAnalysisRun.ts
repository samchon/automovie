import {
  IAutoMovieAnalysisRun,
  type IAutoMovieValidateAnalysisRun,
  IAutoMovieValidation,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { AutoMovieEngineViolationCollector } from "../../validation/AutoMovieEngineViolationCollector";
import { SHA256_DIGEST_PATTERN } from "../../validation/SHA256_DIGEST_PATTERN";
import { autoMovieAnalysisRunDigest } from "./autoMovieAnalysisRunDigest";
import { validateAutoMovieAnalysisRunContents } from "./validateAutoMovieAnalysisRunContents";

/*
 * Validate one analysis run as evidence.
 *
 * The contents follow `validateAutoMovieAnalysisRunContents`: an absent
 * measurement must stay visibly absent, and a spatial sample may only field a
 * metric that produced a value. On top of that the digest is recomputed, so a
 * run whose outcome was edited after sealing fails here rather than being read
 * as a measurement.
 *
 * Passing `revision` additionally asks whether the run is still about the
 * current design. A run that read an older revision is reported as stale: it
 * was a real measurement of a building that no longer exists.
 *
 * Every violation is returned rather than thrown, with paths rooted at
 * `$input`: the contents first, then the digest, then staleness. The rules are
 * semantic: the run must already have the declared shape, because nested fields
 * such as `solver.id` are read without a guard, so a JSON value missing one
 * throws a `TypeError` instead of producing a violation.
 */
export function validateAutoMovieAnalysisRun(
  props: IAutoMovieValidateAnalysisRun.IProps,
): IAutoMovieValidation {
  const run: IAutoMovieAnalysisRun = props.run;
  const out: IAutoMovieViolationCollector = new AutoMovieEngineViolationCollector();
  validateAutoMovieAnalysisRunContents(run, out);
  if (!SHA256_DIGEST_PATTERN.test(run.digest))
    out.push(
      "type",
      "$input.digest",
      `analysis run digest must be a lowercase "sha256:" hex digest, but was ${String(run.digest)}`,
      run.digest,
    );
  const expected: string = autoMovieAnalysisRunDigest(run);
  if (run.digest !== expected)
    out.push(
      "type",
      "$input.digest",
      `analysis run digest ${run.digest} does not seal its own contents ${expected}`,
      run.digest,
    );
  if (props.revision !== undefined && run.inputRevision !== props.revision)
    out.push(
      "type",
      "$input.inputRevision",
      `analysis run read design revision "${run.inputRevision}" while the design is at "${props.revision}"; the result is stale`,
      run.inputRevision,
    );
  return out.toValidation();
}
