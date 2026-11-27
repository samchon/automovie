import type {
  IAutoMovieFitChainToTargetProps,
  IAutoMovieJointAxes,
  IAutoMovieVector3,
} from "@automovie/interface";

import { decomposeJointRotationOnBasis } from "../../kinematics/internal/decomposeJointRotationOnBasis";
import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { prepareChainPlant } from "./prepareChainPlant";

/*
 * The mid joint's flexion range as rotation about its own hinge, radians: what
 * `hingedArmArticulation` takes as `range`. The clinical flexion of a pure
 * hinge rotation is linear in the hinge angle, with a sign and an offset that
 * differ between an elbow and a knee and between rigs, so both are read
 * numerically from the principal decomposition at zero and at one degree rather
 * than assumed.
 * Parameter props: The fit request.
 * Parameter prepared: The chain's preparation; its lower domain carries the range.
 * Parameter axes: The mid bone's axes; its flexion is the hinge.
 * Parameter basis: The mid bone's normalized basis.
 * Returns: The range, or null when the joint has no flexion range to keep or
 * the reading is degenerate.
 */
export function readHingeRange(
  props: IAutoMovieFitChainToTargetProps,
  prepared: NonNullable<ReturnType<typeof prepareChainPlant>>,
  axes: IAutoMovieJointAxes,
  basis: IAutoMovieJointAxes,
): { min: number; max: number } | null {
  const flexion: { min: number; max: number } | null | undefined =
    prepared.lowerDomain.constraint?.flexion;
  if (flexion === null || flexion === undefined) return null;
  const length: number = Vector3.length(axes.flexion);
  if (length < 1e-6) return null;
  const hinge: IAutoMovieVector3 = Vector3.scale(axes.flexion, 1 / length);
  const read: (degrees: number) => number = (degrees: number): number =>
    decomposeJointRotationOnBasis.run(
      Quaternion.fromAxisAngle(hinge, degrees),
      basis,
      props.restFrames?.[props.chain.lower],
    ).flexion ?? 0;
  const offset: number = read(0);
  const slope: number = read(1) - offset;
  if (Math.abs(Math.abs(slope) - 1) > 1e-6) return null;
  const ends: [number, number] = [
    (flexion.min - offset) / slope,
    (flexion.max - offset) / slope,
  ];
  return {
    min: (Math.min(...ends) * Math.PI) / 180,
    max: (Math.max(...ends) * Math.PI) / 180,
  };
}
