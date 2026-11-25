import type {
  IAutoMoviePhysicalShape,
  IAutoMoviePlanarPoint,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { triangulateAutoMoviePolygon } from "../drawing/triangulateAutoMoviePolygon";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { physicalShapeGjk } from "./physicalShapeGjk";
import { physicalShapeHull } from "./physicalShapeHull";
import { physicalShapeSupport } from "./physicalShapeSupport";

/**
 * Find the lowest point of a convex solid over a bounded simple contact face,
 * in face-local metres. The signed clearance is measured along face-local +Y.
 * Face edges are retained and either polygon winding is accepted.
 */
export function physicalShapeFaceContact(
  pose: IAutoMovieRigidTransform,
  shape: physicalShapeFaceContact.Shape,
  face: IAutoMovieRigidTransform,
  outline: readonly IAutoMovieVector3[],
  column: IAutoMovieVector3 = { x: 0, y: 1, z: 0 },
): physicalShapeFaceContact.IContact | undefined {
  return physicalShapeFaceContact.prepare(face, outline, column)(pose, shape);
}

/** Prepared bounded contact geometry and its exact solid inputs. */
export namespace physicalShapeFaceContact {
  /** A physical collider or an emitted flat-ended circular solid. */
  export type Shape =
    | IAutoMoviePhysicalShape
    | {
        /** Flat cylinder or a cone with its circular base at positive local Y. */
        kind: "cylinder" | "cone";
        /** Solid pose relative to the given parent. */
        transform: IAutoMovieRigidTransform;
        /** Positive local axial height, metres. */
        height: number;
        /** Positive circular base radius, metres. */
        radius: number;
      };

  /** The selected witness and signed gap in the material's face frame. */
  export interface IContact {
    /** The witness projected onto the face, with face-local Y zero. */
    point: IAutoMovieVector3;
    /** Coplanar points spanning a non-point witness, in face-local metres. */
    patch?: readonly IAutoMovieVector3[];
    /** Gap along the face normal, negative when the solid enters the face. */
    clearance: number;
  }

  /**
   * Prepare a face outline for repeated shape placements. The column direction
   * is expressed in face space and has nonzero Y. Its default follows the face
   * normal. A terrain owning world-horizontal bounds can pass its local world
   * vertical instead, preserving the same boundary at every height.
   */
  export function prepare(
    face: IAutoMovieRigidTransform,
    outline: readonly IAutoMovieVector3[],
    column: IAutoMovieVector3 = UP,
  ): (pose: IAutoMovieRigidTransform, shape: Shape) => IContact | undefined {
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(face.rotation);
    const pieces: readonly (readonly ISide[])[] = partition(outline);
    const axis: IAutoMovieVector3 = Vector3.scale(column, 1 / column.y);
    const orthogonal: boolean = axis.x === 0 && axis.z === 0;
    const project = (point: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: point.x - point.y * axis.x,
      y: 0,
      z: point.z - point.y * axis.z,
    });
    return (
      pose: IAutoMovieRigidTransform,
      shape: Shape,
    ): IContact | undefined => {
      if (pieces.length === 0) return undefined;
      const parent: IAutoMovieRigidTransform = {
        position: Quaternion.rotateVector(
          inverse,
          Vector3.subtract(pose.position, face.position),
        ),
        rotation: Quaternion.multiply(inverse, pose.rotation),
      };
      const at: IAutoMovieVector3 = Vector3.add(
        parent.position,
        Quaternion.rotateVector(parent.rotation, shape.transform.position),
      );
      const q: IAutoMovieQuaternion = Quaternion.multiply(
        parent.rotation,
        shape.transform.rotation,
      );
      const place = (point: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(at, Quaternion.rotateVector(q, point));
      const support: physicalShapeGjk.Support = (
        direction: IAutoMovieVector3,
      ): IAutoMovieVector3 =>
        "id" in shape
          ? physicalShapeSupport(parent, shape, direction)
          : roundSupport(shape, at, q, direction);
      const bottom: IAutoMovieVector3 = support({ x: 0, y: -1, z: 0 });
      const minimum: IAutoMovieVector3 = project(bottom);
      const loops: readonly (readonly IAutoMovieVector3[])[] | undefined =
        shape.kind === "box"
          ? box(shape.halfExtents)
          : shape.kind === "hull"
            ? physicalShapeHull(shape).faces.map(({ loop }) => loop)
            : undefined;
      const tangent: IAutoMovieVector3 = Quaternion.rotateVector(q, UP);
      const read = (sides: readonly ISide[]): IContact | undefined => {
        if (loops !== undefined) return polytope(loops, place, sides, project);
        if (
          shape.kind === "capsule" &&
          Math.abs(tangent.y) <= 8 * Number.EPSILON &&
          shape.halfLength > 0
        ) {
          const lowest: IAutoMovieVector3 = { ...at, y: at.y - shape.radius };
          const interval:
            | readonly [IAutoMovieVector3, IAutoMovieVector3]
            | undefined = clipSegment(
            project(Vector3.addScaled(lowest, tangent, -shape.halfLength)),
            project(Vector3.addScaled(lowest, tangent, shape.halfLength)),
            sides,
          );
          if (interval !== undefined)
            return {
              point: Vector3.lerp(interval[0], interval[1], 0.5),
              clearance: bottom.y,
              ...(Vector3.distance(interval[0], interval[1]) > 0
                ? { patch: interval }
                : {}),
            };
        }
        if (sides.every((side: ISide): boolean => offset(side, minimum) >= 0))
          return { point: minimum, clearance: bottom.y };
        if (shape.kind === "sphere" && orthogonal)
          return sphere(at, shape.radius, sides);

        // The columns clipped at height h form a convex prism. The intersection
        // predicate grows monotonically with h, including circular side contact.
        return roundPrism(
          support,
          sides,
          axis,
          project,
          bottom.y,
          support(UP).y,
        );
      };
      let best: IContact | undefined;
      for (const sides of pieces) {
        const candidate: IContact | undefined = read(sides);
        if (candidate === undefined) continue;
        if (best === undefined || candidate.clearance < best.clearance)
          best = candidate;
      }
      return best;
    };
  }
}

/** Preserve a concave polygon's real boundary by clipping its convex pieces. */
function partition(
  outline: readonly IAutoMovieVector3[],
): readonly (readonly ISide[])[] {
  const sides: readonly ISide[] = polygon(outline);
  if (sides.length === 0) return [];
  if (
    sides.every((side: ISide): boolean =>
      outline.every(
        (point: IAutoMovieVector3): boolean =>
          offset(side, point) >=
          -32 * Number.EPSILON * Vector3.distance(side.a, point),
      ),
    )
  )
    return [sides];
  const points: readonly IAutoMoviePlanarPoint[] = outline.map(
    ({ x, z }: IAutoMovieVector3): IAutoMoviePlanarPoint => ({ x, y: z }),
  );
  return triangulateAutoMoviePolygon(points)
    .map((triangle): ISide[] =>
      polygon(triangle.map((i: number): IAutoMovieVector3 => outline[i]!)),
    )
    .filter((piece: ISide[]): boolean => piece.length !== 0);
}

/** Face-space upward normal and height axis. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** One boundary in the face plane and its inward normal. */
interface ISide {
  /** The edge start in the face plane. */
  a: IAutoMovieVector3;
  /** The edge end in the face plane. */
  b: IAutoMovieVector3;
  /** The edge's unit inward direction. */
  inward: IAutoMovieVector3;
}

/** Read nonzero polygon edges and orient them toward the interior. */
function polygon(outline: readonly IAutoMovieVector3[]): ISide[] {
  let twice: number = 0;
  for (let i: number = 0; i < outline.length; ++i) {
    const a: IAutoMovieVector3 = outline[i]!;
    const b: IAutoMovieVector3 = outline[(i + 1) % outline.length]!;
    twice += a.x * b.z - a.z * b.x;
  }
  if (twice === 0) return [];
  const sign: number = Math.sign(twice);
  const result: ISide[] = [];
  for (let i: number = 0; i < outline.length; ++i) {
    const a: IAutoMovieVector3 = { ...outline[i]!, y: 0 };
    const b: IAutoMovieVector3 = {
      ...outline[(i + 1) % outline.length]!,
      y: 0,
    };
    const length: number = Math.hypot(b.x - a.x, b.z - a.z);
    if (length > 0)
      result.push({
        a,
        b,
        inward: {
          x: (sign * (a.z - b.z)) / length,
          y: 0,
          z: (sign * (b.x - a.x)) / length,
        },
      });
  }
  return result;
}

/** Signed distance inside the side in metres. */
function offset(side: ISide, point: IAutoMovieVector3): number {
  return Vector3.dot(side.inward, Vector3.subtract(point, side.a));
}

/** Clip a tangent segment to the convex face without extending a point hold. */
function clipSegment(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  sides: readonly ISide[],
): readonly [IAutoMovieVector3, IAutoMovieVector3] | undefined {
  let from: number = 0;
  let to: number = 1;
  for (const side of sides) {
    const da: number = offset(side, a);
    const db: number = offset(side, b);
    if (da < 0 && db < 0) return undefined;
    if (da < 0) from = Math.max(from, da / (da - db));
    if (db < 0) to = Math.min(to, da / (da - db));
    if (from > to) return undefined;
  }
  return [Vector3.lerp(a, b, from), Vector3.lerp(a, b, to)];
}

/** A sphere's lowest visible witness is over the nearest point of the face. */
function sphere(
  centre: IAutoMovieVector3,
  radius: number,
  sides: readonly ISide[],
): physicalShapeFaceContact.IContact | undefined {
  let squared: number = Infinity;
  let point: IAutoMovieVector3 | undefined;
  for (const { a, b } of sides) {
    const edge: IAutoMovieVector3 = Vector3.subtract(b, a);
    const t: number = Math.max(
      0,
      Math.min(
        1,
        Vector3.dot(Vector3.subtract(centre, a), edge) /
          Vector3.dot(edge, edge),
      ),
    );
    const candidate: IAutoMovieVector3 = Vector3.addScaled(a, edge, t);
    const distance: number =
      (candidate.x - centre.x) ** 2 + (candidate.z - centre.z) ** 2;
    if (distance < squared) {
      squared = distance;
      point = candidate;
    }
  }
  return point === undefined || squared > radius * radius
    ? undefined
    : { point, clearance: centre.y - Math.sqrt(radius * radius - squared) };
}

/** Clip each polygon of the solid to the actual vertical face columns. */
function polytope(
  loops: readonly (readonly IAutoMovieVector3[])[],
  place: (point: IAutoMovieVector3) => IAutoMovieVector3,
  sides: readonly ISide[],
  project: (point: IAutoMovieVector3) => IAutoMovieVector3,
): physicalShapeFaceContact.IContact | undefined {
  let best: IAutoMovieVector3 | undefined;
  const candidates: IAutoMovieVector3[] = [];
  for (const loop of loops) {
    let clipped: IAutoMovieVector3[] = loop.map(place);
    for (const side of sides) {
      const next: IAutoMovieVector3[] = [];
      let previous: IAutoMovieVector3 | undefined = clipped.at(-1);
      if (previous === undefined) break;
      let prior: number = offset(side, project(previous));
      for (const point of clipped) {
        const current: number = offset(side, project(point));
        if ((current < 0 && prior > 0) || (current > 0 && prior < 0))
          next.push(Vector3.lerp(previous, point, prior / (prior - current)));
        if (current >= 0) next.push(point);
        previous = point;
        prior = current;
      }
      clipped = next;
    }
    for (const point of clipped) {
      candidates.push(point);
      if (best === undefined || point.y < best.y) best = point;
    }
  }
  if (best === undefined) return undefined;
  const tolerance: number = 64 * Number.EPSILON * Math.max(1, Math.abs(best.y));
  const patch: IAutoMovieVector3[] = [];
  for (const candidate of candidates)
    if (candidate.y - best.y <= tolerance) {
      const point: IAutoMovieVector3 = project(candidate);
      if (
        !patch.some(
          (other: IAutoMovieVector3): boolean =>
            Vector3.distance(point, other) <= tolerance,
        )
      )
        patch.push(point);
    }
  if (patch.length <= 1) return { point: project(best), clearance: best.y };
  const centre: IAutoMovieVector3 = Vector3.scale(
    patch.reduce(
      (total: IAutoMovieVector3, point: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(total, point),
      { x: 0, y: 0, z: 0 },
    ),
    1 / patch.length,
  );
  return {
    point: centre,
    clearance: best.y,
    patch,
  };
}

/** Six axis-aligned face loops before the box is posed. */
function box(half: IAutoMovieVector3): IAutoMovieVector3[][] {
  const result: IAutoMovieVector3[][] = [];
  for (const [axis, first, second] of [
    ["x", "y", "z"],
    ["y", "z", "x"],
    ["z", "x", "y"],
  ] as const)
    for (const sign of [-1, 1])
      result.push(
        (
          [
            [1, 1],
            [-1, 1],
            [-1, -1],
            [1, -1],
          ] as const
        ).map(([u, v]): IAutoMovieVector3 => {
          const point: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
          point[axis] = sign * half[axis];
          point[first] = u * half[first];
          point[second] = v * half[second];
          return point;
        }),
      );
  return result;
}

/**
 * The real circular face and the opposite cap or tip support a flat-ended
 * solid.
 */
function roundSupport(
  shape: Exclude<physicalShapeFaceContact.Shape, IAutoMoviePhysicalShape>,
  centre: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  direction: IAutoMovieVector3,
): IAutoMovieVector3 {
  const d: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(rotation),
    direction,
  );
  const r: number = Math.hypot(d.x, d.z);
  const half: number = shape.height / 2;
  const p: IAutoMovieVector3 = {
    x: r === 0 ? 0 : (d.x * shape.radius) / r,
    y: d.y >= 0 || shape.kind === "cone" ? half : -half,
    z: r === 0 ? 0 : (d.z * shape.radius) / r,
  };
  if (shape.kind === "cone" && d.y * shape.height + r * shape.radius < 0) {
    p.x = p.z = 0;
    p.y = -half;
  }
  return Vector3.add(centre, Quaternion.rotateVector(rotation, p));
}

/** Bracket the first height at which the two convex solids intersect. */
function roundPrism(
  support: physicalShapeGjk.Support,
  sides: readonly ISide[],
  column: IAutoMovieVector3,
  project: (point: IAutoMovieVector3) => IAutoMovieVector3,
  bottom: number,
  top: number,
): physicalShapeFaceContact.IContact | undefined {
  const tolerance: number =
    64 * Number.EPSILON * Math.max(1, Math.abs(bottom), Math.abs(top));
  const intersects = (
    height: number,
  ): ReturnType<typeof physicalShapeGjk.witness> =>
    physicalShapeGjk.witness(
      support,
      (direction: IAutoMovieVector3): IAutoMovieVector3 => {
        let point: IAutoMovieVector3 = sides[0]!.a;
        let score: number = Vector3.dot(point, direction);
        for (const { a } of sides) {
          const next: number = Vector3.dot(a, direction);
          if (next > score) {
            point = a;
            score = next;
          }
        }
        const y: number =
          Vector3.dot(direction, column) >= 0 ? height : bottom - tolerance;
        return Vector3.addScaled(point, column, y);
      },
      tolerance,
    );
  let lo: number = bottom;
  let hi: number = top;
  let found: ReturnType<typeof intersects> = intersects(hi);
  if (found.distance > tolerance) return undefined;
  for (let i: number = 0; i < 52 && hi - lo > tolerance; ++i) {
    const middle: number = (lo + hi) / 2;
    const next: ReturnType<typeof intersects> = intersects(middle);
    if (next.distance > tolerance) lo = middle;
    else {
      hi = middle;
      found = next;
    }
  }
  return { point: project(found.point), clearance: hi };
}
