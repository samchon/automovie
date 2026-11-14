import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";
import type { resolveAutoMovieHumanoidSurfaces } from "./resolveAutoMovieHumanoidSurfaces";

/**
 * The extent of every region of a body: the radius of the disc about the
 * region's point that is still that region, read from the body's own rest
 * pose. A named region of the skin reaches until the next one begins, so
 * its disc reaches half way to the nearest other region that faces the
 * same way (two discs overlap on the surface only where they face it from
 * one side, so a palm and the back of the same hand, a chest and an upper
 * back, are never each other's bound), and no farther than half its
 * segment's least breadth, so the disc stays on the face of the segment it
 * lies on (a forearm's disc does not wrap round to the arm's other side).
 * No region is smaller than the 10 mm a pressed skin gives, the contact
 * tolerance a hand on it is read against.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what an extent is, the two bounds with their anatomical basis and the floor.
 * @evidence contracts/development/implementation.md#principled-implementation A region is an area of the skin between its neighbours: a disc about its point, bounded by the half distance to the nearest neighbour facing the same way and by its segment's half breadth.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass places every region in the world, a second reads each one's two bounds and the floor.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every length is the body's own: its regions' places and its colliders' bounds; no region is special-cased.
 * @evidence contracts/development/implementation.md#efficient-algorithms Quadratic in the regions, a few dozen per body, resolved once per body.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of the body; its caller resolves once per body.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh record and retains nothing.
 */
export function AutoMovieHumanoidSurfaceExtents(
  regions: Readonly<
    Record<AutoMovieHumanoidRegion, resolveAutoMovieHumanoidSurfaces.IFrame>
  >,
  at: (bone: AutoMovieHumanoidBone) => IAutoMovieResolvedBone,
  bounds: (bone: AutoMovieHumanoidBone) => {
    min: IAutoMovieVector3;
    max: IAutoMovieVector3;
  },
): Record<AutoMovieHumanoidRegion, number> {
  const placed = Object.entries(regions).map(
    ([name, frame]: [string, resolveAutoMovieHumanoidSurfaces.IFrame]) => {
      const bone: IAutoMovieResolvedBone = at(frame.bone);
      return {
        name: name as AutoMovieHumanoidRegion,
        bone: frame.bone,
        point: Vector3.add(
          bone.worldPosition,
          Quaternion.rotateVector(bone.worldRotation, frame.point),
        ),
        normal: Quaternion.rotateVector(bone.worldRotation, frame.normal),
      };
    },
  );
  const out = {} as Record<AutoMovieHumanoidRegion, number>;
  for (const region of placed) {
    let nearest: number = Infinity;
    for (const other of placed)
      if (
        other.name !== region.name &&
        Vector3.dot(other.normal, region.normal) > 0
      )
        nearest = Math.min(
          nearest,
          Vector3.length(Vector3.subtract(other.point, region.point)),
        );
    const box = bounds(region.bone);
    const breadth: number = Math.min(
      box.max.x - box.min.x,
      box.max.y - box.min.y,
      box.max.z - box.min.z,
    );
    out[region.name] = Math.max(CONTACT, Math.min(nearest / 2, breadth / 2));
  }
  return out;
}

/** The least extent of a region, metres: the 10 mm a pressed skin gives, the tolerance a contact on it is read against. */
const CONTACT: number = 0.01;
