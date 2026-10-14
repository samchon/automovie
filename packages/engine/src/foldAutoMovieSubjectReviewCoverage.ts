import {
  IAutoMovieSubjectReviewCoverage,
  IAutoMovieSubjectReviewTarget,
  IAutoMovieSubjectReviewUnit,
  IAutoMovieSubjectReviewViewpoint,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieCurrentSubjectReviewObservation } from "./IAutoMovieCurrentSubjectReviewObservation";
import { IAutoMovieSubjectReviewCurrentContext } from "./IAutoMovieSubjectReviewCurrentContext";
import { compareCodeUnits } from "./text/compareCodeUnits";
import { SHA256_DIGEST_PATTERN } from "./validation/constants/SHA256_DIGEST_PATTERN";
import { isRecord } from "./validation/isRecord";

/**
 * Fold planned subject viewpoints against current observation receipts.
 *
 * Observations arrive as `unknown` at the evidence boundary, so a frame
 * receipt, a malformed payload or another subject's view is counted as
 * `foreign` without being cast into subject coverage. A well-formed view of
 * this production, shot and subject is then sorted by its viewpoint and
 * context: a planned viewpoint observed in the current context is `observed`
 * once and counted as a duplicate after that; a planned viewpoint seen only in
 * another context is `stale`; an unplanned viewpoint in the current context is
 * `unplanned`, and one in another context is `foreign`. Plan order is kept for
 * every planned list, `unplanned` is sorted by code unit, and the order of the
 * observations cannot change the result.
 *
 * The state is `indeterminate` for an empty plan, `reviewed` when every
 * planned viewpoint is observed, `partial` when some are, `stale` when none is
 * observed but some were seen in another context, and `not-run` otherwise.
 *
 * Throws an `Error` when `current` does not exactly name the resolved unit
 * (blank production id, shot or runtime identity, a target or revision
 * differing from the unit, or a fingerprint or plan identity not in `sha256:`
 * hex form), and a `RangeError` for a plan with a blank or duplicated
 * viewpoint id, a distance that is not finite and positive, or a direction
 * whose length is not within `1e-6` of one.
 *
 * @evidence contracts/common.md#principled-implementation A single classification pass over the observations into sets keyed by viewpoint id, then plan-ordered projections of those sets, so the result is a pure function of the plan, the context and the set of observations; an observation is current only when revision, compile fingerprint, plan identity and canonical runtime JSON match the context exactly.
 * @evidence contracts/common.md#clear-and-simple-design The public fold owns classification and the state ladder, with private guards for the context, the plan and the observation shape; digest form, record shape and string order come from the shared `SHA256_DIGEST_PATTERN`, `isRecord` and `compareCodeUnits` rather than local copies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unverifiable records are counted, never cast into coverage, an unplanned view in a stale context is foreign rather than credited, and a malformed context or plan throws instead of folding into a misleading state; no subject or viewpoint is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States how each observation is classified, the ordering of each list, every state and when it applies, and both refusal kinds with their conditions.
 * @evidence contracts/performance.md#efficient-algorithms Linear in observations plus planned viewpoints with constant-time set lookups, and one sort of the distinct unplanned ids; each observation is shape-checked once.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One fold per inspection; production calls it once per captured sweep and nothing is kept between folds.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the id sets die with the call and the returned lists are bounded by the plan and the distinct unplanned viewpoints.
 */
export const foldAutoMovieSubjectReviewCoverage = (
  unit: IAutoMovieSubjectReviewUnit,
  current: IAutoMovieSubjectReviewCurrentContext,
  viewpoints: readonly IAutoMovieSubjectReviewViewpoint[],
  observations: readonly unknown[],
): IAutoMovieSubjectReviewCoverage => {
  validateCurrentContext(unit, current);
  validateViewpointPlan(viewpoints);
  const planned: string[] = viewpoints.map(
    (viewpoint: IAutoMovieSubjectReviewViewpoint): string => viewpoint.id,
  );
  const plannedSet: Set<string> = new Set(planned);
  const observedSet: Set<string> = new Set<string>();
  const staleSet: Set<string> = new Set<string>();
  const unplannedSet: Set<string> = new Set<string>();
  let foreign: number = 0;
  let duplicates: number = 0;
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
  const observed: string[] = planned.filter((id: string): boolean =>
    observedSet.has(id),
  );
  const missing: string[] = planned.filter(
    (id: string): boolean => !observedSet.has(id),
  );
  const stale: string[] = planned.filter(
    (id: string): boolean => staleSet.has(id) && !observedSet.has(id),
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

/** Throw unless the context names exactly the resolved unit and a canonical compile, plan and runtime. */
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
    SHA256_DIGEST_PATTERN.test(current.compileFingerprint) === false ||
    SHA256_DIGEST_PATTERN.test(current.planIdentity) === false ||
    current.captureRuntimeIdentity.trim().length === 0
  )
    throw new Error(
      "Subject review current context must exactly name the resolved unit, current compile, ordered plan, and canonical runtime.",
    );
};

/** Throw unless every viewpoint has a unique non-blank id, a positive distance and a unit direction. */
const validateViewpointPlan = (
  viewpoints: readonly IAutoMovieSubjectReviewViewpoint[],
): void => {
  const ids: Set<string> = new Set<string>();
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
    const direction: IAutoMovieVector3 = viewpoint.direction;
    const length: number = Math.hypot(direction.x, direction.y, direction.z);
    if (!Number.isFinite(length) || Math.abs(length - 1) > 1e-6)
      throw new RangeError(
        `Subject review viewpoint "${viewpoint.id}" direction must be a finite unit vector.`,
      );
  }
};

/** Whether an untrusted record is a passed, non-delivery subject view with every identity present. */
const isCurrentSubjectObservation = (
  value: unknown,
): value is IAutoMovieCurrentSubjectReviewObservation => {
  if (!isRecord(value)) return false;
  const target: unknown = value.target;
  return (
    value.kind === "subject-view" &&
    nonBlank(value.subject) &&
    nonBlank(value.revision) &&
    nonBlank(value.viewpoint) &&
    nonBlank(value.artifact) &&
    nonBlank(value.digest) &&
    nonBlank(value.productionId) &&
    isTarget(target) &&
    nonBlank(value.compileFingerprint) &&
    nonBlank(value.planIdentity) &&
    nonBlank(value.captureRuntimeIdentity) &&
    isRecord(value.pose) &&
    isRecord(value.runtimeIdentity) &&
    value.verdict === "passed" &&
    value.deliveryEvidence === false &&
    target.subject === value.subject
  );
};

/** Whether an observation was captured in exactly the current revision, compile, plan and runtime. */
const isCurrentObservationContext = (
  observation: IAutoMovieCurrentSubjectReviewObservation,
  current: IAutoMovieSubjectReviewCurrentContext,
): boolean =>
  observation.revision === current.revision &&
  observation.compileFingerprint === current.compileFingerprint &&
  observation.planIdentity === current.planIdentity &&
  observation.captureRuntimeIdentity === current.captureRuntimeIdentity;

const isTarget = (value: unknown): value is IAutoMovieSubjectReviewTarget =>
  isRecord(value) && nonBlank(value.shot) && nonBlank(value.subject);

const nonBlank = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length !== 0;
