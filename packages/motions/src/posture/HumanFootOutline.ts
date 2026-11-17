import {
  AutoMovieHumanoidSurfaceRays,
  Quaternion,
  Vector3,
  convexHull2D,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMoviePhysicalProfile,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A foot's outline on its sole: the corners of the outline of the foot's
 * colliders, and the toes' when the profile jointed them, seen from below at
 * rest and laid on the sole's plane, each riding its bone. A foot flat on
 * the floor stands on this outline; one turned about its heel or its ball
 * lifts the part of it away from the pivot. `HumanFoot` reads it for the
 * base of support and a placed foot's sole.
 *
 * At rest each collider gives its points: a hull its vertices, a box its
 * corners, a sphere or a capsule the points of its horizontal circles every
 * 22.5 degrees, all on the shape, so the outline never reaches past it. Each
 * bone's points are dropped to the height of the sole sockets and reduced to
 * the corners of their convex hull in the horizontal plane.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the outline is, how it is read off the colliders and who reads it.
 * @evidence contracts/development/design.md#principled-representation The sole's outline as frames on the foot's bones, so it rides the displayed foot.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One reader, its points made once per body.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every corner is a point of the body's own colliders; no foot size is typed.
 */
export namespace HumanFootOutline {
  /**
   * A foot's outline corners.
   *
   * @param body The body.
   * @param side The foot.
   * @returns The outline's corners as frames on the foot's bones.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result; the namespace gives the reading.
   * @evidence contracts/development/implementation.md#principled-implementation The colliders' points at rest dropped to the sole's plane and reduced to their convex hull, the outline a foot flat on the floor stands on.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reading per side, made once per body.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unknown collider kind throws instead of being skipped.
   * @evidence contracts/development/implementation.md#efficient-algorithms One hull per bone per body; every later call reads the cache.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's surface rays, its surface frames and its planar hull.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Held per live body in a weak map.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
  ): readonly IAutoMovieHumanoidSurfaces.IFrame[] {
    let found:
      | Record<"left" | "right", IAutoMovieHumanoidSurfaces.IFrame[]>
      | undefined = OUTLINES.get(body);
    if (found === undefined) {
      const tools = AutoMovieHumanoidSurfaceRays.tools(
        body.skeleton,
        body.profile,
      );
      const read = (
        s: "left" | "right",
      ): IAutoMovieHumanoidSurfaces.IFrame[] => {
        const Side: "Left" | "Right" = s === "left" ? "Left" : "Right";
        const heel: IAutoMovieHumanoidSurfaces.IFrame =
          body.surfaces.sockets[`heel${Side}`];
        const floor: number = resolveAutoMovieHumanoidSurfaces.place(
          heel,
          tools.at(heel.bone),
        ).point.y;
        const out: IAutoMovieHumanoidSurfaces.IFrame[] = [];
        for (const bone of [`${s}Foot`, `${s}Toes`] as const) {
          const segment = body.profile.segments.find(
            (x): boolean => x.bone === bone,
          );
          if (segment === undefined) continue;
          const points: IAutoMovieVector3[] = segment.shapes.flatMap(
            (shape): IAutoMovieVector3[] =>
              shapePoints(segment.neutral, shape).map(
                (p: IAutoMovieVector3): IAutoMovieVector3 => ({
                  ...p,
                  y: floor,
                }),
              ),
          );
          for (const corner of convexHull2D(points))
            out.push(
              tools.local(
                bone,
                corner,
                { x: 0, y: -1, z: 0 },
                { x: 0, y: 0, z: 1 },
              ),
            );
        }
        return out;
      };
      found = { left: read("left"), right: read("right") };
      OUTLINES.set(body, found);
    }
    return found[side];
  }
}

/** Each body's sole outlines, made once. */
const OUTLINES: WeakMap<
  IAutoMovieMotionHumanBody,
  Record<"left" | "right", IAutoMovieHumanoidSurfaces.IFrame[]>
> = new WeakMap();

/** The horizontal directions a round collider's outline is read along, every 22.5 degrees. */
const ROUND: readonly IAutoMovieVector3[] = Array.from(
  { length: 16 },
  (_: unknown, k: number): IAutoMovieVector3 => ({
    x: Math.cos((k * Math.PI) / 8),
    y: 0,
    z: Math.sin((k * Math.PI) / 8),
  }),
);

/**
 * Points on a collider placed by its segment's neutral pose, world metres: a
 * hull's vertices, a box's corners, and the horizontal circles of a sphere or
 * a capsule's two end spheres.
 */
function shapePoints(
  pose: IAutoMoviePhysicalProfile.ITransform,
  shape: IAutoMoviePhysicalProfile.IShape,
): IAutoMovieVector3[] {
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    pose.rotation,
    shape.transform.rotation,
  );
  const centre: IAutoMovieVector3 = Vector3.add(
    pose.position,
    Quaternion.rotateVector(pose.rotation, shape.transform.position),
  );
  const at = (local: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.add(centre, Quaternion.rotateVector(rotation, local));
  const round = (
    middle: IAutoMovieVector3,
    radius: number,
  ): IAutoMovieVector3[] =>
    ROUND.map(
      (d: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(middle, Vector3.scale(d, radius)),
    );
  if (shape.kind === "hull") return shape.points.map(at);
  if (shape.kind === "box") {
    const h: IAutoMovieVector3 = shape.halfExtents;
    const out: IAutoMovieVector3[] = [];
    for (const x of [-h.x, h.x])
      for (const y of [-h.y, h.y])
        for (const z of [-h.z, h.z]) out.push(at({ x, y, z }));
    return out;
  }
  if (shape.kind === "sphere") return round(centre, shape.radius);
  if (shape.kind === "capsule")
    return [
      ...round(at({ x: 0, y: shape.halfLength, z: 0 }), shape.radius),
      ...round(at({ x: 0, y: -shape.halfLength, z: 0 }), shape.radius),
    ];
  shape satisfies never;
  throw new Error("Unknown physical shape kind");
}
