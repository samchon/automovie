import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalProfile,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { RigidBody } from "@dimforge/rapier3d-compat";

import { physicalNativeVector } from "./physicalNativeVector";
import { physicalShapeBounds } from "./physicalShapeBounds";
import { physicalStanceBalance } from "./physicalStanceBalance";
import { physicalSupportPoint } from "./physicalSupportPoint";

/**
 * The floor-plane outline of a limb's support patch: its contact carriers'
 * bearing face projected straight down, hull vertices exactly and other
 * shapes by their bounds' corners, the face being the vertices within the
 * foot-lift bound of the patch's lowest. It bounds where the limb can bear
 * whether or not each of its points is touching this step, so a balance
 * command that unloads a point does not shrink the region it is commanded
 * within, while a side or a toe held off the floor does not widen it.
 *
 * @param profile The body's profile.
 * @param poses The carriers' poses: the native segments, or fixed world transforms such as the planted pose.
 * @param limb The support limb; omitted contacts select its own bone.
 * @param floor The floor height, world metres.
 * @returns The projected points at the floor height, world metres; empty when the limb has no shape.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is projected, how each shape kind is read and why the outline is independent of momentary contact.
 * @evidence contracts/development/implementation.md#principled-implementation Reads the given poses and the profile's own shapes; nothing is assumed of the limb's anatomy.
 */
export function physicalSupportFootprint(
  profile: IAutoMoviePhysicalProfile,
  poses:
    | ReadonlyMap<string, RigidBody>
    | Readonly<Record<string, IAutoMovieRigidTransform>>,
  limb: IAutoMovieFootfallPattern["limbs"][number],
  floor: number,
): IAutoMovieVector3[] {
  const out: IAutoMovieVector3[] = [];
  const carriers: readonly string[] = limb.contacts ?? [limb.bone];
  // Only the face the patch bears on: its vertices within the foot-lift
  // bound of its lowest (`physicalStanceBalance.LIFT`). A rounded or rolled
  // sole and toes held off the floor do not widen where the centre of
  // pressure can go.
  const heights: number[] = [];
  for (const segment of profile.segments) {
    if (!carriers.includes(segment.bone)) continue;
    const pose: IAutoMovieRigidTransform | undefined = poseOf(
      poses,
      segment.bone,
    );
    if (!pose) continue;
    for (const shape of segment.shapes)
      if (shape.kind === "hull")
        for (const point of shape.points) {
          const world: IAutoMovieVector3 = physicalSupportPoint(
            pose,
            physicalSupportPoint(shape.transform, point),
          );
          out.push({ x: world.x, y: floor, z: world.z });
          heights.push(world.y);
        }
      else {
        const box: ReturnType<typeof physicalShapeBounds> = physicalShapeBounds(
          pose,
          shape,
        );
        for (const x of [box.min.x, box.max.x])
          for (const z of [box.min.z, box.max.z]) {
            out.push({ x, y: floor, z });
            heights.push(box.min.y);
          }
      }
  }
  const lowest: number = Math.min(...heights);
  return out.filter(
    (_, index: number): boolean =>
      heights[index]! <= lowest + physicalStanceBalance.LIFT,
  );
}

/** A segment's pose from native bodies or fixed transforms. */
function poseOf(
  poses:
    | ReadonlyMap<string, RigidBody>
    | Readonly<Record<string, IAutoMovieRigidTransform>>,
  bone: string,
): IAutoMovieRigidTransform | undefined {
  if (poses instanceof Map) {
    const rigid: RigidBody | undefined = (
      poses as ReadonlyMap<string, RigidBody>
    ).get(bone);
    return rigid
      ? {
          position: physicalNativeVector(rigid.translation()),
          rotation: rigid.rotation(),
        }
      : undefined;
  }
  return (poses as Readonly<Record<string, IAutoMovieRigidTransform>>)[bone];
}
