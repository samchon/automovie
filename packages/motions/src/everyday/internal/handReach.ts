import { Quaternion, Vector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../../posture/HumanColliders";
import { HumanHand } from "../../posture/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/**
 * How far a hand laid at a world rotation reaches past one of its own surfaces
 * along a world direction: the highest point of the hand's and the fingers'
 * colliders along it, the hand in a shape, less the surface's own. A hand laid
 * with that surface on another body's collider keeps its own colliders clear of
 * it by laying the surface this far off along the direction. The shape is set
 * on the posture's own hand once, and each direction is read in that hand's
 * frame, which the laid hand turns to the rotation, so the reach depends on the
 * shape alone, not on where the arm holds the hand.
 *
 * @param body The body.
 * @param posture The posture whose hand is read; only its joints matter.
 * @param side The hand.
 * @param rotation The world rotation the hand is laid at.
 * @param surface The hand surface laid on the place.
 * @param shape The imposed hand shape. Omit it to observe the current finger
 *   articulation.
 * @returns The reach along a world direction, metres.
 */
export function handReach(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  side: AutoMovieHumanSide,
  rotation: IAutoMovieQuaternion,
  surface: IAutoMovieMotionHumanHand.Surface,
  shape?: IAutoMovieMotionHumanHand.Shape,
): (direction: IAutoMovieVector3) => number {
  const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set(
    [...HumanColliders.bones(body)].filter(
      (bone: AutoMovieHumanoidBone): boolean =>
        bone === `${side}Hand` ||
        (bone.startsWith(side) &&
          /(Thumb|Index|Middle|Ring|Little)/.test(bone)),
    ),
  );
  const bones: ReturnType<typeof poseBones> = poseBones(
    body,
    resolveHumanPosture(
      body,
      shape === undefined
        ? posture
        : {
            ...posture,
            joints: { ...posture.joints, ...HumanHand.shape(side, shape) },
          },
    ),
    undefined,
    new Set([...requested, ...HumanHand.frameBones(body, side, surface)]),
  );
  const placed: ReturnType<typeof HumanColliders.placed> =
    HumanColliders.placed(body, bones);
  const point: IAutoMovieVector3 = HumanHand.frame(
    body,
    bones,
    side,
    surface,
    shape,
  ).point;
  return (direction: IAutoMovieVector3): number => {
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(
      bones.get(`${side}Hand`)!.worldRotation,
      Quaternion.rotateVector(Quaternion.inverse(rotation), direction),
    );
    let high: number = -Infinity;
    for (const segment of placed)
      if (requested.has(segment.bone))
        for (const s of segment.shapes)
          high = Math.max(high, AutoMovieEnginePhysics.physicalShapeSpan(segment.pose, s, axis)[1]);
    return high - Vector3.dot(point, axis);
  };
}
