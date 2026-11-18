import { bracketedBisection, getConstraint } from "@automovie/engine";
import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture } from "@automovie/interface";

import { poseBones } from "../posture/poseBones";
import { HumanColliders } from "../posture/HumanColliders";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { GymnasticsFlight } from "../sport/GymnasticsFlight";
import { seatedPairDepth } from "./seatedPairDepth";

/**
 * Find how much flexion the thorax must take from the lumbar spine when
 * the seat first bears. The pelvis, feet and total forward inclination stay
 * at the original contact key.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The returned degrees transfer from lumbar to thoracic flexion at the actual seat-contact key.
 * @evidence contracts/development/implementation.md#principled-implementation The first clear rotation is bracketed between the stated fold and the smaller of the remaining thorax range and current lumbar flexion.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One frozen lower body supplies both thigh hulls for the bounded one-axis contact solve.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The same native segment readings decide whether the initial and final folds clear.
 * @evidence contracts/development/implementation.md#efficient-algorithms A clear original fold returns after one reading. Only contact triggers the logarithmic scalar root at the event.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The fitted legs are frozen once because changing the spinal allocation cannot change their support.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only one scalar remains with the course.
 */
export function seatedLumbarTransfer(body: IAutoMovieMotionHumanBody, peak: IAutoMovieMotionHumanPosture): number {
  const pose: IAutoMovieMotionHumanPosture = GymnasticsFlight.frozen(body, peak);
  const spine: NonNullable<typeof pose.joints.spine> = pose.joints.spine ?? [0, 0, 0];
  const chest: NonNullable<typeof pose.joints.chest> = pose.joints.chest ?? [0, 0, 0];
  const maximum: number = getConstraint("chest", body.bones.get("chest")?.constraint ?? null)?.flexion?.max ?? chest[0];
  const limit: number = Math.min(spine[0], maximum - chest[0]);
  if (limit <= 0) return 0;
  const left: ReturnType<typeof seatedPairDepth> = seatedPairDepth(body, "spine", "leftUpperLeg");
  const right: ReturnType<typeof seatedPairDepth> = seatedPairDepth(body, "spine", "rightUpperLeg");
  const touching = (angle: number): boolean => {
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...pose.joints,
      spine: [spine[0] - angle, spine[1], spine[2]],
      chest: [chest[0] + angle, chest[1], chest[2]],
    };
    const bones: ReturnType<typeof poseBones> = poseBones(body, resolveHumanPosture(body, { ...pose, joints }));
    const placed: ReturnType<typeof HumanColliders.placed> = HumanColliders.placed(body, bones);
    return Math.max(left(placed), right(placed)) > 0;
  };
  if (!touching(0) || touching(limit)) return 0;
  return bracketedBisection(touching, 0, limit, 0.01);
}
