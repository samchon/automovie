import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEnginePhysicalHullFaces, AutoMovieEnginePhysicalHull, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMoviePhysicalHullFaces,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalShapeNearest,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../internal/PhysicalTolerance";

/**
 * How far a segment's nearest point may lie from its brute-force one, metres:
 * the segment search's own stopping tolerance.
 */
const SEGMENT_END: number = 1e-8;

/**
 * A point's and a segment's readings against a convex hull are exact: a point's
 * is its signed distance, and a segment's the least of its points' readings,
 * apart, crossing, inside and on the surface.
 *
 * Scenarios:
 *
 * 1. Against a 1 x 0.4 x 0.2 m box hull, a segment 0.3 m off a face and parallel
 *    to it reads 0.3 m, a segment through the centre along the long axis reads
 *    -0.1 m at a point within 0.4 m of the centre, and a segment skew to an
 *    edge reads the 0.5 m to that edge with its normal.
 * 2. Over 60 seeded hulls of 4 to 30 points and 8000 segments drawn apart,
 *    through, inside, from a face point and along a face, the distance matches
 *    a 44-step golden-section search of brute-force point readings with both
 *    ends within 1e-8 m and never exceeds it by more than 1e-12 m, and the
 *    point reading at the returned segment point equals the distance within
 *    1e-12 m; each segment end reads its brute-force signed distance within
 *    1e-12 m, at a surface point that far from it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes a point's signed distance from the least signed distance along a segment, including surface and interior readings.
 * @evidence contracts/development/testing.md#behavioral-verification Reads points and segments over a known box hull and deterministic seeded hulls, then compares against a separately implemented face and edge search.
 * @evidence contracts/development/testing.md#independent-expectations The box distances are 0.3 m, -0.1 m and 0.5 m. A brute-force point oracle with two endpoints and a 44-step golden-section search bounds the seeded segment comparison.
 */
