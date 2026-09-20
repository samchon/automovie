import { IAutoMovieSubjectReviewCoverage, IAutoMovieSubjectReviewTarget, IAutoMovieSubjectReviewUnit, IAutoMovieSubjectReviewViewpoint } from "@automovie/interface";
import { IAutoMovieCurrentSubjectReviewObservation } from "./IAutoMovieCurrentSubjectReviewObservation";
import { IAutoMovieSubjectReviewCurrentContext } from "./IAutoMovieSubjectReviewCurrentContext";

/**
 * Fold planned subject viewpoints against current observation receipts.
 *
 * The function accepts unknown records at the evidence boundary so a frame
 * receipt, malformed payload, or another subject can be counted as foreign
 * without being cast into subject coverage. Plan order is authoritative and
 * preserved; unrelated input order cannot change the result.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-evidence Refuses stale, malformed and wrong-subject receipts as current subject evidence.
 * @evidence requirements/review/subject-inspection.md#review-subject-coverage Separates the declared viewpoint denominator from current, missing and stale observations.
 * @evidence requirements/review/subject-inspection.md#review-subject-time-noninterchange Prevents frame-shaped evidence from satisfying a subject obligation.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-observation Admits only receipt-shaped subject observations bound to this identity and revision.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-freshness Makes a changed compiled revision stale without treating a shot rerender as renewal.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-coverage Computes deterministic planned, actual and missing coverage without duplicate inflation.
 */
export const foldAutoMovieSubjectReviewCoverage = (
  unit: IAutoMovieSubjectReviewUnit,
  current: IAutoMovieSubjectReviewCurrentContext,
  viewpoints: readonly IAutoMovieSubjectReviewViewpoint[],
  observations: readonly unknown[],
): IAutoMovieSubjectReviewCoverage => {
  validateCurrentContext(unit, current);
  validateViewpointPlan(viewpoints);
  const planned = viewpoints.map((viewpoint) => viewpoint.id);
  const plannedSet = new Set(planned);
  const observedSet = new Set<string>();
  const staleSet = new Set<string>();
  const unplannedSet = new Set<string>();
  let foreign = 0;
  let duplicates = 0;
  for (const candidate of observations) {
    if (
      !isCurrentSubjectObservation(candidate) ||
      candidate.productionId !== current.productionId ||
      candidate.subject !== unit.description.id ||
      candidate.target.shot !== current.target.shot ||
      candidate.target.subject !== current.target.subject
    ) {
      ++foreign;
      continue;
    }
    if (!plannedSet.has(candidate.viewpoint)) {
      if (isCurrentObservationContext(candidate, current))
        unplannedSet.add(candidate.viewpoint);
      else ++foreign;
      continue;
    }
    if (!isCurrentObservationContext(candidate, current)) {
      staleSet.add(candidate.viewpoint);
      continue;
    }
    if (observedSet.has(candidate.viewpoint)) ++duplicates;
    else observedSet.add(candidate.viewpoint);
  }
  const observed = planned.filter((id) => observedSet.has(id));
  const missing = planned.filter((id) => !observedSet.has(id));
  const stale = planned.filter(
    (id) => staleSet.has(id) && !observedSet.has(id),
  );
  return {
    state:
      planned.length === 0
        ? "indeterminate"
        : observed.length === planned.length
          ? "reviewed"
          : observed.length !== 0
            ? "partial"
            : stale.length !== 0
              ? "stale"
              : "not-run",
    planned,
    observed,
    missing,
    stale,
    unplanned: [...unplannedSet].sort(compareCodeUnits),
    foreign,
    duplicates,
  };
};

const validateCurrentContext = (
  unit: IAutoMovieSubjectReviewUnit,
  current: IAutoMovieSubjectReviewCurrentContext,
): void => {
  if (
    current.productionId.trim().length === 0 ||
    current.target.shot.trim().length === 0 ||
    current.target.subject !== unit.description.id ||
    current.target.shot !== unit.target.shot ||
    current.revision !== unit.description.revision ||
    /^sha256:[0-9a-f]{64}$/u.test(current.compileFingerprint) === false ||
    /^sha256:[0-9a-f]{64}$/u.test(current.planIdentity) === false ||
    current.captureRuntimeIdentity.trim().length === 0
  )
    throw new Error(
      "Subject review current context must exactly name the resolved unit, current compile, ordered plan, and canonical runtime.",
    );
};

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
