import {
  Quaternion,
  Vector3,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Which of a partner's segments a hand laid on one of their regions rests
 * on: the region's segment, and a segment jointed to it (its skeleton
 * parent or child) where the hand can reach it from the region, some shape
 * of it within a hand's length of the region's point; a hand laid on a part
 * meets the parts jointed to it where they meet (a palm on the side of the
 * neck under the jaw, a grip on a forearm by the wrist). Every other
 * segment is only in the arm's way.
 *
 * @param partner The partner's body.
 * @param region The region the hand is laid on.
 * @param hand The performer's hand length, metres (`IAutoMovieBodyMeasure.hand`).
 * @returns At the partner's bones of a second, whether a placed segment is one the hand rests on.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, its source in the skeleton and the reach, and what is returned.
 * @evidence contracts/development/implementation.md#principled-implementation The region's bone and its skeleton neighbours, each kept only where the engine's exact shape distance from the region's point is within the hand's length.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One neighbour set per partner and region, one region point and one distance test per segment and second.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No segment beyond the region's neighbours is excused, and a neighbour out of the hand's reach stays an obstacle.
 * @evidence contracts/development/implementation.md#efficient-algorithms The neighbour set is built once; at a second only the neighbours' shapes are measured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The skeleton, the surface table and the engine's shape distance, read and not restated.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the neighbour set and the region's frame; each second's bones are borrowed for that call.
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
        : Vector3.add(
            carrier.worldPosition,
            Quaternion.rotateVector(carrier.worldRotation, surface.point),
          );
    return (segment: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
      segment.bone === bone ||
      (at !== undefined &&
        jointed.has(segment.bone) &&
        segment.shapes.some(
          (
            shape: IAutoMovieMotionHumanColliders.IPlaced["shapes"][number],
          ): boolean =>
            physicalShapeSegmentDistance(segment.pose, shape, at, at) <= hand,
        ));
  };
}