export function test_engine_physics_physical_hull_nearest(): void {
  const still: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: AutoMovieEngineQuaternion.identity(),
  };
  const hullOf = (points: IAutoMovieVector3[]): IAutoMoviePhysicalShape => ({
    id: "hull",
    material: "solid",
    transform: still,
    kind: "hull",
    points,
  });
  const segment = (
    shape: IAutoMoviePhysicalShape,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): IAutoMoviePhysicalShapeNearest.IResult =>
    AutoMovieEnginePhysics.physicalShapeNearest(still, shape, a, b);

  // 1. Hand cases on a box hull.
  const half: IAutoMovieVector3 = { x: 0.5, y: 0.2, z: 0.1 };
  const box: IAutoMoviePhysicalShape = hullOf(
    [-1, 1].flatMap((x: number): IAutoMovieVector3[] =>
      [-1, 1].flatMap((y: number): IAutoMovieVector3[] =>
        [-1, 1].map(
          (z: number): IAutoMovieVector3 => ({
            x: half.x * x,
            y: half.y * y,
            z: half.z * z,
          }),
        ),
      ),
    ),
  );
  const parallel: IAutoMoviePhysicalShapeNearest.IResult = segment(
    box,
    { x: -1, y: 0.5, z: 0 },
    { x: 1, y: 0.5, z: 0 },
  );
  const through: IAutoMoviePhysicalShapeNearest.IResult = segment(
    box,
    { x: -1, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
  );
  const skew: IAutoMoviePhysicalShapeNearest.IResult = segment(
    box,
    { x: 0.8, y: 0.6, z: -1 },
    { x: 0.8, y: 0.6, z: 1 },
  );
  TestValidator.predicate(
    "box hull segments",
    Math.abs(parallel.distance - 0.3) < PhysicalTolerance.ROUNDING &&
      Math.abs(through.distance + 0.1) < PhysicalTolerance.ROUNDING &&
      Math.abs(through.at.x) <= 0.4 + PhysicalTolerance.ROUNDING &&
      Math.abs(skew.distance - 0.5) < PhysicalTolerance.ROUNDING &&
      Math.abs(skew.at.z) < PhysicalTolerance.ACCUMULATED &&
      AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(skew.normal, { x: 0.6, y: 0.8, z: 0 })) <
        PhysicalTolerance.ACCUMULATED,
  );

  // 2. Seeded hulls and segments against the golden-section reading.
  let seed: number = 20261115;
  const random = (): number => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const scatter = (scale: number): IAutoMovieVector3 => ({
    x: scale * (random() - 0.5),
    y: scale * (random() - 0.5),
    z: scale * (random() - 0.5),
  });
  // A point's signed distance by brute force: the greatest plane distance
  // inside, and outside the least distance to any face's polygon.
  const brute = (
    hull: IAutoMoviePhysicalHullFaces.IHull,
    p: IAutoMovieVector3,
  ): number => {
    const planes: number[] = hull.faces.map(
      (face: IAutoMoviePhysicalHullFaces.IFace): number =>
        AutoMovieEngineVector3.dot(face.normal, p) - face.offset,
    );
    const depth: number = Math.max(...planes);
    if (depth <= 0) return depth;
    let least: number = Infinity;
    hull.faces.forEach(
      (face: IAutoMoviePhysicalHullFaces.IFace, f: number): void => {
        const q: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
          p,
          AutoMovieEngineVector3.scale(face.normal, planes[f]!),
        );
        const edges: [IAutoMovieVector3, IAutoMovieVector3][] = face.loop.map(
          (
            from: IAutoMovieVector3,
            i: number,
          ): [IAutoMovieVector3, IAutoMovieVector3] => [
            from,
            face.loop[(i + 1) % face.loop.length]!,
          ],
        );
        const within: boolean = edges.every(
          ([from, to]: [IAutoMovieVector3, IAutoMovieVector3]): boolean =>
            AutoMovieEngineVector3.dot(
              face.normal,
              AutoMovieEngineVector3.cross(
                AutoMovieEngineVector3.subtract(to, from),
                AutoMovieEngineVector3.subtract(q, from),
              ),
            ) >= 0,
        );
        if (within) least = Math.min(least, Math.abs(planes[f]!));
        else
          for (const [from, to] of edges) {
            const e: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(to, from);
            const t: number = Math.min(
              1,
              Math.max(
                0,
                AutoMovieEngineVector3.dot(AutoMovieEngineVector3.subtract(p, from), e) / AutoMovieEngineVector3.dot(e, e),
              ),
            );
            least = Math.min(
              least,
              AutoMovieEngineVector3.length(
                AutoMovieEngineVector3.subtract(p, AutoMovieEngineVector3.add(from, AutoMovieEngineVector3.scale(e, t))),
              ),
            );
          }
      },
    );
    return least;
  };
  const searched = (
    hull: IAutoMoviePhysicalHullFaces.IHull,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): number => {
    const gap = (t: number): number =>
      brute(hull, AutoMovieEngineVector3.add(a, AutoMovieEngineVector3.scale(AutoMovieEngineVector3.subtract(b, a), t)));
    const ratio: number = (Math.sqrt(5) - 1) / 2;
    let lo: number = 0;
    let hi: number = 1;
    let c: number = hi - ratio * (hi - lo);
    let d: number = lo + ratio * (hi - lo);
    let fc: number = gap(c);
    let fd: number = gap(d);
    for (let i: number = 0; i < 44; i++)
      if (fc <= fd) {
        hi = d;
        d = c;
        fd = fc;
        c = hi - ratio * (hi - lo);
        fc = gap(c);
      } else {
        lo = c;
        c = d;
        fc = fd;
        d = lo + ratio * (hi - lo);
        fd = gap(d);
      }
    return Math.min(gap(0), gap(1), fc, fd);
  };
  let apart: number = 0;
  let above: number = 0;
  let read: number = 0;
  let off: number = 0;
  let count: number = 0;
  for (let h: number = 0; h < 60; h++) {
    const scale: number = 0.05 + 0.5 * random();
    const points: IAutoMovieVector3[] = Array.from(
      { length: 4 + (h % 27) },
      (): IAutoMovieVector3 => scatter(scale),
    );
    const hull: IAutoMoviePhysicalHullFaces.IHull = AutoMovieEnginePhysicalHullFaces.build(points);
    if (!hull.faces.length) continue;
    const shape: IAutoMoviePhysicalShape = hullOf(points);
    const inner = (): IAutoMovieVector3 => {
      const vertex: IAutoMovieVector3 =
        hull.vertices[Math.floor(random() * hull.vertices.length)]!;
      return AutoMovieEngineVector3.add(
        hull.centre,
        AutoMovieEngineVector3.scale(AutoMovieEngineVector3.subtract(vertex, hull.centre), random()),
      );
    };
    const onFace = (
      face: IAutoMoviePhysicalHullFaces.IFace,
    ): IAutoMovieVector3 => {
      const weights: number[] = face.loop.map((): number => random());
      const total: number = weights.reduce(
        (s: number, w: number): number => s + w,
        0,
      );
      return face.loop.reduce(
        (
          sum: IAutoMovieVector3,
          p: IAutoMovieVector3,
          i: number,
        ): IAutoMovieVector3 =>
          AutoMovieEngineVector3.add(sum, AutoMovieEngineVector3.scale(p, weights[i]! / total)),
        { x: 0, y: 0, z: 0 },
      );
    };
    for (let k: number = 0; k < 134; k++) {
      const face: IAutoMoviePhysicalHullFaces.IFace =
        hull.faces[Math.floor(random() * hull.faces.length)]!;
      const kind: number = k % 5;
      const [a, b]: [IAutoMovieVector3, IAutoMovieVector3] =
        kind === 0
          ? [scatter(3 * scale), scatter(3 * scale)]
          : kind === 1
            ? [inner(), AutoMovieEngineVector3.add(hull.centre, scatter(4 * scale))]
            : kind === 2
              ? [inner(), inner()]
              : kind === 3
                ? [onFace(face), scatter(3 * scale)]
                : [onFace(face), onFace(face)];
      const reading: IAutoMoviePhysicalShapeNearest.IResult = segment(
        shape,
        a,
        b,
      );
      const reference: number = searched(hull, a, b);
      apart = Math.max(apart, Math.abs(reading.distance - reference));
      above = Math.max(above, reading.distance - reference);
      read = Math.max(
        read,
        Math.abs(
          AutoMovieEnginePhysicalHull.nearest(points, reading.at).distance - reading.distance,
        ),
      );
      for (const p of [a, b]) {
        const near: ReturnType<typeof AutoMovieEnginePhysicalHull.nearest> =
          AutoMovieEnginePhysicalHull.nearest(points, p);
        // The point is on the surface and as far from the query as read.
        const surface: number = Math.max(
          ...hull.faces.map(
            (face: IAutoMoviePhysicalHullFaces.IFace): number =>
              AutoMovieEngineVector3.dot(face.normal, near.point) - face.offset,
          ),
        );
        off = Math.max(
          off,
          Math.abs(near.distance - brute(hull, p)),
          Math.abs(surface),
          Math.abs(
            AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(p, near.point)) -
              Math.abs(near.distance),
          ),
        );
      }
      count++;
    }
  }
  TestValidator.predicate(
    `hull segments match the search (${count} segments, apart ${apart}, above ${above}, read ${read})`,
    count >= 7900 &&
      apart <= SEGMENT_END &&
      above <= PhysicalTolerance.ROUNDING &&
      read <= PhysicalTolerance.ROUNDING,
  );
  TestValidator.predicate(
    `hull points match brute force (${off})`,
    off <= PhysicalTolerance.ROUNDING,
  );
}
