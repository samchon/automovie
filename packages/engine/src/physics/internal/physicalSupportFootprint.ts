import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieXpbdBody } from "../AutoMovieXpbdBody";
import { physicalShapeBoundsImplementation } from "./physicalShapeBoundsImplementation";
import { AutoMovieEnginePhysicalStanceBalance } from "../AutoMovieEnginePhysicalStanceBalance";
import { physicalSupportPoint } from "./physicalSupportPoint";

/*
 * The floor-plane outline of a limb's support patch: its contact carriers'
 * bearing face projected straight down, hull vertices exactly and other shapes
 * by their bounds' corners, the face being the vertices within the foot-lift
 * bound of the patch's lowest. It bounds where the limb can bear whether or not
 * each of its points is touching this step, so a balance command that unloads a
 * point does not shrink the region it is commanded within, while a side or a
 * toe held off the floor does not widen it.
 * Parameter profile: The body's profile.
 * Parameter poses: The carriers' poses: the native segments, or fixed world
 * transforms such as the planted pose.
 * Parameter limb: The support limb; omitted contacts select its own bone.
 * Parameter floor: The floor height, world metres.
 * Returns: The projected points at the floor height, world metres; empty when
 * the limb has no shape.
 */
export function physicalSupportFootprint(
  profile: IAutoMoviePhysicalProfile,
  poses:
    | ReadonlyMap<string, AutoMovieXpbdBody>
    | Readonly<Record<string, IAutoMovieRigidTransform>>,
  limb: IAutoMovieFootfallPattern["limbs"][number],
  floor: number,
): IAutoMovieVector3[] {
  const out: IAutoMovieVector3[] = [];
  const carriers: readonly string[] = limb.contacts ?? [limb.bone];
  // Only the face the patch bears on: its vertices within the foot-lift
  // bound of its lowest (`AutoMovieEnginePhysicalStanceBalance.LIFT`). A rounded or rolled
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
    for (const shape of physicalSupportFootprint.colliders(segment)) {
      const corners: IAutoMovieVector3[] | undefined =
        physicalSupportFootprint.corners(shape);
      if (corners)
        for (const point of corners) {
          const world: IAutoMovieVector3 = physicalSupportPoint(pose, point);
          out.push({ x: world.x, y: floor, z: world.z });
          heights.push(world.y);
        }
      else {
        const box: ReturnType<typeof physicalShapeBoundsImplementation.physicalShapeBounds> = physicalShapeBoundsImplementation.physicalShapeBounds(
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
  }
  const lowest: number = Math.min(...heights);
  return out.filter(
    (_, index: number): boolean =>
      heights[index]! <= lowest + AutoMovieEnginePhysicalStanceBalance.LIFT,
  );
}

/*
 * The support functions of physicalSupportFootprint.
 */
export namespace physicalSupportFootprint {
  /*
   * Whether a limb is grounded: a point of one of its contact carriers'
   * colliders lies within the contact skin of the floor, `LIFT` above it
   * (`AutoMovieEnginePhysicalStanceBalance.LIFT`). A foot rolled onto an edge is grounded; a
   * lifted one is not.
   * Parameter profile: The body's profile.
   * Parameter poses: The carriers' poses: the native segments or fixed world
   * transforms.
   * Parameter limb: The support limb; omitted contacts select its own bone.
   * Parameter floor: The floor height, world metres.
   * Returns: Whether the limb is grounded.
   */
  export function grounded(
    profile: IAutoMoviePhysicalProfile,
    poses:
      | ReadonlyMap<string, AutoMovieXpbdBody>
      | Readonly<Record<string, IAutoMovieRigidTransform>>,
    limb: IAutoMovieFootfallPattern["limbs"][number],
    floor: number,
  ): boolean {
    const carriers: readonly string[] = limb.contacts ?? [limb.bone];
    return profile.segments.some((segment: IAutoMoviePhysicalSegment) => {
      if (!carriers.includes(segment.bone)) return false;
      const pose: IAutoMovieRigidTransform | undefined = poseOf(
        poses,
        segment.bone,
      );
      return (
        pose !== undefined &&
        colliders(segment).some(
          (shape: IAutoMoviePhysicalShape): boolean =>
            physicalShapeBoundsImplementation.physicalShapeBoundsLowest(pose, shape) <=
            floor + AutoMovieEnginePhysicalStanceBalance.LIFT,
        )
      );
    });
  }

  /*
   * Every collider the world binds for a segment: its drawn shapes and its
   * simulation-only contact shapes, such as a foot's sole box, which are what
   * meets the floor.
   * Parameter segment: The profile segment.
   * Returns: The drawn shapes, then the contact shapes.
   */
  export function colliders(
    segment: IAutoMoviePhysicalSegment,
  ): IAutoMoviePhysicalShape[] {
    return [...segment.shapes, ...(segment.contactShapes ?? [])];
  }

  /*
   * A shape's corner vertices in its segment's frame: a hull's points and a
   * box's eight corners exactly; none for a rounded shape.
   * Parameter shape: The shape.
   * Returns: The vertices, metres, or undefined for a rounded shape.
   */
  export function corners(
    shape: IAutoMoviePhysicalShape,
  ): IAutoMovieVector3[] | undefined {
    if (shape.kind === "hull")
      return shape.points.map(
        (point: IAutoMovieVector3): IAutoMovieVector3 =>
          physicalSupportPoint(shape.transform, point),
      );
    if (shape.kind === "box")
      return [-1, 1].flatMap((x: number): IAutoMovieVector3[] =>
        [-1, 1].flatMap((y: number): IAutoMovieVector3[] =>
          [-1, 1].map(
            (z: number): IAutoMovieVector3 =>
              physicalSupportPoint(shape.transform, {
                x: x * shape.halfExtents.x,
                y: y * shape.halfExtents.y,
                z: z * shape.halfExtents.z,
              }),
          ),
        ),
      );
    return undefined;
  }
}

/*
 * A segment's pose from native bodies or fixed transforms.
 */
function poseOf(
  poses:
    | ReadonlyMap<string, AutoMovieXpbdBody>
    | Readonly<Record<string, IAutoMovieRigidTransform>>,
  bone: string,
): IAutoMovieRigidTransform | undefined {
  if (poses instanceof Map) {
    const rigid: AutoMovieXpbdBody | undefined = (
      poses as ReadonlyMap<string, AutoMovieXpbdBody>
    ).get(bone);
    return rigid
      ? {
          position: rigid.translation(),
          rotation: rigid.rotation(),
        }
      : undefined;
  }
  return (poses as Readonly<Record<string, IAutoMovieRigidTransform>>)[bone];
}
