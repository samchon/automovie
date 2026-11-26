import { AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryMapMetric,
} from "@automovie/interface";

import { createRecoveryMapTriangularMetric } from "./createRecoveryMapTriangularMetric";

/**
 * Retain the upper arrowhead of a consistently scaled point-first bundle QR.
 * Physical vectors list camera coordinates before the three coordinates per
 * landmark; elimination internally orders points first. The solve and covector
 * multiplication actions use the same original global column scales.
 */
export function createRecoveryMapMetric(
  triangles: readonly (readonly (readonly number[])[])[],
  reduced: readonly (readonly number[])[],
  pointScales: readonly (readonly number[])[],
  cameraScales: readonly number[],
  budget: IAutoMovieRecoveryCameraMapBudget,
): IAutoMovieRecoveryMapMetric {
  const cameraWidth: number = cameraScales.length;
  const camera: number[][] = AutoMovieEngineMath.reduceQrDesign(
    reduced,
    new Array<number>(reduced.length).fill(0),
    {
      maxEntries: budget.maxLinearEntries,
      maxWork: reduced.length * cameraWidth * (cameraWidth + 1),
    },
  ).rows;
  return createRecoveryMapTriangularMetric(
    triangles,
    camera,
    pointScales,
    cameraScales,
  );
}
