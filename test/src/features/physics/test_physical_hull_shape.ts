import {
  Quaternion,
  Vector3,
  physicalHullErode,
  physicalHullFaces,
  physicalHullMass,
  physicalShapeBounds,
  physicalShapeNearest,
  physicalShapePairDistance,
  physicalShapeSpan,
} from "@automovie/engine";
import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

/**
 * A convex hull shape is read like the other shape kinds: its faces, mass,
 * nearest point, bounds, span, erosion and distance to another shape agree
 * with closed forms.
 *
 * Scenarios:
 * 1. A box's eight corners with one point on a face and one point inside
 *    give six faces and eight vertices, the inside point reported buried by
 *    its depth of 0.1 m, the centre at the origin, the corner radius and the
 *    0.1 m inscribed depth.
 * 2. The same box moved to (1, 2, 3) has volume 0.08 m3, its centroid there
 *    and the principal moments per unit mass of a 1 x 0.4 x 0.2 m cuboid
 *    about the box's own axes; the unit tetrahedron has volume 1/6 and
 *    centroid (1/4, 1/4, 1/4).
 * 3. A point 0.3 m off a face, a point 0.07 m inside and a point off a corner
 *    read the hand distance, surface point and normal, with the hull turned a
 *    quarter turn by its pose; over 200 fixed segments the hull and the box
 *    of the same corners read the same distance under two composed turns.
 * 4. The hull's world bounds equal the box's, and the span of each kind
 *    along an axis and a diagonal is the hand value.
 * 5. Eroding the box by 0.05 m leaves the box 0.05 m smaller on every side;
 *    eroding it by its whole inscribed depth is refused.
 * 6. Shape pairs read their hand distance in either order: two spheres,
 *    two overlapping capsules, two cubes face to face, and two cubes turned
 *    so that a pair of skew edges are their nearest features, as boxes and
 *    as hulls.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public hull owners and the shape queries and reads their results; a missing face, a wrong moment, a wrong contact point or normal, a loose bound or a pair distance read from vertices only fails.
 * @evidence contracts/development/testing.md#independent-expectations Face and vertex counts, the cuboid and tetrahedron mass properties, the point distances, the spans and the pair distances are closed forms written here; the 200 segments compare two separately written branches of the query, the box's clamp and the hull's planes.
 * @evidence contracts/development/testing.md#distinguishing-cases Surface and buried extra points, a moved box and a tetrahedron, outside, inside and corner points, composed turns, all four kinds for the span, an erosion that leaves a volume and one that does not, and a skew edge pair whose nearest vertices are 0.5 m off the true nearest points.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 scenarios and what each pins.
 */
