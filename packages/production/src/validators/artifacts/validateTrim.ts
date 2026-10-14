import { pushViolation, validateObjectArtifact, validateRange } from "@automovie/engine";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";

/**
 * Collect shape, finite range and played-span errors for a sequence trim in seconds. A known finite shot duration bounds start plus duration; a missing shot is refused by the sequence owner and supplies no duration bound here.
 *
 * @evidence contracts/common.md#principled-implementation Start is finite and non-negative, duration finite and positive, and their sum may equal but not exceed a known shot duration; unknown shot resolution remains the sequence owner's refusal.
 * @evidence contracts/common.md#clear-and-simple-design One trim owns its shape and span checks, while the sequence resolves shots and compares incoming transitions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No trim is silently clipped, and an unknown shot contributes no invented finite bound.
 * @evidence contracts/common.md#meaningful-documentation States seconds, interval endpoints, complete-span constraint and missing-shot ownership.
 * @evidence contracts/performance.md#efficient-algorithms Fixed scalar checks and one sum take constant work and append only a fixed number of findings.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call checks one trim against its supplied shot bound without cross-call sharing.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only caller-owned findings persist; no trim, handle or task is retained privately.
 */
export function validateTrim(trim: unknown, shotDuration: number, path: string, violations: IAutoMovieConstraintViolation[]): void {
  if (!validateObjectArtifact(trim, path, "sequence trim", violations)) return;
  validateRange(
    trim.start,
    `${path}.start`,
    0,
    Infinity,
    "trim start",
    violations,
  );
  validateRange(
    trim.duration,
    `${path}.duration`,
    0,
    Infinity,
    "trim duration",
    violations,
    false,
  );
  const start: number = typeof trim.start === "number" ? trim.start : NaN;
  const duration: number = typeof trim.duration === "number" ? trim.duration : NaN;
  if (
    Number.isFinite(shotDuration) &&
    Number.isFinite(start) &&
    Number.isFinite(duration) &&
    start + duration > shotDuration
  )
    pushViolation(
      violations,
      "temporal",
      path,
      `trim start + duration must fit within shot duration ${shotDuration}`,
      trim,
    );
}
