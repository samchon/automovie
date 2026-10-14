import { projectileSphereHit, segmentSphere } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";

const v: (x: number, y: number, z: number) => IAutoMovieVector3 = (
  x: number,
  y: number,
  z: number,
): IAutoMovieVector3 => ({ x, y, z });

/**
 * `segmentSphere` + `projectileSphereHit`: the collision tests behind a hit.
 *
 * Scenarios:
 *
 * 1. Normal entry: segment (0,0,0)→(10,0,0) crosses a sphere at (5,0,0) r=1 →
 *    first contact at x=4, parameter s=0.4.
 * 2. Clean miss → null.
 * 3. Degenerate segment (a==b) inside the sphere → 0; outside → null.
 * 4. Start point already inside the sphere → 0.
 * 5. The line hits the sphere but only beyond the segment's end → null.
 *
 * `projectileSphereHit`:
 *
 * 6. An arc launched at (0,0,0) with velocity (10,5,0) under g=(0,−10,0) passes
 *    through (10,0,0) at t=1; a unit sphere there is hit at ≈t=1.
 * 7. A sphere far off the path is never hit → null.
 *
 * @evidence contracts/testing.md#behavioral-verification Computes segment entry parameters and sampled projectile contact, asserting first contact, misses, inside/degenerate behavior and a hit on the sphere; returning an unbounded line intersection or the sphere center fails.
 * @evidence contracts/testing.md#independent-expectations Authored axis geometry gives entry 0.4 and inside parameter 0; the parabola reaches the sphere center at one second, so entry must precede it and lie near the surface. The loose contact window does not prove an exact continuous-curve root or every numeric branch.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts crossing, parallel miss, degenerate inside/outside, inside start, beyond-end line intersection and projectile hit/miss; malformed radius/vector/timing admission belongs to neighboring units.
 * @evidence contracts/testing.md#execution-ownership The named exported unit calls portable collision functions directly and owns all assertions; no physics host, renderer or dynamic case is started.
 */
export function test_physics_collision(): void {
  // 1. normal entry
  TestValidator.predicate(
    "segment enters sphere at s=0.4",
    nclose(segmentSphere(v(0, 0, 0), v(10, 0, 0), v(5, 0, 0), 1)!, 0.4),
  );
  // 2. miss
  TestValidator.equals(
    "parallel miss → null",
    segmentSphere(v(0, 0, 0), v(10, 0, 0), v(5, 5, 0), 1),
    null,
  );
  // 3. degenerate segment
  TestValidator.predicate(
    "point inside → 0",
    nclose(segmentSphere(v(0, 0, 0), v(0, 0, 0), v(0, 0, 0), 1)!, 0, 0),
  );
  TestValidator.equals(
    "point outside → null",
    segmentSphere(v(5, 0, 0), v(5, 0, 0), v(0, 0, 0), 1),
    null,
  );
  // 4. start already inside
  TestValidator.predicate(
    "start inside → 0",
    nclose(segmentSphere(v(5, 0, 0), v(10, 0, 0), v(5, 0, 0), 1)!, 0, 0),
  );
  // 5. intersection beyond the segment end → null
  TestValidator.equals(
    "hit lies past the segment → null",
    segmentSphere(v(0, 0, 0), v(1, 0, 0), v(5, 0, 0), 1),
    null,
  );

  // 6. projectile arcs into a sphere
  const hit: ReturnType<typeof projectileSphereHit> = projectileSphereHit(
    { origin: v(0, 0, 0), velocity: v(10, 5, 0), gravity: v(0, -10, 0) },
    { center: v(10, 0, 0), radius: 1 },
    2,
  );
  TestValidator.predicate("projectile hit detected", hit !== null);
  // the path reaches the centre at t=1, so it ENTERS the r=1 sphere a touch
  // earlier (~0.9s): contact is the surface crossing, not the centre crossing
  TestValidator.equals(
    "hit time just before the centre crossing",
    namedFacts([
      ["hitTime", (): boolean => hit!.time > 0.8],
      ["hitTime2", (): boolean => hit!.time > 0.8 && hit!.time <= 1.0],
    ]),
    { hitTime: true, hitTime2: true },
  );
  TestValidator.predicate(
    "hit point on/inside the sphere",
    Math.hypot(hit!.point.x - 10, hit!.point.y, hit!.point.z) <= 1.001,
  );

  // 7. nothing in the way
  TestValidator.equals(
    "no collider on the path → null",
    projectileSphereHit(
      { origin: v(0, 0, 0), velocity: v(10, 5, 0), gravity: v(0, -10, 0) },
      { center: v(0, 50, 0), radius: 1 },
      2,
    ),
    null,
  );
}