export function test_physical_hull_shape(): void {
  const still: P.ITransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: Quaternion.identity(),
  };
  const half: IAutoMovieVector3 = { x: 0.5, y: 0.2, z: 0.1 };
  const corners = (h: IAutoMovieVector3): IAutoMovieVector3[] =>
    [-1, 1].flatMap((x: number): IAutoMovieVector3[] =>
      [-1, 1].flatMap((y: number): IAutoMovieVector3[] =>
        [-1, 1].map(
          (z: number): IAutoMovieVector3 => ({
            x: h.x * x,
            y: h.y * y,
            z: h.z * z,
          }),
        ),
      ),
    );
  const close = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    e: number = 1e-9,
  ): boolean => Vector3.length(Vector3.subtract(a, b)) <= e;
  const hullOf = (
    points: IAutoMovieVector3[],
    transform: P.ITransform = still,
  ): P.IShape => ({
    id: "hull",
    material: "solid",
    transform,
    kind: "hull",
    points,
  });
  const boxOf = (
    h: IAutoMovieVector3,
    transform: P.ITransform = still,
  ): P.IShape => ({
    id: "box",
    material: "solid",
    transform,
    kind: "box",
    halfExtents: h,
  });

  // 1. Faces, vertices and the buried point.
  const faces: physicalHullFaces.IHull = physicalHullFaces([
    ...corners(half),
    { x: 0.5, y: 0, z: 0 },
    { x: 0.1, y: 0, z: 0 },
  ]);
  TestValidator.predicate(
    "box hull faces",
    faces.faces.length === 6 &&
      faces.vertices.length === 8 &&
      faces.faces.every(
        (face: physicalHullFaces.IFace): boolean => face.loop.length === 4,
      ) &&
      Math.abs(faces.buried - 0.1) < 1e-12 &&
      close(faces.centre, { x: 0, y: 0, z: 0 }, 1e-12) &&
      Math.abs(faces.radius - Math.sqrt(0.3)) < 1e-12 &&
      Math.abs(faces.depth - 0.1) < 1e-12 &&
      physicalHullFaces(corners(half)).buried <= faces.tolerance,
  );

  // 2. Mass properties.
  const moved: IAutoMovieVector3[] = corners(half).map(
    (p: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(p, { x: 1, y: 2, z: 3 }),
  );
  const mass: ReturnType<typeof physicalHullMass> = physicalHullMass(moved);
  const axes: IAutoMovieVector3[] = [
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
  ];
  TestValidator.predicate(
    "cuboid mass properties",
    Math.abs(mass.volume - 0.08) < 1e-12 &&
      close(mass.centerOfMass, { x: 1, y: 2, z: 3 }, 1e-12) &&
      Math.abs(mass.inertia.x - (0.16 + 0.04) / 12) < 1e-12 &&
      Math.abs(mass.inertia.y - (1 + 0.04) / 12) < 1e-12 &&
      Math.abs(mass.inertia.z - (1 + 0.16) / 12) < 1e-12 &&
      axes.every(
        (axis: IAutoMovieVector3): boolean =>
          Math.abs(
            Math.abs(
              Vector3.dot(
                Quaternion.rotateVector(mass.inertiaRotation, axis),
                axis,
              ),
            ) - 1,
          ) < 1e-9,
      ),
  );
  const tetrahedron: ReturnType<typeof physicalHullMass> = physicalHullMass([
    { x: 0, y: 0, z: 0 },
    ...axes,
  ]);
  TestValidator.predicate(
    "tetrahedron volume and centroid",
    Math.abs(tetrahedron.volume - 1 / 6) < 1e-12 &&
      close(tetrahedron.centerOfMass, { x: 0.25, y: 0.25, z: 0.25 }, 1e-12),
  );

  // 3. Nearest point, normal and distance. A quarter turn about Y carries the
  // hull's local X to world -Z and its local Z to world +X.
  const quarter: P.ITransform = {
    position: { x: 0, y: 0, z: 3 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
  };
  const hull: P.IShape = hullOf(corners(half));
  const point = (
    pose: P.ITransform,
    p: IAutoMovieVector3,
  ): physicalShapeNearest.IResult => physicalShapeNearest(pose, hull, p, p);
  const off: physicalShapeNearest.IResult = point(quarter, {
    x: 0,
    y: 0,
    z: 3.8,
  });
  const within: physicalShapeNearest.IResult = point(quarter, {
    x: 0.03,
    y: 0,
    z: 3.3,
  });
  const corner: physicalShapeNearest.IResult = point(still, {
    x: 0.8,
    y: 0.6,
    z: 0.4,
  });
  TestValidator.predicate(
    "hull nearest readings",
    Math.abs(off.distance - 0.3) < 1e-9 &&
      close(off.point, { x: 0, y: 0, z: 3.5 }) &&
      close(off.normal, { x: 0, y: 0, z: 1 }) &&
      Math.abs(within.distance + 0.07) < 1e-9 &&
      close(within.point, { x: 0.1, y: 0, z: 3.3 }) &&
      close(within.normal, { x: 1, y: 0, z: 0 }) &&
      Math.abs(corner.distance - Math.sqrt(0.34)) < 1e-9 &&
      close(corner.point, half) &&
      close(
        corner.normal,
        Vector3.scale({ x: 0.3, y: 0.4, z: 0.3 }, 1 / Math.sqrt(0.34)),
      ),
  );
  const pose: P.ITransform = {
    position: { x: 1, y: 2, z: 3 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 55),
  };
  const transform: P.ITransform = {
    position: { x: 0.1, y: -0.2, z: 0.3 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 35),
  };
  const turnedHull: P.IShape = hullOf(corners(half), transform);
  const turnedBox: P.IShape = boxOf(half, transform);
  let seed: number = 12345;
  const random = (): number => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const around = (): IAutoMovieVector3 => ({
    x: 1 + 2 * (random() - 0.5),
    y: 2 + 2 * (random() - 0.5),
    z: 3 + 2 * (random() - 0.5),
  });
  let worst: number = 0;
  for (let i: number = 0; i < 200; i++) {
    const a: IAutoMovieVector3 = around();
    const b: IAutoMovieVector3 = around();
    worst = Math.max(
      worst,
      Math.abs(
        physicalShapeNearest(pose, turnedHull, a, b).distance -
          physicalShapeNearest(pose, turnedBox, a, b).distance,
      ),
    );
  }
  TestValidator.predicate(
    `hull segments match the box (${worst})`,
    worst < 1e-7,
  );

  // 4. Bounds and spans.
  const hullBounds: ReturnType<typeof physicalShapeBounds> =
    physicalShapeBounds(pose, turnedHull);
  const boxBounds: ReturnType<typeof physicalShapeBounds> = physicalShapeBounds(
    pose,
    turnedBox,
  );
  const diagonal: IAutoMovieVector3 = {
    x: Math.SQRT1_2,
    y: Math.SQRT1_2,
    z: 0,
  };
  const spans = (
    shape: P.IShape,
    axis: IAutoMovieVector3,
    low: number,
    high: number,
  ): boolean => {
    const [lo, hi]: readonly [number, number] = physicalShapeSpan(
      still,
      shape,
      axis,
    );
    return Math.abs(lo - low) < 1e-12 && Math.abs(hi - high) < 1e-12;
  };
  const along: number = 0.7 * Math.SQRT1_2;
  TestValidator.predicate(
    "bounds and spans",
    close(hullBounds.min, boxBounds.min, 1e-12) &&
      close(hullBounds.max, boxBounds.max, 1e-12) &&
      spans(hull, axes[0]!, -0.5, 0.5) &&
      spans(hull, diagonal, -along, along) &&
      spans(boxOf(half), diagonal, -along, along) &&
      spans(
        {
          id: "capsule",
          material: "solid",
          transform: still,
          kind: "capsule",
          radius: 0.1,
          halfLength: 0.3,
        },
        axes[1]!,
        -0.4,
        0.4,
      ) &&
      spans(
        {
          id: "capsule",
          material: "solid",
          transform: still,
          kind: "capsule",
          radius: 0.1,
          halfLength: 0.3,
        },
        axes[0]!,
        -0.1,
        0.1,
      ) &&
      spans(
        {
          id: "sphere",
          material: "solid",
          transform: {
            position: { x: 2, y: 0, z: 0 },
            rotation: still.rotation,
          },
          kind: "sphere",
          radius: 0.2,
        },
        axes[0]!,
        1.8,
        2.2,
      ),
  );

  // 5. Erosion.
  const eroded: P.IShape = hullOf(physicalHullErode(corners(half), 0.05));
  const erodedBounds: ReturnType<typeof physicalShapeBounds> =
    physicalShapeBounds(still, eroded);
  TestValidator.predicate(
    "eroded box",
    physicalHullFaces(physicalHullErode(corners(half), 0.05)).vertices
      .length === 8 &&
      close(erodedBounds.max, { x: 0.45, y: 0.15, z: 0.05 }, 1e-12) &&
      close(erodedBounds.min, { x: -0.45, y: -0.15, z: -0.05 }, 1e-12),
  );
  assert.throws(
    (): IAutoMovieVector3[] => physicalHullErode(corners(half), 0.1),
    /volume/i,
  );

  // 6. Shape pairs.
  const at = (
    x: number,
    degrees: number,
    axis: IAutoMovieVector3,
  ): P.ITransform => ({
    position: { x, y: 0, z: 0 },
    rotation: Quaternion.fromAxisAngle(axis, degrees),
  });
  const cube: IAutoMovieVector3 = { x: 0.5, y: 0.5, z: 0.5 };
  const pair = (
    poseA: P.ITransform,
    a: P.IShape,
    poseB: P.ITransform,
    b: P.IShape,
    expected: number,
  ): boolean =>
    Math.abs(physicalShapePairDistance(poseA, a, poseB, b) - expected) < 1e-7 &&
    Math.abs(physicalShapePairDistance(poseB, b, poseA, a) - expected) < 1e-7;
  const ball = (radius: number): P.IShape => ({
    id: "sphere",
    material: "solid",
    transform: still,
    kind: "sphere",
    radius,
  });
  const rod: P.IShape = {
    id: "capsule",
    material: "solid",
    transform: still,
    kind: "capsule",
    radius: 0.1,
    halfLength: 0.3,
  };
  // Cube A turned 45 degrees about Y shows the edge along Y at x = 0.5 sqrt 2;
  // cube B at x = 3 turned 45 degrees about Z shows the edge along Z at
  // x = 3 - 0.5 sqrt 2. The two edges are skew and nearest at their middles.
  const skew: number = 3 - Math.SQRT2;
  const turnedY: P.ITransform = at(0, 45, axes[1]!);
  const turnedZ: P.ITransform = at(3, 45, axes[2]!);
  TestValidator.predicate(
    "shape pair distances",
    pair(still, ball(0.2), at(1, 0, axes[0]!), ball(0.3), 0.5) &&
      pair(still, rod, at(0.15, 0, axes[0]!), rod, -0.05) &&
      pair(still, boxOf(cube), at(2, 0, axes[0]!), boxOf(cube), 1) &&
      pair(still, hullOf(corners(cube)), at(2, 0, axes[0]!), boxOf(cube), 1) &&
      pair(turnedY, boxOf(cube), turnedZ, boxOf(cube), skew) &&
      pair(turnedY, hullOf(corners(cube)), turnedZ, boxOf(cube), skew) &&
      pair(
        turnedY,
        hullOf(corners(cube)),
        turnedZ,
        hullOf(corners(cube)),
        skew,
      ),
  );
}
