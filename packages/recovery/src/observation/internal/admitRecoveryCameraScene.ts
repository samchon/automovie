import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryCameraMapInput,
  IAutoMovieRecoveryCameraSceneAdmissionOperation,
} from "@automovie/interface";

import { admitRecoveryCameraMap } from "./admitRecoveryCameraMap";
import { admitRecoveryCameraPair } from "./admitRecoveryCameraPair";

/**
 * Prepare a bounded calibrated image set's supplied charts before observing any
 * raster: the first three views as the seed map, each later view's chart under
 * the scene's aggregate pixel ceiling, and the caller's view and pixel budgets
 * bounding the whole set. The declared policy and budgets remain caller
 * assertions.
 */
export function admitRecoveryCameraScene(
  input: Parameters<IAutoMovieRecoveryCameraSceneAdmissionOperation.Operation>[0],
): ReturnType<IAutoMovieRecoveryCameraSceneAdmissionOperation.Operation> {
  if (input.views.length > input.budget.maxViews)
    throw new Error("invalid-camera-scene: views exceed the view budget");
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
  const charts: Chart[] = admitRecoveryCameraMap(triad);
  const pixels: number = input.views.reduce(
    (sum: number, view: (typeof input.views)[number]): number =>
      sum + view.width * view.height,
    0,
  );
  if (pixels > input.budget.maxPixels)
    throw new Error(
      "invalid-camera-scene: aggregate pixels exceed the scene pixel budget",
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

/** One view's supplied pixel chart, constructed for the numerical phases. */
type Chart =
  ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>;
