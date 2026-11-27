import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
  AutoMovieEnginePhysics,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Which of a partner's segments a hand laid on one of their regions rests on:
 * the region's segment, and a segment jointed to it (its skeleton parent or
 * child) where the hand can reach it from the region, some shape of it within a
 * hand's length of the region's point; a hand laid on a part meets the parts
 * jointed to it where they meet (a palm on the side of the neck under the jaw,
 * a grip on a forearm by the wrist). Every other segment is only in the arm's
 * way.
 * Parameter partner: The partner's body.
 * Parameter region: The region the hand is laid on.
 * Parameter hand: The performer's hand length, metres
 * (`IAutoMovieBodyMeasure.hand`).
 * Returns: At the partner's bones of a second, whether a placed segment is one
 * the hand rests on.
 */
export function touchHoldRests(
  partner: IAutoMovieMotionHumanBody,
  region: AutoMovieHumanoidRegion,
  hand: number,
): (
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
) => (segment: IAutoMovieMotionHumanColliders.IPlaced) => boolean {
  const surface:
    | (typeof partner.surfaces.regions)[AutoMovieHumanoidRegion]
    | undefined = partner.surfaces.regions[region];
  const bone: AutoMovieHumanoidBone | undefined = surface?.bone;
  const parents: Map<AutoMovieHumanoidBone, AutoMovieHumanoidBone | null> =
    new Map();
  for (const b of partner.skeleton.bones) parents.set(b.bone, b.parent);
  const jointed: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>(
      bone === undefined
        ? []
        : [...parents.keys()].filter(
            (b: AutoMovieHumanoidBone): boolean =>
              parents.get(b) === bone || parents.get(bone) === b,
          ),
    );
  return (
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ) => {
    const carrier: IAutoMovieResolvedBone | undefined =
      bone === undefined ? undefined : bones.get(bone);
    const at: IAutoMovieVector3 | undefined =
      carrier === undefined || surface === undefined
        ? undefined
        : AutoMovieEngineVector3.add(
            carrier.worldPosition,
            AutoMovieEngineQuaternion.rotateVector(carrier.worldRotation, surface.point),
          );
    return (segment: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
      segment.bone === bone ||
      (at !== undefined &&
        jointed.has(segment.bone) &&
        segment.shapes.some(
          (
            shape: IAutoMovieMotionHumanColliders.IPlaced["shapes"][number],
          ): boolean =>
            AutoMovieEnginePhysics.physicalShapeSegmentDistance(segment.pose, shape, at, at) <= hand,
        ));
  };
}
