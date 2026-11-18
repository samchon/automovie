import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanoidSurfaceExtents,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

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
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Place every region in the world, reduce each actual unordered neighbour pair into both nearest distances, then read each region's collider breadth and contact floor in the original order.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every length is the body's own: its regions' places and its colliders' bounds; no region is special-cased.
 * @evidence contracts/development/implementation.md#efficient-algorithms Remains O(R squared) for R regions, with at most R(R-1)/2 normal/distance pairs instead of R(R-1). World points reuse their owned rotated offset; Vector3.distance keeps the existing magnitude branches without a displacement record. O(R) nearest scalars are local; all original at/bounds observations remain. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Private fresh placed points/normals fix each pair. XYZ dot products commute and distance is unchanged by reversing its displacement, so one calculation serves both endpoints. Ascending i/j traversal updates each region's neighbours in the original index order. At is still called once per region before all breadth reads, and bounds once per region in the original order; no caller callback result is cached.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Fresh placed geometry and O(R) nearest scalars end on return or throw. The fresh output holds only region radii, retaining no callbacks, bone/frame objects, body, history or external handle.
 */
export function AutoMovieHumanoidSurfaceExtents(
  regions: Readonly<
    Record<AutoMovieHumanoidRegion, IAutoMovieHumanoidSurfaces.IFrame>
  >,
  at: (bone: AutoMovieHumanoidBone) => IAutoMovieResolvedBone,
  bounds: IAutoMovieHumanoidSurfaceExtents.ReadBounds,
): Record<AutoMovieHumanoidRegion, number> {
  const placed: IPlaced[] = Object.entries(regions).map(
    ([name, frame]: [string, IAutoMovieHumanoidSurfaces.IFrame]): IPlaced => {
      const bone: IAutoMovieResolvedBone = at(frame.bone);
      const frameBone: AutoMovieHumanoidBone = frame.bone;
      const origin: IAutoMovieVector3 = bone.worldPosition;
      const point: IAutoMovieVector3 = Quaternion.rotateVector(bone.worldRotation, frame.point);
      point.x = origin.x + point.x;
      point.y = origin.y + point.y;
      point.z = origin.z + point.z;
      return {
        name: name as AutoMovieHumanoidRegion,
        bone: frameBone,
        point,
        normal: Quaternion.rotateVector(bone.worldRotation, frame.normal),
      };
    },
  );
  const nearest: number[] = new Array<number>(placed.length).fill(Infinity);
  for (let i: number = 0; i < placed.length; i++) {
    const region: IPlaced = placed[i]!;
    for (let j: number = i + 1; j < placed.length; j++) {
      const other: IPlaced = placed[j]!;
      if (
        other.name !== region.name &&
        Vector3.dot(other.normal, region.normal) > 0
      ) {
        const distance: number = Vector3.distance(other.point, region.point);
        nearest[i] = Math.min(nearest[i]!, distance);
        nearest[j] = Math.min(nearest[j]!, distance);
      }
    }
  }
  const out: Record<AutoMovieHumanoidRegion, number> = {} as Record<AutoMovieHumanoidRegion, number>;
  for (let i: number = 0; i < placed.length; i++) {
    const region: IPlaced = placed[i]!;
    const box: ReturnType<typeof bounds> = bounds(region.bone);
    const breadth: number = Math.min(
      box.max.x - box.min.x,
      box.max.y - box.min.y,
      box.max.z - box.min.z,
    );
    out[region.name] = Math.max(CONTACT, Math.min(nearest[i]! / 2, breadth / 2));
  }
  return out;
}

/** Actual world observations owned only by one extent calculation. */
interface IPlaced {
  /** Original region key, preserving callback/output order. */
  name: AutoMovieHumanoidRegion;

  /** Existing region bone passed to the caller's breadth reader. */
  bone: AutoMovieHumanoidBone;

  /** Fresh world point in metres. */
  point: IAutoMovieVector3;

  /** Fresh world-facing direction used by the existing positive-dot gate. */
  normal: IAutoMovieVector3;
}

/** The least extent of a region, metres: the 10 mm a pressed skin gives, the tolerance a contact on it is read against. */
const CONTACT: number = 0.01;
