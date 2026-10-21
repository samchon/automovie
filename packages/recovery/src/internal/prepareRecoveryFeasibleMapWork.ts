import type { IAutoMovieRecoveryCameraMapBudget } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryMapLandmark } from "../structures/image/IAutoMovieRecoveryMapLandmark";
import type { IAutoMovieRecoveryMapPose } from "../structures/image/IAutoMovieRecoveryMapPose";
import type { IAutoMovieRecoveryFeasibleJointOptions } from "../structures/internal/IAutoMovieRecoveryFeasibleJointOptions";
import type { IAutoMovieRecoveryFeasibleMapWork } from "../structures/internal/IAutoMovieRecoveryFeasibleMapWork";

/**
 * Admit the original fixed-population camera-map work and retention bounds.
 *
 * @evidence contracts/common.md#principled-implementation Uses the existing observation-width, full-LS QR/SVD and detached-candidate polynomials, preserving arithmetic and metadata charge order before identity-gauge admission.
 * @evidence contracts/common.md#clear-and-simple-design This owner calculates and validates scalar resource bounds; the coordinator owns geometry, model construction, reactions and optional curvature admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No population, pixel tolerance, normal rule, ceiling or trial allowance changes. Invalid bounds and original gauge fail before any fit state is cloned.
 * @evidence contracts/common.md#meaningful-documentation Logical entries and prepaid visits are distinct. The two landmark reductions follow the existing charge4L; adaptive agreement remains separate from lagged curvature.
 * @evidence contracts/performance.md#efficient-algorithms Two O(L) metadata reductions and fixed scalar arithmetic retain the existing charge4L and model envelopes. One eight-field result and its fixed stores fit the existing128 shell; no new dimension-sized loop or buffer is added.
 * @evidence contracts/performance.md#reuse-equivalent-work Computes bounds once per fit and returns their scalars for every model, actual evaluation and selected reaction without rescanning observations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows poses, landmarks, calibration and budget only during admission. The returned eight-scalar record replaces coordinator locals within the fixed128 shell; no array, callback or preparation closure escapes.
 */
export function prepareRecoveryFeasibleMapWork(
  initialPoses: readonly IAutoMovieRecoveryMapPose[],
  initialLandmarks: readonly IAutoMovieRecoveryMapLandmark[],
  intrinsics: readonly (readonly number[])[],
  budget: IAutoMovieRecoveryCameraMapBudget,
  options: IAutoMovieRecoveryFeasibleJointOptions,
  charge: (work: number) => void,
): IAutoMovieRecoveryFeasibleMapWork {
  const cameras: number = initialPoses.length;
  const points: number = initialLandmarks.length;
  if (
    points < 6 ||
    cameras < 2 ||
    points > budget.maxTracks ||
    !Number.isSafeInteger(4 * points)
  )
    throw new Error("camera-feasible: bounded landmark metadata required");
  charge(4 * points);
  const observations: number = initialLandmarks.reduce(
    (sum: number, landmark: IAutoMovieRecoveryMapLandmark): number =>
      sum + landmark.observations.length,
    0,
  );
  const cameraWidth: number = 6 * cameras - 7;
  const width: number = cameraWidth + 3 * points;
  const adaptive: boolean = options.adaptiveRegularization === true;
  const agreementEntries: number = adaptive
    ? 4 * observations * (cameraWidth + 4) + 8 * width + 256
    : 0;
  const agreementWork: number = adaptive
    ? 32 * (observations * (cameraWidth + 4) + width + points + 1)
    : 0;
  // Every whitened pixel row has at most C camera and three point entries;
  // the dense objective has width entries. Reserve both result step copies.
  const directionCoefficients: number =
    width + observations * (cameraWidth + 3);
  const directionRows: number = observations + 1;
  const directionEntries: number =
    2 * directionCoefficients + 3 * directionRows + 2 * width + 128;
  const minimumDirectionWork: number =
    288 * directionCoefficients + 1058 * directionRows + 137 * width + 1025;
  // Four detached pose/point records need at most48V+16L scalars. The two
  // additionally retained best/mixed increments need2n=12V+6L-14; their
  // total60V+22L is below64*(E+L+V+1). The current increment is in16n.
  const retained: number =
    24 * observations * (cameraWidth + 20) +
    24 * cameraWidth * cameraWidth +
    24 * points * (cameraWidth + 4) +
    16 * width +
    128 +
    64 * (observations + points + cameras + 1) +
    agreementEntries;
  const evaluationWork: number =
    8 * observations * (cameraWidth + 4) +
    32 *
      initialLandmarks.reduce(
        (sum: number, landmark: IAutoMovieRecoveryMapLandmark): number =>
          sum + landmark.observations.length ** 2,
        0,
      );
  const modelWork: number =
    12 * observations * (cameraWidth + 4) +
    8 * observations * cameraWidth * cameraWidth +
    12 * points * (cameraWidth + 4) +
    4 * (2 * observations + points) * cameraWidth * cameraWidth +
    4 * budget.maxSingularSweeps * cameraWidth ** 3 +
    54 * budget.maxSingularSweeps * (observations + points);
  if (
    cameras < 2 ||
    intrinsics.length !== cameras ||
    points < 6 ||
    points > budget.maxTracks ||
    observations > budget.maxObservations ||
    (adaptive &&
      (!Number.isSafeInteger(agreementEntries) ||
        agreementEntries <= 0 ||
        !Number.isSafeInteger(agreementWork) ||
        agreementWork <= 0)) ||
    ![
      retained,
      evaluationWork,
      modelWork,
      options.maxResidentLinearEntries,
      directionCoefficients,
      directionEntries,
      minimumDirectionWork,
      options.directionBudget.maxEntries,
      options.directionBudget.maxIterations,
      options.directionBudget.maxWork,
    ].every(
      (value: number): boolean => Number.isSafeInteger(value) && value > 0,
    ) ||
    retained > options.maxResidentLinearEntries ||
    directionEntries > options.directionBudget.maxEntries ||
    minimumDirectionWork > options.directionBudget.maxWork ||
    initialPoses[0]!.rotation.length !== 9 ||
    initialPoses[0]!.rotation.some(
      (value: number, at: number): boolean =>
        value !== (at === 0 || at === 4 || at === 8 ? 1 : 0),
    ) ||
    initialPoses[0]!.translation.some((value: number): boolean => value !== 0)
  )
    throw new Error(
      "camera-feasible: bounded full-population identity gauge required",
    );
  return { observations, cameraWidth, width, adaptive, agreementWork, retained, evaluationWork, modelWork };
}
