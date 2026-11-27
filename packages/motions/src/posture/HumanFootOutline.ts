import { AutoMovieEngineKinematics } from "@automovie/engine";
import { AutoMovieHumanoidSurfaceRays, Quaternion, Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type { AutoMovieHumanSide, IAutoMovieHumanoidSurfaces, IAutoMovieMotionHumanBody, IAutoMoviePhysicalSegment, IAutoMoviePhysicalShape, IAutoMovieQuaternion, IAutoMovieRigidTransform, IAutoMovieVector3 } from "@automovie/interface";

/** The alternatives of `OfReadSide`'s site. */
type OfReadSide = "Left" | "Right";

/**
 * A foot's outline on its sole: the corners of the outline of the foot's
 * colliders, and the toes' when the profile jointed them, seen from below at
 * rest and laid on the sole's plane, each riding its bone. A foot flat on the
 * floor stands on this outline; one turned about its heel or its ball lifts the
 * part of it away from the pivot. `HumanFoot` reads it for the base of support
 * and a placed foot's sole.
 *
 * At rest each collider gives its points: a hull its vertices, a box its
 * corners, a sphere or a capsule the points of its horizontal circles every
 * 22.5 degrees, all on the shape, so the outline never reaches past it. Each
 * bone's points are dropped to the height of the sole sockets and reduced to
 * the corners of their convex hull in the horizontal plane.
 *
 * @param body The body.
 * @param side The foot.
 * @returns The outline's corners as frames on the foot's bones.
 */
export function HumanFootOutline(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
): readonly IAutoMovieHumanoidSurfaces.IFrame[] {
  const tools: ReturnType<typeof AutoMovieHumanoidSurfaceRays.tools> =
    AutoMovieHumanoidSurfaceRays.tools(body.skeleton, body.profile);
  const Side: OfReadSide = side === "left" ? "Left" : "Right";
  const heel: IAutoMovieHumanoidSurfaces.IFrame =
    body.surfaces.sockets[`heel${Side}`];
  const floor: number = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePoint(
    heel,
    tools.at(heel.bone),
  ).y;
  const out: IAutoMovieHumanoidSurfaces.IFrame[] = [];
  for (const bone of [`${side}Foot`, `${side}Toes`] as const) {
    const segment: IAutoMoviePhysicalSegment | undefined =
      body.profile.segments.find(
        (x: IAutoMoviePhysicalSegment): boolean => x.bone === bone,
      );
    if (segment === undefined) continue;
    const points: IAutoMovieVector3[] = segment.shapes.flatMap(
      (shape: IAutoMoviePhysicalShape): IAutoMovieVector3[] =>
        shapePoints(segment.neutral, shape).map(
          (p: IAutoMovieVector3): IAutoMovieVector3 => ({
            ...p,
            y: floor,
          }),
        ),
    );
    for (const corner of AutoMovieEngineMath.convexHull2D(points))
      out.push(
        tools.local(bone, corner, { x: 0, y: -1, z: 0 }, { x: 0, y: 0, z: 1 }),
      );
  }
  return out;
}

/**
 * The horizontal directions a round collider's outline is read along, every
 * 22.5 degrees.
 */
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
 * hull's vertices, a box's corners, and the horizontal circles of a sphere or a
 * capsule's two end spheres.
 */
function shapePoints(
  pose: IAutoMovieRigidTransform,
  shape: IAutoMoviePhysicalShape,
): IAutoMovieVector3[] {
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    pose.rotation,
    shape.transform.rotation,
  );
  const centre: IAutoMovieVector3 = Vector3.add(
    pose.position,
    Quaternion.rotateVector(pose.rotation, shape.transform.position),
  );
  const at: (local: IAutoMovieVector3) => IAutoMovieVector3 = (
    local: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    Vector3.add(centre, Quaternion.rotateVector(rotation, local));
  const round: (
    middle: IAutoMovieVector3,
    radius: number,
  ) => IAutoMovieVector3[] = (
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
