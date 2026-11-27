import { AutoMovieEngineMatrix3, AutoMovieEngineVector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieRecoveryEpipolarMatrixCalibrateOperation,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Project a pixel fundamental matrix onto the supplied-calibration essential
 * manifold and return all four relative-pose candidates. Arrays are row-major;
 * each candidate maps first-camera coordinates to second-camera coordinates.
 * Translation has unit norm and carries no physical length measurement. The
 * equal-singular projection and four-pose ambiguity follow HZ chapter 9:
 * https://www.robots.ox.ac.uk/~vgg/hzbook/hzbook2/HZepipolar.pdf
 */
export function calibrateRecoveryEpipolarMatrix(
  fundamental: Parameters<IAutoMovieRecoveryEpipolarMatrixCalibrateOperation.Operation>[0],
  first: Parameters<IAutoMovieRecoveryEpipolarMatrixCalibrateOperation.Operation>[1],
  second: Parameters<IAutoMovieRecoveryEpipolarMatrixCalibrateOperation.Operation>[2],
  maxSweeps: Parameters<IAutoMovieRecoveryEpipolarMatrixCalibrateOperation.Operation>[3],
): ReturnType<IAutoMovieRecoveryEpipolarMatrixCalibrateOperation.Operation> {
  const raw: number[] = AutoMovieEngineMatrix3.multiply(
    AutoMovieEngineMatrix3.transpose(second.matrix),
    AutoMovieEngineMatrix3.multiply(fundamental, first.matrix),
  );
  const factors: ReturnType<typeof AutoMovieEngineMath.decomposeSingularMatrix> =
    AutoMovieEngineMath.decomposeSingularMatrix(
      [raw.slice(0, 3), raw.slice(3, 6), raw.slice(6, 9)],
      { maxEntries: 9, maxSweeps, orthogonalityTolerance: 1e-12 },
    );
  const largest: number = factors.singularValues[0]!;
  const ratio: number = factors.singularValues[1]! / largest;
  if (largest === 0 || !(ratio > factors.relativeNullCutoff))
    throw new Error("camera-essential: two resolved directions required");
  const frames: number[][] = [];
  for (const columns of [factors.leftColumns, factors.rightColumns]) {
    const a: number[] = columns[0]!;
    const b: number[] = columns[1]!;
    const cross: IAutoMovieVector3 = AutoMovieEngineVector3.cross(
      { x: a[0]!, y: a[1]!, z: a[2]! },
      { x: b[0]!, y: b[1]!, z: b[2]! },
    );
    const length: number = Math.hypot(cross.x, cross.y, cross.z);
    if (!(length > 0))
      throw new Error("camera-essential: unresolved orientation frame");
    frames.push([
      a[0]!,
      b[0]!,
      cross.x / length,
      a[1]!,
      b[1]!,
      cross.y / length,
      a[2]!,
      b[2]!,
      cross.z / length,
    ]);
  }
  const u: number[] = frames[0]!;
  const vt: number[] = AutoMovieEngineMatrix3.transpose(frames[1]!);
  const essential: number[] = AutoMovieEngineMatrix3.multiply(
    u,
    AutoMovieEngineMatrix3.multiply([1, 0, 0, 0, 1, 0, 0, 0, 0], vt),
  );
  const pixel: number[] = AutoMovieEngineMatrix3.multiply(
    AutoMovieEngineMatrix3.transpose(second.inverse),
    AutoMovieEngineMatrix3.multiply(essential, first.inverse),
  );
  const pixelNorm: number = Math.hypot(...pixel);
  if (!(pixelNorm > 0))
    throw new Error(
      "camera-essential: nonrepresentable calibrated pixel matrix",
    );
  const meanRatio: number = (1 + ratio) / 2;
  const thirdRatio: number = factors.singularValues[2]! / largest;
  const relativeProjectionDiscrepancy: number =
    Math.hypot(1 - meanRatio, ratio - meanRatio, thirdRatio) /
    Math.hypot(1, ratio, thirdRatio);
  const poses: { rotation: number[]; translation: [number, number, number] }[] =
    [];
  const w: number[] = [0, -1, 0, 1, 0, 0, 0, 0, 1];
  for (const quarterTurn of [w, AutoMovieEngineMatrix3.transpose(w)]) {
    const rotation: number[] = AutoMovieEngineMatrix3.multiply(
      u,
      AutoMovieEngineMatrix3.multiply(quarterTurn, vt),
    );
    for (const sign of [1, -1])
      poses.push({
        rotation: rotation.slice(),
        translation: [sign * u[2]!, sign * u[5]!, sign * u[8]!],
      });
  }
  return {
    essential,
    fundamental: pixel.map((value: number): number => value / pixelNorm),
    relativeProjectionDiscrepancy,
    poses,
  };
}
