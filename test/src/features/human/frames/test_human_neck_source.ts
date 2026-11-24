import {
  AutoMovieHumanHeadNeckCurves,
  AutoMovieHumanNeckSource,
} from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanHeadNeckCurves,
  IAutoMovieHumanNeckSource,
} from "@automovie/interface";

/**
 * The normal circle and base tape from made neck measurements. A circle has
 * radius `girth / (2π)` and its inclined diameter has vertical projection `2r
 * sin(angle)`. The shared base solver has to reach its separate tape and
 * C7/side/front heights from the same normal section.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the neck source on two scaled inputs and reads its native normal conic and actual base closure.
 * @evidence contracts/development/testing.md#independent-expectations The radius and support heights follow from the made circle, and the named base points and tape must equal the supplied measurements.
 * @evidence contracts/development/testing.md#distinguishing-cases Different scales and different orders of the side and posterior heights exercise both ends of the normal band.
 * @evidence contracts/development/testing.md#execution-ownership Synchronous neck-scope fixture using supplied measurements only.
 * @evidence contracts/development/common.md#meaningful-documentation States the geometric expectation and independent base target.
 */
export function test_human_neck_source(): void {
  const failures: string[] = [];
  const near = (label: string, actual: number, expected: number): void => {
    if (
      !(Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(expected)))
    )
      failures.push(`${label}: expected ${expected}, received ${actual}`);
  };
  for (const [scale, cervicale, side] of [
    [1, 330, 340],
    [1.5, 340, 330],
  ] as const) {
    const radius: number = 40;
    const front: number = 300;
    const baseGirth: number = 360;
    const cervicaleX: number = -23;
    const inputs: Parameters<typeof AutoMovieHumanNeckSource.of>[0] = {
      neck: 2 * Math.PI * radius,
      neckBase: {
        girth: baseGirth,
        cervicaleHeight: cervicale,
        sideNeckPointHeight: side,
        suprasternaleHeight: front,
        cervicaleOrigin: cervicaleX,
      },
      sex: 0,
    };
    const source: IAutoMovieHumanNeckSource.IOutput =
      AutoMovieHumanNeckSource.of(inputs, scale);
    const upper: number = Math.max(cervicale, side) * scale;
    const lower: number = ((front + Math.min(cervicale, side)) / 2) * scale;
    const top: IAutoMovieHumanNeckSource.IRow = source.rows.at(-1)!;
    const forward: AutoMovieVector3Tuple = AutoMovieHumanNeckSource.point(
      top,
      0,
    );
    const back: AutoMovieVector3Tuple = AutoMovieHumanNeckSource.point(
      top,
      Math.PI,
    );
    const lateral: AutoMovieVector3Tuple = AutoMovieHumanNeckSource.point(
      top,
      Math.PI / 2,
    );
    near("front of the normal circle", forward[1], lower);
    near("back of the normal circle", back[1], upper);
    near("lateral reach", lateral[2], radius * scale);
    near(
      "spatial diameter",
      Math.hypot(forward[0] - back[0], forward[1] - back[1]),
      2 * radius * scale,
    );
    near("C7 height", source.head.backLevel, cervicale * scale);
    near("C7 placement", source.head.back, cervicaleX * scale);
    const resolved: IAutoMovieHumanHeadNeckCurves.IOutput =
      AutoMovieHumanHeadNeckCurves.of({
        neck: source.head,
        base: {
          girth: baseGirth * scale,
          cervicaleHeight: cervicale * scale,
          sideNeckPointHeight: side * scale,
          suprasternaleHeight: front * scale,
          cervicaleOrigin: cervicaleX * scale,
          priorCervicaleOrigin: source.registration.priorCervicaleX,
        },
        bottom: source.bottom[1],
        menton: 380 * scale,
        cranialCentre: source.head.x,
        tragion: 410 * scale,
        crown: 480 * scale,
        spacing: 2 * scale,
      });
    near(
      "recovered normal tape",
      resolved.normalMeasured.lengthMm,
      inputs.neck * scale,
    );
    near("closed base tape", resolved.measured.lengthMm, baseGirth * scale);
    const [fore, left, aft, right] = resolved.baseLandmarkPolygon.points;
    near("base front", fore![1], front * scale);
    near("base left", left![1], side * scale);
    near("base C7", aft![1], cervicale * scale);
    near("base right", right![1], side * scale);
    near("base C7 world X", aft![0], cervicaleX * scale);
  }
  if (failures.length > 0) throw new Error(failures.join("\n"));
}
