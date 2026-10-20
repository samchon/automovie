import type { IAutoMovieSimplexAtom } from "@automovie/engine/math/IAutoMovieSimplexAtom";
import type { IAutoMovieRecoveryCameraMapPolicy } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryMapState } from "../structures/internal/IAutoMovieRecoveryMapState";
import type { IAutoMovieRecoveryFeasibleMapLinearization } from "../structures/internal/IAutoMovieRecoveryFeasibleMapLinearization";
import { createRecoveryMapTangent } from "./createRecoveryMapTangent";
import { projectRecoveryMapPoint } from "./projectRecoveryMapPoint";
import type { solveRecoveryMapJointStep } from "./solveRecoveryMapJointStep";

/**
 * Linearize the unchanged robust objective and every unweighted pixel disk.
 * Physical camera coordinates precede three coordinates for each landmark.
 * Constraint g=norm(residual)^2/maximumError^2-1 is dimensionless and smooth
 * even at zero residual; the objective remains in original squared pixels.
 *
 * @evidence contracts/common.md#principled-implementation Actual pinhole Jacobians give the soft-L1 gradient J^T*r/hypot(1,norm/scale), weighted original-design blocks and unweighted disk derivative 2*r^T*J/maximumError^2. The same SO3/sphere/Euclidean chart supplies all three without normal equations.
 * @evidence contracts/common.md#clear-and-simple-design This local derivative owner serves both metric factorization and complete original-coordinate certification; nonlinear qualification and actual retraction stay with the joint owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No robust weight changes the hard disk, no missing measurement is dropped, and nonpositive depth or an initially violated disk throws rather than becoming zero residual.
 * @evidence contracts/common.md#meaningful-documentation States physical coordinate order, normalized disk units, loss derivative and fixed measurement population.
 * @evidence contracts/performance.md#efficient-algorithms E observations and C camera coordinates cost O(E*C+L) and retain O(E*C+L+C) block/scalar entries; hard rows touch at most six camera and three point coordinates. The caller admits these arrays before this traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Each projection supplies residual, objective gradient, disk derivative and both weighted Jacobian blocks in the same pass.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned blocks and rows transfer for one model lifetime; borrowed fixed intrinsics and measurements are not mutated or cached, and no external resource is acquired.
 */
export function linearizeRecoveryFeasibleMap(
  state: IAutoMovieRecoveryMapState,
  intrinsics: readonly (readonly number[])[],
  policy: IAutoMovieRecoveryCameraMapPolicy,
): IAutoMovieRecoveryFeasibleMapLinearization {
  const cameraWidth: number = 6 * state.poses.length - 7;
  const width: number = cameraWidth + 3 * state.landmarks.length;
  const gradient: number[] = new Array<number>(width).fill(0);
  const constraints: IAutoMovieSimplexAtom[] = [];
  const tangent: [number, number, number][] = createRecoveryMapTangent(
    state.poses[1]!.translation,
  );
  const blocks: Parameters<typeof solveRecoveryMapJointStep>[0][number][] = [];
  for (let point: number = 0; point < state.landmarks.length; point++) {
    const landmark: (typeof state.landmarks)[number] = state.landmarks[point]!;
    const block: (typeof blocks)[number] = {
      pointRows: [],
      cameraRows: [],
      right: [],
    };
    for (const observation of landmark.observations) {
      const view: number = observation.viewIndex;
      const projection: ReturnType<typeof projectRecoveryMapPoint> =
        projectRecoveryMapPoint(
          state.poses[view]!,
          landmark.point,
          intrinsics[view]!,
        );
      if (projection === null)
        throw new Error("camera-feasible: nonpositive model depth");
      const residual: number[] = projection.pixel.map(
        (value: number, axis: number): number =>
          value - observation.pixel[axis]!,
      );
      const norm: number = Math.hypot(...residual);
      const offset: number =
        1 - (norm / policy.maximumReprojectionErrorPx) ** 2;
      if (offset < 0)
        throw new Error("camera-feasible: feasible pixel disk required");
      const hypotenuse: number = Math.hypot(1, norm / policy.lossScalePx);
      const weight: number = 1 / Math.sqrt(hypotenuse);
      const start: number = view === 1 ? 0 : 5 + 6 * (view - 2);
      const cameraCount: number = view === 0 ? 0 : view === 1 ? 5 : 6;
      const indices: number[] = [
        ...Array.from(
          { length: cameraCount },
          (_: unknown, axis: number): number => start + axis,
        ),
        cameraWidth + 3 * point,
        cameraWidth + 3 * point + 1,
        cameraWidth + 3 * point + 2,
      ];
      const values: number[] = new Array<number>(indices.length).fill(0);
      for (let axis: number = 0; axis < 2; axis++) {
        const camera: number[] = new Array<number>(cameraWidth).fill(0);
        const local: number[] = projection.cameraJacobian[axis]!;
        if (view === 1) {
          for (let column: number = 0; column < 3; column++)
            camera[column] = local[column]!;
          for (let column: number = 0; column < 2; column++)
            camera[3 + column] = tangent[column]!.reduce(
              (sum: number, value: number, at: number): number =>
                sum + value * local[3 + at]!,
              0,
            );
        } else if (view >= 2)
          for (let column: number = 0; column < 6; column++)
            camera[start + column] = local[column]!;
        const derivatives: number[] = [
          ...indices
            .slice(0, cameraCount)
            .map((column: number): number => camera[column]!),
          ...projection.pointJacobian[axis]!,
        ];
        for (let entry: number = 0; entry < indices.length; entry++) {
          gradient[indices[entry]!]! +=
            (derivatives[entry]! * residual[axis]!) / hypotenuse;
          values[entry]! +=
            ((2 * residual[axis]!) / policy.maximumReprojectionErrorPx) *
            (derivatives[entry]! / policy.maximumReprojectionErrorPx);
        }
        block.cameraRows.push(
          camera.map((value: number): number => value * weight),
        );
        block.pointRows.push(
          projection.pointJacobian[axis]!.map(
            (value: number): number => value * weight,
          ),
        );
        block.right.push(-residual[axis]! * weight);
      }
      constraints.push({ indices, values, offset });
    }
    blocks.push(block);
  }
  return {
    blocks,
    rows: [
      {
        indices: Array.from(
          { length: width },
          (_: unknown, axis: number): number => axis,
        ),
        values: gradient,
        offset: 0,
      },
      ...constraints,
    ],
  };
}
