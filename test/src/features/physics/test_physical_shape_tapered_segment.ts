import { Quaternion, physicalShapeNearest } from "@automovie/engine";
import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A tapered segment, a segment widened by a radius that runs linearly from
 * one end to the other, reads its signed distance to every shape kind as the
 * least over its points of the point's distance less the radius there.
 *
 * The geometry is plain and solved by hand. The segment runs along x from
 * x = -0.5 to 0.5 at height `h` above the origin, its radius falling from
 * `r0` at its first end to `r1` at its other, so the radius changes by `k =
 * r1 - r0` per metre. For a point at the origin, `s = 0.5` along the axis and
 * `h` from it, the least of `sqrt((s - u)^2 + h^2) - r0 - k u` over the axis
 * is `h sqrt(1 - k^2) - r0 - k s`, at `u = s + k h / sqrt(1 - k^2)` while
 * that lies on the axis.
 *
 * Scenarios:
 * 1. Against a sphere of radius 0.05 m at the origin, with `h = 0.3`, `r0 =
 *    0.1` and `r1 = 0`: `0.3 sqrt(0.99) - 0.1 + 0.05 - 0.05 = 0.19849...` m,
 *    to 1e-9, where the bare segment reads 0.25 m; the reported segment point
 *    is the closed form's `u`, to 1e-6.
 * 2. A capsule along z through the origin reads the sphere's value, since
 *    the segment lies in its circular section. A box and a hull of the same
 *    0.05 m half extents are nearest along their top face's edge at x =
 *    -0.05, where the radius is largest: the same closed form about that
 *    edge, `s = 0.45` and `h - 0.05` from it.
 * 3. A taper of one radius on both ends reads the bare distance less that
 *    radius on every kind, to 1e-9.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public proximity owner and reads its distance and segment point; a taper read at one end, a radius not subtracted or a search that misses the convex minimum fails.
 * @evidence contracts/development/testing.md#independent-expectations Every value is the closed form of this axis-aligned geometry, written here.
 * @evidence contracts/development/testing.md#distinguishing-cases A falling taper against all four shape kinds and a constant taper against the bare reading.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 scenarios and what each pins.
 */
export function test_physical_shape_tapered_segment(): void {
  const still: P.ITransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: Quaternion.identity(),
  };
  const half: number = 0.05;
  const shapes: Record<string, P.IShape> = {
    sphere: {
      id: "sphere",
      material: "solid",
      transform: still,
      kind: "sphere",
      radius: half,
    },
    capsule: {
      id: "capsule",
      material: "solid",
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
      },
      kind: "capsule",
      radius: half,
      halfLength: 0.2,
    },
    box: {
      id: "box",
      material: "solid",
      transform: still,
      kind: "box",
      halfExtents: { x: half, y: half, z: half },
    },
    hull: {
      id: "hull",
      material: "solid",
      transform: still,
      kind: "hull",
      points: [-1, 1].flatMap((x: number): IAutoMovieVector3[] =>
        [-1, 1].flatMap((y: number): IAutoMovieVector3[] =>
          [-1, 1].map(
            (z: number): IAutoMovieVector3 => ({
              x: half * x,
              y: half * y,
              z: half * z,
            }),
          ),
        ),
      ),
    },
  };
  const h: number = 0.3;
  const a: IAutoMovieVector3 = { x: -0.5, y: h, z: 0 };
  const b: IAutoMovieVector3 = { x: 0.5, y: h, z: 0 };
  const r0: number = 0.1;
  const r1: number = 0;
  const k: number = r1 - r0;
  const close = (x: number, y: number): boolean => Math.abs(x - y) <= 1e-9;

  // 1-2. The round shapes read the closed form about the origin, the flat
  // ones about their top face's edge nearer the wide end.
  const round: number = h * Math.sqrt(1 - k * k) - r0 - k * 0.5 - half;
  const flat: number =
    (h - half) * Math.sqrt(1 - k * k) - r0 - k * (0.5 - half);
  const at: number = 0.5 + (k * h) / Math.sqrt(1 - k * k);
  for (const [name, shape] of Object.entries(shapes)) {
    const read: physicalShapeNearest.IResult = physicalShapeNearest(
      still,
      shape,
      a,
      b,
      [r0, r1],
    );
    const expected: number =
      name === "sphere" || name === "capsule" ? round : flat;
    TestValidator.predicate(
      `${name}: a falling taper reads ${expected} m (${read.distance})`,
      close(read.distance, expected),
    );
    if (name === "sphere")
      TestValidator.predicate(
        `sphere: the nearest segment point is the closed form's (${read.at.x})`,
        Math.abs(read.at.x - (a.x + at)) <= 1e-6,
      );
  }

  // 3. One radius on both ends is the bare segment less that radius.
  for (const [name, shape] of Object.entries(shapes)) {
    const bare: number = physicalShapeNearest(still, shape, a, b).distance;
    const widened: number = physicalShapeNearest(
      still,
      shape,
      a,
      b,
      [0.04, 0.04],
    ).distance;
    TestValidator.predicate(
      `${name}: a constant taper is the bare distance less it (${bare}, ${widened})`,
      close(widened, bare - 0.04),
    );
  }
}
