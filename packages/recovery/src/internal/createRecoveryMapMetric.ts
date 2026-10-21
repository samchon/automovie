import { reduceAutoMovieQrDesign } from "@automovie/engine/math/reduceAutoMovieQrDesign";
import type { IAutoMovieRecoveryCameraMapBudget } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryMapMetric } from "../structures/internal/IAutoMovieRecoveryMapMetric";
import { createRecoveryMapTriangularMetric } from "./createRecoveryMapTriangularMetric";

/**
 * Retain the upper arrowhead of a consistently scaled point-first bundle QR.
 * Physical vectors list camera coordinates before the three coordinates per
 * landmark; elimination internally orders points first. The solve and covector
 * multiplication actions use the same original global column scales.
 *
 * @evidence contracts/common.md#principled-implementation Givens reduction produces the camera upper factor of the already point-eliminated damped design. Solving R^T*w=scaled-covector first resolves independent point blocks and then the camera tail; R*s=z reverses that order. No Gram matrix, inverse or second camera scaling changes coordinates.
 * @evidence contracts/common.md#clear-and-simple-design This owner retains raw factors for feasible-direction whitening. Shared preparation and original-design factorization qualify undamped rank for both factorRecoveryMapMetric and solveRecoveryMapJointStep; only the latter synthesizes the complete unconstrained answer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No pivot floor or active inequality supplies missing data rank. Every nonrepresentable triangular action throws instead of returning a zero direction.
 * @evidence contracts/common.md#meaningful-documentation States camera/point ordering, scale direction and distinction between an invertible damped metric and undamped rank qualification.
 * @evidence contracts/performance.md#efficient-algorithms One camera QR costs O(E*C^2) and O(C^2) retained scalars. A covector touching k points costs O(k*C+C^2), and inverse action costs O(L*C+C^2); no full (C+3L)^2 factor is formed.
 * @evidence contracts/performance.md#reuse-equivalent-work Current point triangles, camera upper factor and global scales supply both triangular solves and physical covector multiplication; no second factor or normal matrix is built.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned upper factors/scales live in returned closures for one model. The caller admits their retention and charges each whitening action; sparse row temporaries expire without input mutation or external state.
 */
export function createRecoveryMapMetric(
  triangles: readonly (readonly (readonly number[])[])[],
  reduced: readonly (readonly number[])[],
  pointScales: readonly (readonly number[])[],
  cameraScales: readonly number[],
  budget: IAutoMovieRecoveryCameraMapBudget,
): IAutoMovieRecoveryMapMetric {
  const cameraWidth: number = cameraScales.length;
  const camera: number[][] = reduceAutoMovieQrDesign(
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
