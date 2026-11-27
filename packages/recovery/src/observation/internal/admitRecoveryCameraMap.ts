import type {
  IAutoMovieRecoveryCameraMapAdmissionOperation,
  IAutoMovieRecoveryCameraPairAdmissionOperation,
  IAutoMovieRecoveryCameraPairInput,
} from "@automovie/interface";

import { admitRecoveryCameraPair } from "./admitRecoveryCameraPair";

/**
 * Prepare the three-view map's supplied charts before image allocation. The
 * seed pair is prepared as a pair, and the third view's chart with the map's
 * aggregate pixel ceiling, without fitting a pair; the ceiling then bounds all
 * three views. The declared policy and budgets remain caller assertions.
 */
export function admitRecoveryCameraMap(
  input: Parameters<IAutoMovieRecoveryCameraMapAdmissionOperation.Operation>[0],
): ReturnType<IAutoMovieRecoveryCameraMapAdmissionOperation.Operation> {
  const seed: IAutoMovieRecoveryCameraPairInput = {
    schema: "automovie-recovery-camera-pair-v1",
    objectId: input.objectId,
    rigidity: input.rigidity,
    cohort: input.cohort,
    views: input.views.slice(0, 2),
    policy: input.seedPolicy,
    budget: input.seedBudget,
  };
  const first: PreparedPair = admitRecoveryCameraPair(seed);
  const third: PreparedPair = admitRecoveryCameraPair({
    ...seed,
    views: [input.views[0]!, input.views[2]!],
    budget: { ...input.seedBudget, maxPixels: input.budget.maxPixels },
  });
  const pixels: number = input.views.reduce(
    (sum: number, view: (typeof input.views)[number]): number =>
      sum + view.width * view.height,
    0,
  );
  if (pixels > input.budget.maxPixels)
    throw new Error(
      "invalid-camera-map: aggregate pixels exceed the map pixel budget",
    );
  return [...first.charts, third.charts[1]];
}

/** The supplied charts and pixel count of a prepared view pair. */
type PreparedPair =
  ReturnType<IAutoMovieRecoveryCameraPairAdmissionOperation.Operation>;
