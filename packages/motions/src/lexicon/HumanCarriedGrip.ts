import {
  Quaternion,
  Vector3,
  physicalShapeSegmentDistance,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarried,
  IAutoMovieMotionHumanCarriedCouplingPose,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePhysicalShape,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanVerdicts } from "../audit/AutoMovieMotionHumanVerdicts";
import { HumanHand } from "../posture/HumanHand";
import { HumanHandTarget } from "../posture/HumanHandTarget";
import { HumanLimbFit } from "../posture/HumanLimbFit";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanCarriedWristCircle } from "./HumanCarriedWristCircle";

/** A shape's signed distance to a pair of world points. */
type Distance = ReturnType<typeof physicalShapeSegmentDistance.prepare>;

/**
 * Choose a supporting hand's tangent at its held point in the bearer's anchor.
 * The nominal tangent is kept when the displayed fingers clear the borne body.
 */
export function HumanCarriedGrip(
  body: IAutoMovieMotionHumanBody,
  stance: IAutoMovieMotionHumanPosture,
  side: AutoMovieHumanSide,
  anchor: AutoMovieHumanoidBone,
  grip: IAutoMovieMotionHumanCarriedCouplingPose.IGrip,
  hold: IAutoMovieMotionHumanCarried.IHold,
  freeOther: boolean,
): IAutoMovieVector3 | undefined {
  const joints: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
    side,
    hold.shape ?? "relaxed",
  );
  const source: IAutoMoviePose = resolveHumanPosture(
    body,
    hold.shape === undefined
      ? stance
      : { ...stance, joints: { ...stance.joints, ...joints } },
  );
  // Playback treats an unassigned opposite arm as already placed.
  const placed: readonly AutoMovieHumanSide[] = freeOther
    ? [side === "left" ? "right" : "left"]
    : [];
  const shoulder: AutoMovieHumanoidBone = `${side}UpperArm`;
  const anchors: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(body, source, undefined, new Set([anchor, shoulder]));
  const frame: IAutoMovieResolvedBone = anchors.get(anchor)!;
  const back: IAutoMovieQuaternion = Quaternion.inverse(frame.worldRotation);
  const point: IAutoMovieVector3 = Vector3.add(
    frame.worldPosition,
    Quaternion.rotateVector(frame.worldRotation, grip.point),
  );
  const normal: IAutoMovieVector3 = Quaternion.rotateVector(
    frame.worldRotation,
    grip.normal,
  );
  const place: IAutoMovieMotionHumanCarriedCouplingPose.IHold = {
    point,
    normal,
  };
  const palm: ReturnType<typeof HumanHandTarget.prepareGoal> =
    HumanHandTarget.prepareGoal(body, side, {
      bend: grip.forward === undefined ? "hang" : "front",
      shape: hold.shape,
    });
  const transform: (
    part: IAutoMovieMotionHumanColliders.IPlaced,
  ) => IAutoMovieMotionHumanColliders.IPlaced = (
    part: IAutoMovieMotionHumanColliders.IPlaced,
  ): IAutoMovieMotionHumanColliders.IPlaced => ({
    ...part,
    pose: {
      position: Vector3.add(
        frame.worldPosition,
        Quaternion.rotateVector(frame.worldRotation, part.pose.position),
      ),
      rotation: Quaternion.normalize(
        Quaternion.multiply(frame.worldRotation, part.pose.rotation),
      ),
    },
  });
  const clear: IAutoMovieMotionHumanColliders.IPlaced[] =
    grip.clearance.clear.map(transform);
  const rests: IAutoMovieMotionHumanColliders.IPlaced[] =
    grip.clearance.rests.map(transform);
  const distances: Distance[] = [...clear, ...rests].flatMap(
    (part: IAutoMovieMotionHumanColliders.IPlaced): Distance[] =>
      part.shapes.map(
        (shape: IAutoMoviePhysicalShape): Distance =>
          physicalShapeSegmentDistance.prepare(part.pose, shape),
      ),
  );
  const hand: AutoMovieHumanoidBone = `${side}Hand`;
  const digits: Set<AutoMovieHumanoidBone> = new Set(
    Object.keys(joints) as AutoMovieHumanoidBone[],
  );
  digits.add(hand);
  const read: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    digits,
  );
  const surface: IAutoMovieMotionHumanBody["surfaces"]["regions"]["palmLeft"] =
    body.surfaces.regions[side === "left" ? "palmLeft" : "palmRight"];
  const preferred: IAutoMovieVector3 | undefined =
    grip.forward === undefined
      ? undefined
      : Quaternion.rotateVector(frame.worldRotation, grip.forward);
  let tangent: IAutoMovieVector3 | undefined;
  let radius: number = 0;
  function error(forward?: IAutoMovieVector3): number {
    const goal: IAutoMovieHumanLimbGoal = {
      ...palm(stance, place, forward),
      clear,
      rests,
    };
    const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      read(HumanLimbFit.fit(body, source, `${side}Arm`, goal, placed).pose);
    const wrist: IAutoMovieResolvedBone = bones.get(hand)!;
    const met: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.point(
      surface,
      wrist,
    );
    const miss: number = Vector3.distance(met, point);
    let violation: number = miss > AutoMovieMotionHumanVerdicts.SKIN ? miss : 0;
    if (tangent === undefined)
      tangent = Quaternion.rotateVector(goal.rotation!, surface.forward!);
    for (const [name, bone] of bones) {
      if (name === hand) continue;
      radius = Math.max(radius, Vector3.distance(met, bone.worldPosition));
      for (const distance of distances)
        violation = Math.max(
          violation,
          -distance(bone.worldPosition, bone.worldPosition),
        );
    }
    // A tilted palm can touch at its centre while its edge cuts the skin.
    // The normal chord bounds the displacement of a point at the hand radius.
    const actual: IAutoMovieVector3 = Quaternion.rotateVector(
      wrist.worldRotation,
      surface.normal,
    );
    return Math.max(
      violation,
      radius * Vector3.length(Vector3.add(actual, normal)),
    );
  }
  let best: number = error(preferred);
  if (best <= AutoMovieMotionHumanVerdicts.SKIN || tangent === undefined || radius === 0)
    return grip.forward;
  let chosen: IAutoMovieVector3 | undefined = grip.forward;
  if (preferred === undefined) {
    const wrist: ReturnType<
      ReturnType<typeof HumanHandTarget.prepareMoving>["wrist"]
    > = HumanHandTarget.prepareMoving(body, side, { shape: hold.shape }).wrist(
      stance,
      place,
    );
    const shoulderPoint: IAutoMovieVector3 =
      anchors.get(shoulder)!.worldPosition;
    if (
      Vector3.distance(wrist.point, shoulderPoint) >
      body.measure.upperArm + body.measure.forearm
    ) {
      const circle: ReturnType<typeof HumanCarriedWristCircle> =
        HumanCarriedWristCircle(point, normal, wrist.point, shoulderPoint);
      const forward: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.fromAxisAngle(normal, circle.degrees),
        tangent,
      );
      const violation: number = error(forward);
      if (violation < best) {
        chosen = Quaternion.rotateVector(back, forward);
        best = violation;
        if (best <= AutoMovieMotionHumanVerdicts.SKIN) return chosen;
      }
    }
  }
  // Adjacent sampled rotations displace even the farthest digit by at most one contact skin.
  const intervals: number = Math.ceil(
    Math.PI / Math.asin(Math.min(1, AutoMovieMotionHumanVerdicts.SKIN / (2 * radius))),
  );
  for (let step: number = 1; step <= Math.ceil(intervals / 2); ++step)
    for (const sign of [-1, 1]) {
      const forward: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.fromAxisAngle(normal, (sign * step * 360) / intervals),
        tangent,
      );
      const violation: number = error(forward);
      if (violation >= best) continue;
      best = violation;
      chosen = Quaternion.rotateVector(back, forward);
      if (best <= AutoMovieMotionHumanVerdicts.SKIN) return chosen;
    }
  return chosen;
}
