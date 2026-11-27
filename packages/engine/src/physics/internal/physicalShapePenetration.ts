import type {
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { physicalShapeSupport } from "./physicalShapeSupport";

/*
 * How deep two overlapping convex colliders interpenetrate: the shortest
 * translation that separates them, its unit direction from the first toward the
 * second and each one's deepest point, by the Expanding Polytope Algorithm (van
 * den Bergen 2003, "Collision Detection in Interactive 3D Environments",
 * section 4.3.8) on the Minkowski difference `A - B`, seeded by GJK's
 * intersection simplex (Gilbert, Johnson and Keerthi 1988).
 *
 * GJK walks simplices of `A - B` toward the origin until a tetrahedron encloses
 * it; EPA then grows that polytope by the support point beyond its face nearest
 * the origin until the support no longer passes the face by more than the
 * tolerance. The nearest face's distance is the depth, its outward normal the
 * direction, and the origin's barycentric coordinates on it weight the two
 * shapes' support points into their witnesses. Null when GJK finds the shapes
 * apart or merely touching, where no tetrahedron encloses the origin.
 * Parameter poseA: The first shape's parent pose, world metres.
 * Parameter shapeA: The first shape.
 * Parameter poseB: The second shape's parent pose, world metres.
 * Parameter shapeB: The second shape.
 * Returns: The penetration, or null when the shapes do not overlap.
 */
export function physicalShapePenetration(
  poseA: IAutoMovieRigidTransform,
  shapeA: IAutoMoviePhysicalShape,
  poseB: IAutoMovieRigidTransform,
  shapeB: IAutoMoviePhysicalShape,
): physicalShapePenetration.IResult | null {
  const support: (d: IAutoMovieVector3) => IVertex = (
    d: IAutoMovieVector3,
  ): IVertex => {
    const a: IAutoMovieVector3 = physicalShapeSupport(poseA, shapeA, d);
    const b: IAutoMovieVector3 = physicalShapeSupport(
      poseB,
      shapeB,
      AutoMovieEngineVector3.scale(d, -1),
    );
    return { p: AutoMovieEngineVector3.subtract(a, b), a, b };
  };
  const simplex: IVertex[] | null = enclose(support);
  if (simplex === null) return null;
  const scale: number = Math.max(
    1,
    ...simplex.map((v: IVertex): number => AutoMovieEngineVector3.length(v.p)),
  );
  const tolerance: number = 1e-10 * scale;

  // The tetrahedron's faces, each wound outward from the origin.
  const vertices: IVertex[] = [...simplex];
  let faces: IFace[] = [
    [0, 1, 2],
    [0, 3, 1],
    [0, 2, 3],
    [1, 3, 2],
  ]
    .map((t: number[]): IFace | null => face(vertices, t[0]!, t[1]!, t[2]!))
    .flatMap((f: IFace | null): IFace[] => (f === null ? [] : [f]));
  let nearest: IFace | null = null;
  for (
    let iteration: number = 0;
    iteration < 128 && faces.length > 0;
    iteration++
  ) {
    nearest = faces.reduce(
      (best: IFace, f: IFace): IFace => (f.distance < best.distance ? f : best),
    );
    const v: IVertex = support(nearest.normal);
    if (AutoMovieEngineVector3.dot(v.p, nearest.normal) - nearest.distance < tolerance) break;
    const index: number = vertices.push(v) - 1;
    const visible: IFace[] = faces.filter(
      (f: IFace): boolean =>
        AutoMovieEngineVector3.dot(f.normal, AutoMovieEngineVector3.subtract(v.p, vertices[f.a]!.p)) > 0,
    );
    const edges: [number, number][] = [];
    for (const f of visible)
      for (const [i, j] of [
        [f.a, f.b],
        [f.b, f.c],
        [f.c, f.a],
      ] as const) {
        const twin: number = edges.findIndex(
          ([p, q]: [number, number]): boolean => p === j && q === i,
        );
        if (twin >= 0) edges.splice(twin, 1);
        else edges.push([i, j]);
      }
    faces = faces.filter((f: IFace): boolean => !visible.includes(f));
    for (const [i, j] of edges) {
      const added: IFace | null = face(vertices, i, j, index);
      if (added !== null) faces.push(added);
    }
  }
  if (nearest === null) return null;

  // The origin's projection on the nearest face, in barycentric weights.
  const p: IAutoMovieVector3 = AutoMovieEngineVector3.scale(nearest.normal, nearest.distance);
  const [u, v, w]: [number, number, number] = barycentric(
    p,
    vertices[nearest.a]!.p,
    vertices[nearest.b]!.p,
    vertices[nearest.c]!.p,
  );
  const [first, second, third]: IVertex[] = [
    vertices[nearest.a]!,
    vertices[nearest.b]!,
    vertices[nearest.c]!,
  ];
  return {
    depth: nearest.distance,
    normal: nearest.normal,
    pointA: weigh(first!.a, second!.a, third!.a, u, v, w),
    pointB: weigh(first!.b, second!.b, third!.b, u, v, w),
  };
}

/*
 * Companion types of physicalShapePenetration.
 */
export namespace physicalShapePenetration {
  /*
   * A penetration between two convex colliders, world metres.
   */
  export interface IResult {
    /*
     * The shortest separating translation's length, metres.
     */
    depth: number;

    /*
     * Its unit direction, from the first shape toward the second.
     */
    normal: IAutoMovieVector3;

    /*
     * The first shape's deepest point.
     */
    pointA: IAutoMovieVector3;

    /*
     * The second shape's deepest point.
     */
    pointB: IAutoMovieVector3;
  }
}

/*
 * A vertex of the Minkowski difference with the support points it came from.
 */
interface IVertex {
  /*
   * The difference point, `a - b`.
   */
  p: IAutoMovieVector3;

  /*
   * The first shape's support point.
   */
  a: IAutoMovieVector3;

  /*
   * The second shape's support point.
   */
  b: IAutoMovieVector3;
}

/*
 * An EPA face: vertex indices wound outward, its unit normal and its distance
 * from the origin.
 */
interface IFace {
  /*
   * First vertex.
   */
  a: number;

  /*
   * Second vertex.
   */
  b: number;

  /*
   * Third vertex.
   */
  c: number;

  /*
   * Outward unit normal.
   */
  normal: IAutoMovieVector3;

  /*
   * Distance from the origin along the normal, metres.
   */
  distance: number;
}

/*
 * A face on three vertices, wound outward from the origin; null when
 * degenerate.
 */
function face(
  vertices: readonly IVertex[],
  a: number,
  b: number,
  c: number,
): IFace | null {
  const pa: IAutoMovieVector3 = vertices[a]!.p;
  let n: IAutoMovieVector3 = AutoMovieEngineVector3.cross(
    AutoMovieEngineVector3.subtract(vertices[b]!.p, pa),
    AutoMovieEngineVector3.subtract(vertices[c]!.p, pa),
  );
  const length: number = AutoMovieEngineVector3.length(n);
  if (!(length > 0)) return null;
  n = { x: n.x / length, y: n.y / length, z: n.z / length };
  const distance: number = AutoMovieEngineVector3.dot(n, pa);
  return distance >= 0
    ? { a, b, c, normal: n, distance }
    : { a, b: c, c: b, normal: AutoMovieEngineVector3.scale(n, -1), distance: -distance };
}

/*
 * GJK's intersection test: a tetrahedron of the difference enclosing the
 * origin, or null.
 */
function enclose(support: (d: IAutoMovieVector3) => IVertex): IVertex[] | null {
  let d: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  let simplex: IVertex[] = [support(d)];
  d = AutoMovieEngineVector3.scale(simplex[0]!.p, -1);
  for (let iteration: number = 0; iteration < 64; iteration++) {
    if (!(AutoMovieEngineVector3.length(d) > 0)) return null;
    const v: IVertex = support(d);
    if (!(AutoMovieEngineVector3.dot(v.p, d) > 0)) return null;
    simplex = [...simplex, v];
    const next: IStep = step(simplex);
    if (next.enclosed) return simplex;
    simplex = next.simplex;
    d = next.direction;
  }
  return null;
}

/*
 * One GJK simplex reduction: the sub-simplex nearest the origin and the next
 * search direction.
 */
interface IStep {
  /*
   * Whether the tetrahedron encloses the origin.
   */
  enclosed: boolean;

  /*
   * The kept simplex, newest vertex last.
   */
  simplex: IVertex[];

  /*
   * The next search direction.
   */
  direction: IAutoMovieVector3;
}

/*
 * Reduce a simplex, newest vertex last, toward the origin (Ericson 2005,
 * section 9.5).
 */
function step(simplex: IVertex[]): IStep {
  const triple: (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    c: IAutoMovieVector3,
  ) => IAutoMovieVector3 = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    c: IAutoMovieVector3,
  ): IAutoMovieVector3 => AutoMovieEngineVector3.cross(AutoMovieEngineVector3.cross(a, b), c);
  const line: (b: IVertex, a: IVertex) => IStep = (
    b: IVertex,
    a: IVertex,
  ): IStep => {
    const ab: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(b.p, a.p);
    const ao: IAutoMovieVector3 = AutoMovieEngineVector3.scale(a.p, -1);
    if (!(AutoMovieEngineVector3.dot(ab, ao) > 0))
      return { enclosed: false, simplex: [a], direction: ao };
    // The origin on the segment's line leaves no normal toward it: any
    // direction perpendicular to the segment completes the simplex.
    const toward: IAutoMovieVector3 = triple(ab, ao, ab);
    return {
      enclosed: false,
      simplex: [b, a],
      direction: AutoMovieEngineVector3.length(toward) > 0 ? toward : perpendicular(ab),
    };
  };
  const triangle: (c: IVertex, b: IVertex, a: IVertex) => IStep = (
    c: IVertex,
    b: IVertex,
    a: IVertex,
  ): IStep => {
    const ab: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(b.p, a.p);
    const ac: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(c.p, a.p);
    const ao: IAutoMovieVector3 = AutoMovieEngineVector3.scale(a.p, -1);
    const abc: IAutoMovieVector3 = AutoMovieEngineVector3.cross(ab, ac);
    if (AutoMovieEngineVector3.dot(AutoMovieEngineVector3.cross(abc, ac), ao) > 0)
      return AutoMovieEngineVector3.dot(ac, ao) > 0
        ? { enclosed: false, simplex: [c, a], direction: triple(ac, ao, ac) }
        : line(b, a);
    if (AutoMovieEngineVector3.dot(AutoMovieEngineVector3.cross(ab, abc), ao) > 0) return line(b, a);
    return AutoMovieEngineVector3.dot(abc, ao) > 0
      ? { enclosed: false, simplex: [c, b, a], direction: abc }
      : {
          enclosed: false,
          simplex: [b, c, a],
          direction: AutoMovieEngineVector3.scale(abc, -1),
        };
  };
  if (simplex.length === 2) return line(simplex[0]!, simplex[1]!);
  if (simplex.length === 3)
    return triangle(simplex[0]!, simplex[1]!, simplex[2]!);
  const [d, c, b, a]: IVertex[] = simplex;
  const ao: IAutoMovieVector3 = AutoMovieEngineVector3.scale(a!.p, -1);
  const ab: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(b!.p, a!.p);
  const ac: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(c!.p, a!.p);
  const ad: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(d!.p, a!.p);
  const outward: (
    n: IAutoMovieVector3,
    other: IAutoMovieVector3,
  ) => IAutoMovieVector3 = (
    n: IAutoMovieVector3,
    other: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    AutoMovieEngineVector3.dot(n, other) > 0 ? AutoMovieEngineVector3.scale(n, -1) : n;
  if (AutoMovieEngineVector3.dot(outward(AutoMovieEngineVector3.cross(ab, ac), ad), ao) > 0)
    return triangle(c!, b!, a!);
  if (AutoMovieEngineVector3.dot(outward(AutoMovieEngineVector3.cross(ac, ad), ab), ao) > 0)
    return triangle(d!, c!, a!);
  if (AutoMovieEngineVector3.dot(outward(AutoMovieEngineVector3.cross(ad, ab), ac), ao) > 0)
    return triangle(b!, d!, a!);
  return { enclosed: true, simplex, direction: { x: 0, y: 0, z: 0 } };
}

/*
 * A direction perpendicular to a nonzero vector.
 */
function perpendicular(v: IAutoMovieVector3): IAutoMovieVector3 {
  const seed: IAutoMovieVector3 =
    Math.abs(v.x) <= Math.abs(v.y) && Math.abs(v.x) <= Math.abs(v.z)
      ? { x: 1, y: 0, z: 0 }
      : Math.abs(v.y) <= Math.abs(v.z)
        ? { x: 0, y: 1, z: 0 }
        : { x: 0, y: 0, z: 1 };
  return AutoMovieEngineVector3.cross(v, seed);
}

/*
 * A barycentric combination of three points.
 */
function weigh(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  c: IAutoMovieVector3,
  u: number,
  v: number,
  w: number,
): IAutoMovieVector3 {
  return AutoMovieEngineVector3.add(
    AutoMovieEngineVector3.add(AutoMovieEngineVector3.scale(a, u), AutoMovieEngineVector3.scale(b, v)),
    AutoMovieEngineVector3.scale(c, w),
  );
}

/*
 * Barycentric weights of a point on the plane of a triangle (Ericson 2005,
 * section 3.4).
 */
function barycentric(
  p: IAutoMovieVector3,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  c: IAutoMovieVector3,
): [number, number, number] {
  const v0: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(b, a);
  const v1: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(c, a);
  const v2: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(p, a);
  const d00: number = AutoMovieEngineVector3.dot(v0, v0);
  const d01: number = AutoMovieEngineVector3.dot(v0, v1);
  const d11: number = AutoMovieEngineVector3.dot(v1, v1);
  const d20: number = AutoMovieEngineVector3.dot(v2, v0);
  const d21: number = AutoMovieEngineVector3.dot(v2, v1);
  const denominator: number = d00 * d11 - d01 * d01;
  if (!(Math.abs(denominator) > 0)) return [1, 0, 0];
  const v: number = (d11 * d20 - d01 * d21) / denominator;
  const w: number = (d00 * d21 - d01 * d20) / denominator;
  return [1 - v - w, v, w];
}
