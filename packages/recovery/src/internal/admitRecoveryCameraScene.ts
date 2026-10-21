import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryCameraMapInput,
  IAutoMovieRecoveryCameraSceneInput,
} from "@automovie/interface/recovery";

import { admitRecoveryCameraMap } from "./admitRecoveryCameraMap";
import { admitRecoveryCameraPair } from "./admitRecoveryCameraPair";
import type { createRecoveryCameraChart } from "./createRecoveryCameraChart";

/**
 * Admit a closed bounded calibrated image set before observing any raster.
 *
 * @evidence contracts/common.md#principled-implementation Existing triad admission preserves numerical and seed semantics; each additional chart uses unchanged pair admission without estimation. Explicit scene ceilings and safe aggregate arithmetic bound the repeated workflow before image allocation.
 * @evidence contracts/common.md#clear-and-simple-design This scene owner adds set/repetition limits and delegates established view, map policy and seed admission without changing the v1 three-view schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No defaults, supplied poses, filename trajectory, missing field, inferred K or increased work limit is admitted.
 * @evidence contracts/common.md#meaningful-documentation States no observation effects, exact closed records, unique IDs and aggregate versus per-fit ceilings; actual variable-width designs are checked again before fitting.
 * @evidence contracts/performance.md#efficient-algorithms N chart checks and ID-set insertion cost O(N), with constant-size calibration work per image and no pixel traversal/copy. Safe integer bounds precede feature and linear allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work The first three charts come from unchanged triad admission; only later charts are admitted additionally.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only owned fixed-size charts escape. Borrowed RGB arrays are not copied, and no global cache or external resource is acquired.
 */
export function admitRecoveryCameraScene(
  input: IAutoMovieRecoveryCameraSceneInput,
): ReturnType<typeof createRecoveryCameraChart>[] {
  const closed: (value: object, keys: readonly string[]) => void = (
    value: object,
    keys: readonly string[],
  ): void => {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      Reflect.ownKeys(value).length !== keys.length ||
      Reflect.ownKeys(value).some(
        (key: string | symbol): boolean =>
          typeof key !== "string" || !keys.includes(key),
      )
    )
      throw new Error("invalid-camera-scene: complete closed records required");
  };
  closed(input, [
    "schema",
    "objectId",
    "rigidity",
    "cohort",
    "views",
    "seedPolicy",
    "seedBudget",
    "policy",
    "budget",
  ]);
  closed(input.budget, [
    "maxPixels",
    "maxDescriptorPairs",
    "maxTracks",
    "maxObservations",
    "maxResectionTrials",
    "minimumResectionTrials",
    "maxLocalRefinements",
    "maxRefinementIterations",
    "maxLinearEntries",
    "maxSingularSweeps",
    "maxViews",
    "maxCameraAttempts",
    "maxTotalResectionTrials",
    "maxTriangulations",
    "maxJointFits",
    "maxLinearWork",
    "maxResidentLinearEntries",
  ]);
  if (
    input.schema !== "automovie-recovery-camera-scene-input-v1" ||
    !Array.isArray(input.views) ||
    input.views.length < 3 ||
    !Object.values(input.budget).every(
      (value: number): boolean => Number.isSafeInteger(value) && value > 0,
    ) ||
    input.budget.maxViews < 3 ||
    input.views.length > input.budget.maxViews ||
    input.budget.maxTotalResectionTrials < input.budget.minimumResectionTrials
  )
    throw new Error(
      "invalid-camera-scene: bounded calibrated view set required",
    );
  const mapBudget: IAutoMovieRecoveryCameraMapBudget = {
    maxPixels: input.budget.maxPixels,
    maxDescriptorPairs: input.budget.maxDescriptorPairs,
    maxTracks: input.budget.maxTracks,
    maxObservations: input.budget.maxObservations,
    maxResectionTrials: input.budget.maxResectionTrials,
    minimumResectionTrials: input.budget.minimumResectionTrials,
    maxLocalRefinements: input.budget.maxLocalRefinements,
    maxRefinementIterations: input.budget.maxRefinementIterations,
    maxLinearEntries: input.budget.maxLinearEntries,
    maxSingularSweeps: input.budget.maxSingularSweeps,
  };
  const triad: IAutoMovieRecoveryCameraMapInput = {
    ...input,
    schema: "automovie-recovery-camera-map-input-v1",
    views: input.views.slice(0, 3),
    budget: mapBudget,
  };
  const charts: ReturnType<typeof createRecoveryCameraChart>[] =
    admitRecoveryCameraMap(triad);
  const ids: Set<string> = new Set(
    input.views.map((view: (typeof input.views)[number]): string => view.id),
  );
  const pixels: number = input.views.reduce(
    (sum: number, view: (typeof input.views)[number]): number =>
      sum + view.width * view.height,
    0,
  );
  const width: number = 6 * input.views.length - 7;
  const logicalMaximum: number =
    16 * input.budget.maxObservations * (width + 4) +
    16 * width * width +
    12 * input.budget.maxTracks * (width + 4);
  if (
    ids.size !== input.views.length ||
    !Number.isSafeInteger(pixels) ||
    pixels > input.budget.maxPixels ||
    !Number.isSafeInteger(logicalMaximum) ||
    !Number.isSafeInteger(input.views.length * input.seedBudget.maxFeatures) ||
    !Number.isSafeInteger(
      input.budget.maxCameraAttempts * input.budget.maxTotalResectionTrials,
    ) ||
    !Number.isSafeInteger(
      input.budget.maxJointFits * input.budget.maxRefinementIterations,
    )
  )
    throw new Error(
      "invalid-camera-scene: unique images and safe aggregate work required",
    );
  for (let index: number = 3; index < input.views.length; index++)
    charts.push(
      admitRecoveryCameraPair({
        schema: "automovie-recovery-camera-pair-v1",
        objectId: input.objectId,
        rigidity: input.rigidity,
        cohort: input.cohort,
        views: [input.views[0]!, input.views[index]!],
        policy: input.seedPolicy,
        budget: { ...input.seedBudget, maxPixels: input.budget.maxPixels },
      }).charts[1],
    );
  return charts;
}
