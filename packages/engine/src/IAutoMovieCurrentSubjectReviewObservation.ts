import { IAutoMovieSubjectReviewObservation, IAutoMovieSubjectReviewTarget, IAutoMovieSubjectReviewViewpoint } from "@automovie/interface";
import { IAutoMovieSubjectReviewCurrentContext } from "./IAutoMovieSubjectReviewCurrentContext";

/**
 * Production-verified observation admitted at the engine boundary.
 *
 * The production verifier creates this projection only after checking the
 * exact persisted schema, pose, owned artifact bytes and terminal verdict.
 */
export interface IAutoMovieCurrentSubjectReviewObservation
  extends
    IAutoMovieSubjectReviewObservation,
    IAutoMovieSubjectReviewCurrentContext {
  /** Exact target repeated on the receipt for an independent context join. */
  target: IAutoMovieSubjectReviewTarget;
  /** Only a terminal pass can enter the coverage numerator. */
  verdict: "passed";
}

const validateViewpointPlan = (
  viewpoints: readonly IAutoMovieSubjectReviewViewpoint[],
): void => {
  const ids = new Set<string>();
  for (const viewpoint of viewpoints) {
    if (viewpoint.id.trim().length === 0)
      throw new RangeError("Subject review viewpoint id must not be blank.");
    if (ids.has(viewpoint.id))
      throw new RangeError(
        `Subject review viewpoint id "${viewpoint.id}" is duplicated.`,
      );
    ids.add(viewpoint.id);
    if (!Number.isFinite(viewpoint.distance) || viewpoint.distance <= 0)
      throw new RangeError(
        `Subject review viewpoint "${viewpoint.id}" distance must be finite and positive.`,
      );
    const direction = viewpoint.direction;
    const length = Math.hypot(direction.x, direction.y, direction.z);
    if (!Number.isFinite(length) || Math.abs(length - 1) > 1e-6)
      throw new RangeError(
        `Subject review viewpoint "${viewpoint.id}" direction must be a finite unit vector.`,
      );
  }
};

const isCurrentSubjectObservation = (
  value: unknown,
): value is IAutoMovieCurrentSubjectReviewObservation => {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    return false;
  const record = value as Record<string, unknown>;
  return (
    record.kind === "subject-view" &&
    nonBlank(record.subject) &&
    nonBlank(record.revision) &&
    nonBlank(record.viewpoint) &&
    nonBlank(record.artifact) &&
    nonBlank(record.digest) &&
    nonBlank(record.productionId) &&
    isTarget(record.target) &&
    nonBlank(record.compileFingerprint) &&
    nonBlank(record.planIdentity) &&
    nonBlank(record.captureRuntimeIdentity) &&
    isRecord(record.pose) &&
    isRecord(record.runtimeIdentity) &&
    record.verdict === "passed" &&
    record.deliveryEvidence === false &&
    (record.target as IAutoMovieSubjectReviewTarget).subject === record.subject
  );
};

const isCurrentObservationContext = (
  observation: IAutoMovieCurrentSubjectReviewObservation,
  current: IAutoMovieSubjectReviewCurrentContext,
): boolean =>
  observation.revision === current.revision &&
  observation.compileFingerprint === current.compileFingerprint &&
  observation.planIdentity === current.planIdentity &&
  observation.captureRuntimeIdentity === current.captureRuntimeIdentity;

const isTarget = (value: unknown): value is IAutoMovieSubjectReviewTarget => {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    return false;
  const record = value as Record<string, unknown>;
  return nonBlank(record.shot) && nonBlank(record.subject);
};

const nonBlank = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length !== 0;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && Array.isArray(value) === false;

const compareCodeUnits = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const isTarget = (value: unknown): value is IAutoMovieSubjectReviewTarget => {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    return false;
  const record = value as Record<string, unknown>;
  return nonBlank(record.shot) && nonBlank(record.subject);
};

const nonBlank = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length !== 0;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && Array.isArray(value) === false;
