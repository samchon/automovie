import type {
  IAutoMovieRecoveryCameraMapPolicy,
  IAutoMovieRecoveryFeasibleMapLinearization,
  IAutoMovieRecoveryMapJointStepSolutionOperation,
  IAutoMovieRecoveryMapPointProjectionOperation,
  IAutoMovieRecoveryMapState,
  IAutoMovieSimplexAtom,
} from "@automovie/interface";

import { createRecoveryMapTangent } from "./createRecoveryMapTangent";
import { differentiateRecoveryMapTangent } from "./differentiateRecoveryMapTangent";
import { projectRecoveryMapPoint } from "./projectRecoveryMapPoint";

/*
 * Linearize the unchanged robust objective and every unweighted pixel disk.
 * Physical camera coordinates precede three coordinates for each landmark.
 * Constraint g=norm(residual)^2/maximumError^2-1 is dimensionless and smooth
 * even at zero residual; the objective remains in original squared pixels.
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
  const tangent: [number, number, number][] | null =
    differentiateRecoveryMapTangent(
      state.poses[1]!.translation,
      createRecoveryMapTangent(state.poses[1]!.translation),
    );
  if (tangent === null)
    throw new Error("camera-map-chart: nonrepresentable seed differential");
  const blocks: Parameters<IAutoMovieRecoveryMapJointStepSolutionOperation.Operation>[0][number][] =
    [];
  for (let point: number = 0; point < state.landmarks.length; point++) {
    const landmark: (typeof state.landmarks)[number] = state.landmarks[point]!;
    const block: (typeof blocks)[number] = {
      pointRows: [],
      cameraRows: [],
      right: [],
    };
    for (const observation of landmark.observations) {
      const view: number = observation.viewIndex;
      const projection: ReturnType<IAutoMovieRecoveryMapPointProjectionOperation.Operation> =
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
