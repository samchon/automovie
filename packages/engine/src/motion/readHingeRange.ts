import type { IAutoMovieJointAxes, IAutoMovieVector3 } from "@automovie/interface";

import { decomposeJointRotationOnBasis } from "../kinematics/decomposeJointRotationOnBasis";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import type { prepareChainPlant } from "./prepareChainPlant";

/**
 * The mid joint's flexion range as rotation about its own hinge, radians:
 * what `hingedArmArticulation` takes as `range`. The clinical flexion of a
 * pure hinge rotation is linear in the hinge angle, with a sign and an offset
 * that differ between an elbow and a knee and between rigs, so both are read
 * numerically from the principal decomposition at zero and at one degree
 * rather than assumed.
 *
 * @param props The fit request.
 * @param prepared The chain's preparation; its lower domain carries the range.
 * @param axes The mid bone's axes; its flexion is the hinge.
 * @param basis The mid bone's normalized basis.
 * @returns The range, or null when the joint has no flexion range to keep or the reading is degenerate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines radian output, clinical sign/offset recovery, exact current lower-domain range and unsupported reading refusal.
 * @evidence contracts/development/implementation.md#principled-implementation The existing principal decomposition of pure hinge rotations at zero and one degree recovers its affine clinical sign/offset; inverse endpoints map the actual clinical flexion range back to the hinge's radians.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One owner supplies the identical range law to ordinary scoring and explicit orientation-root continuation, without duplicating range policy.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original length/slope admission and endpoint arithmetic; no ROM range, tolerance, name switch or assumed clinical sign is introduced.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two constant-size principal reads and two endpoint conversions retain existing work; a matching workspace caches only the source-fixed range.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both search policies use this same actual source/domain/clinical mapping; the unchanged rig owner alone shares successful fixed-range work.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one fresh min/max record or null; temporary hinge/readings release on return or throw with no retained target, result history or handle.
 */
export function readHingeRange(
  props: IFitChainToTargetProps,
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
    decomposeJointRotationOnBasis(
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
