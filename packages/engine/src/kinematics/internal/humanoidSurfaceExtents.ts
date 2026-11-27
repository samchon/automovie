import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanoidSurfaceExtents,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";

/*
 * The extent of every region of a body: the radius of the disc about the
 * region's point that is still that region, read from the body's own rest pose.
 * A named region of the skin reaches until the next one begins, so its disc
 * reaches half way to the nearest other region that faces the same way (two
 * discs overlap on the surface only where they face it from one side, so a palm
 * and the back of the same hand, a chest and an upper back, are never each
 * other's bound), and no farther than half its segment's least breadth, so the
 * disc stays on the face of the segment it lies on (a forearm's disc does not
 * wrap round to the arm's other side). No region is smaller than the 10 mm a
 * pressed skin gives, the contact tolerance a hand on it is read against.
 */
export function humanoidSurfaceExtents(
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
      const point: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
        bone.worldRotation,
        frame.point,
      );
      point.x = origin.x + point.x;
      point.y = origin.y + point.y;
      point.z = origin.z + point.z;
      return {
        name: name as AutoMovieHumanoidRegion,
        bone: frameBone,
        point,
        normal: AutoMovieEngineQuaternion.rotateVector(bone.worldRotation, frame.normal),
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
        AutoMovieEngineVector3.dot(other.normal, region.normal) > 0
      ) {
        const distance: number = AutoMovieEngineVector3.distance(other.point, region.point);
        nearest[i] = Math.min(nearest[i]!, distance);
        nearest[j] = Math.min(nearest[j]!, distance);
      }
    }
  }
  const out: Record<AutoMovieHumanoidRegion, number> = {} as Record<
    AutoMovieHumanoidRegion,
    number
  >;
  for (let i: number = 0; i < placed.length; i++) {
    const region: IPlaced = placed[i]!;
    const box: ReturnType<typeof bounds> = bounds(region.bone);
    const breadth: number = Math.min(
      box.max.x - box.min.x,
      box.max.y - box.min.y,
      box.max.z - box.min.z,
    );
    out[region.name] = Math.max(
      CONTACT,
      Math.min(nearest[i]! / 2, breadth / 2),
    );
  }
  return out;
}

/*
 * Actual world observations owned only by one extent calculation.
 */
interface IPlaced {
  /*
   * Original region key, preserving callback/output order.
   */
  name: AutoMovieHumanoidRegion;

  /*
   * Existing region bone passed to the caller's breadth reader.
   */
  bone: AutoMovieHumanoidBone;

  /*
   * Fresh world point in metres.
   */
  point: IAutoMovieVector3;

  /*
   * Fresh world-facing direction used by the existing positive-dot gate.
   */
  normal: IAutoMovieVector3;
}

/*
 * The least extent of a region, metres: the 10 mm a pressed skin gives, the
 * tolerance a contact on it is read against.
 */
const CONTACT: number = 0.01;
