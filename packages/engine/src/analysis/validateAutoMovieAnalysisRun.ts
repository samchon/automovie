import {
  IAutoMovieAnalysisRun,
  IAutoMovieValidation,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { SHA256_DIGEST_PATTERN } from "../validation/constants/SHA256_DIGEST_PATTERN";
import { autoMovieAnalysisRunDigest } from "./autoMovieAnalysisRunDigest";
import { validateAutoMovieAnalysisRunContents } from "./validateAutoMovieAnalysisRunContents";

/**
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
 * semantic: the run must already have the declared shape, because nested
 * fields such as `solver.id` are read without a guard, so a JSON value missing
 * one throws a `TypeError` instead of producing a violation.
 *
 * @evidence contracts/common.md#principled-implementation Runs the shared contents rules, checks the `digest` field against the lowercase `sha256:` pattern, recomputes `autoMovieAnalysisRunDigest` over the received contents and compares strings, then compares `inputRevision` with the optional current revision; a recomputed SHA-256 detects any edit to a field the canonical text covers.
 * @evidence contracts/common.md#clear-and-simple-design This function owns only what a received run needs beyond the seal path, the digest and staleness; the contents rules live in `validateAutoMovieAnalysisRunContents` so the seal can apply them before hashing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The digest pattern and the canonical text are contract rules shared with the seal, and no run, solver or domain is exempt from the recomputation.
 * @evidence contracts/common.md#meaningful-documentation The documentation states what the contents rules defend, that the digest is recomputed and why, what `revision` adds, the violation order and root, and the shape premise with its `TypeError` consequence.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the run's metrics, samples and warnings for the contents pass, then one SHA-256 pass over the canonical text, which dominates and is required because only rehashing proves the contents unedited.
 * @evidence contracts/performance.md#reuse-equivalent-work No digest is cached on the run or across calls: a received run must be re-proven each time, and the seal path no longer calls this function, so a freshly sealed run is hashed once rather than twice.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The collector and the recomputed digest string are call-local; the returned validation, owned by the caller, holds the violations, which may reference fragments of the run.
 * @author Samchon
 */
export const validateAutoMovieAnalysisRun: (props: { /** Run to check; it must already have the declared shape. */ run : IAutoMovieAnalysisRun ; /** Current design revision, when staleness is being checked. */ revision ? : string ; }) => IAutoMovieValidation = (props: {
  /** Run to check; it must already have the declared shape. */
  run: IAutoMovieAnalysisRun;

  /** Current design revision, when staleness is being checked. */
  revision?: string;
}): IAutoMovieValidation => {
  const run: IAutoMovieAnalysisRun = props.run;
  const out: ViolationCollector = new ViolationCollector();
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
};
