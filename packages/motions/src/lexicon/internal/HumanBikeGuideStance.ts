import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBikeGuidePrint } from "./IHumanBikeGuidePrint";

/*
 * A planted foot at a second: flat, or rolled about its ball late in a stance
 * that ends.
 */
export function HumanBikeGuideStance(
  print: IHumanBikeGuidePrint,
  t: number,
  ball: IAutoMovieVector3,
): IHumanBikeGuidePrint {
  if (print.lift === Infinity || print.lift === -Infinity) return print;
  const mid: number = (print.land + print.lift) / 2;
  const share: number = AutoMovieEngineMotionSampling.minimumJerkShare(
    Math.min(1, Math.max(0, (t - mid) / (print.lift - mid))),
  );
  if (!(share > 0)) return print;
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    print.rotation,
    Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, ROCKER * share),
  );
  const fixed: IAutoMovieVector3 = Vector3.add(
    print.ankle,
    Quaternion.rotateVector(print.rotation, ball),
  );
  return {
    ...print,
    ankle: Vector3.subtract(fixed, Quaternion.rotateVector(rotation, ball)),
    rotation,
  };
}

/*
 * Heel rise about the ball by lift-off, degrees: provisional, within the foot's
 * pitch at pre-swing in Perry's Gait Analysis.
 */
const ROCKER: number = 35;
