import {
  type IAutoMovieCurrentSubjectReviewObservation,
  IAutoMovieSubjectReviewCoverage,
  type IAutoMovieSubjectReviewCurrentContext,
  IAutoMovieSubjectReviewUnit,
  IAutoMovieSubjectReviewViewpoint,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineText } from "../../text/AutoMovieEngineText";
import { SHA256_DIGEST_PATTERN } from "../../validation/SHA256_DIGEST_PATTERN";

/*
 * Fold planned subject viewpoints against current observation receipts.
 *
 * Observations are the production verifier's typed receipts. One whose target
 * names another subject, or another production's, shot's or subject's view, is
 * counted as `foreign`. A complete view of this production, shot and subject is
 * then sorted by its viewpoint and context: a planned viewpoint observed in the
 * current context is `observed` once and counted as a duplicate after that; a
 * planned viewpoint seen only in another context is `stale`; an unplanned
 * viewpoint in the current context is `unplanned`, and one in another context
 * is `foreign`. Plan order is kept for every planned list, `unplanned` is
 * sorted by code unit, and the order of the observations cannot change the
 * result.
 *
 * The state is `indeterminate` for an empty plan, `reviewed` when every planned
 * viewpoint is observed, `partial` when some are, `stale` when none is observed
 * but some were seen in another context, and `not-run` otherwise.
 *
 * Throws an `Error` when `current` does not exactly name the resolved unit (a
 * target or revision differing from the unit, or a fingerprint or plan identity
 * not in `sha256:` hex form), and a `RangeError` for a plan with a duplicated
 * viewpoint id, a distance that is not finite and positive, or a direction
 * whose length is not within `1e-6` of one.
 */
export const foldAutoMovieSubjectReviewCoverage = (
  unit: IAutoMovieSubjectReviewUnit,
  current: IAutoMovieSubjectReviewCurrentContext,
  viewpoints: readonly IAutoMovieSubjectReviewViewpoint[],
  observations: readonly IAutoMovieCurrentSubjectReviewObservation[],
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
      !isComplete(candidate) ||
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
    unplanned: [...unplannedSet].sort(AutoMovieEngineText.compareCodeUnits),
    foreign,
    duplicates,
  };
};

/*
 * Throw unless the context names exactly the resolved unit and a canonical
 * compile, plan and runtime.
 */
const validateCurrentContext = (
  unit: IAutoMovieSubjectReviewUnit,
  current: IAutoMovieSubjectReviewCurrentContext,
): void => {
  if (
    current.target.subject !== unit.description.id ||
    current.target.shot !== unit.target.shot ||
    current.revision !== unit.description.revision ||
    SHA256_DIGEST_PATTERN.test(current.compileFingerprint) === false ||
    SHA256_DIGEST_PATTERN.test(current.planIdentity) === false
  )
    throw new Error(
      "Subject review current context must exactly name the resolved unit, current compile, ordered plan, and canonical runtime.",
    );
};

/*
 * Throw unless every viewpoint has a unique id, a positive distance and a unit
 * direction.
 */
const validateViewpointPlan = (
  viewpoints: readonly IAutoMovieSubjectReviewViewpoint[],
): void => {
  const ids: Set<string> = new Set<string>();
  for (const viewpoint of viewpoints) {
    if (ids.has(viewpoint.id))
      throw new RangeError(
        `Subject review viewpoint id "${viewpoint.id}" is duplicated.`,
      );
    ids.add(viewpoint.id);
    if (viewpoint.distance <= 0)
      throw new RangeError(
        `Subject review viewpoint "${viewpoint.id}" distance must be finite and positive.`,
      );
    const direction: IAutoMovieVector3 = viewpoint.direction;
    const length: number = Math.hypot(direction.x, direction.y, direction.z);
    if (Math.abs(length - 1) > 1e-6)
      throw new RangeError(
        `Subject review viewpoint "${viewpoint.id}" direction must be a finite unit vector.`,
      );
  }
};

/*
 * Whether the observation's target names its own subject.
 */
const isComplete = (
  observation: IAutoMovieCurrentSubjectReviewObservation,
): boolean => observation.target.subject === observation.subject;

/*
 * Whether an observation was captured in exactly the current revision, compile,
 * plan and runtime.
 */
const isCurrentObservationContext = (
  observation: IAutoMovieCurrentSubjectReviewObservation,
  current: IAutoMovieSubjectReviewCurrentContext,
): boolean =>
  observation.revision === current.revision &&
  observation.compileFingerprint === current.compileFingerprint &&
  observation.planIdentity === current.planIdentity &&
  observation.captureRuntimeIdentity === current.captureRuntimeIdentity;
