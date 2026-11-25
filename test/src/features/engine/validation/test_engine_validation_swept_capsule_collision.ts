import { measureAutoMovieSweptCapsuleCollision } from "@automovie/engine";
import type {
  IAutoMovieVector3,
  IAutoMovieSweptCapsuleCollision as Sweep,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { nclose } from "../../internal/nclose";

/**
 * Verify conservative interval decisions on independently known capsule paths.
 *
 * Scenarios:
 *
 * 1. A thin moving cord crosses a stationary sphere between clear endpoints. A
 *    confirmed sample is inside the analytic time window, without claiming
 *    first impact.
 * 2. A parallel offset misses at every second, while a proxy reads the same
 *    crossing without claiming displayed geometry.
 * 3. Missing motion, unresolved diagonal bounds and exhausted work remain
 *    deferred. A depth allowance larger than the summed radii proves no
 *    violation.
 */
export function test_engine_validation_swept_capsule_collision(): void {
  const cord: Sweep.ISpan = {
    a0: point(-0.735, -1),
    b0: point(-0.735, 1),
    a1: point(1.265, -0.8),
    b1: point(1.265, 1.2),
    radius: 0.005,
    basis: "displayed",
  };
  const sphere: Sweep.ISpan = {
    a0: point(0, 0),
    b0: point(0, 0),
    a1: point(0, 0),
    b1: point(0, 0),
    radius: 0.02,
    basis: "displayed",
  };
  const request: Sweep.IProps = {
    first: cord,
    second: sphere,
    startSeconds: 10,
    endSeconds: 10.04,
    maxPenetration: 0,
    maxIntervals: 40,
  };
  const result: Sweep.IResult = measureAutoMovieSweptCapsuleCollision(request);
  assert.equal(result.status, "confirmed");
  if (result.status !== "confirmed") return;
  const fraction: number =
    (result.seconds - request.startSeconds) /
    (request.endSeconds - request.startSeconds);
  const cordX: number = -0.735 + 2 * fraction;
  const actual: number = Math.abs(cordX) - (cord.radius + sphere.radius);
  TestValidator.predicate(
    "actual sample lies inside the crossing interval",
    actual < 0 &&
      result.startSeconds < result.seconds &&
      result.endSeconds > result.seconds,
  );
  TestValidator.predicate(
    "signed gap at the sample matches the analytic line-to-centre gap",
    nclose(result.separation, actual, 1e-10),
  );
  TestValidator.predicate(
    "endpoint and midpoint gaps are positive independently of the sampler",
    [-0.735, 0.265, 1.265].every((x: number): boolean => Math.abs(x) > 0.025),
  );
  TestValidator.predicate(
    "the world witness is inside both analytic solids",
    Math.hypot(result.point.x, result.point.y, result.point.z) <
      sphere.radius &&
      Math.hypot(result.point.x - cordX, result.point.z) < cord.radius &&
      Math.abs(cordX) / 2 > cord.radius,
  );
  TestValidator.equals(
    "repeat reads do not depend on predecessor state",
    measureAutoMovieSweptCapsuleCollision(request),
    result,
  );

  const offset: IAutoMovieVector3 = point(0, 0, 0.03);
  const miss: Sweep.IResult = measureAutoMovieSweptCapsuleCollision({
    ...request,
    second: { ...sphere, a0: offset, b0: offset, a1: offset, b1: offset },
  });
  TestValidator.equals(
    "parallel miss is separated by one outward-rounded envelope",
    miss,
    { status: "clear", basis: "displayed", compared: 1 },
  );
  TestValidator.equals(
    "a proxy crossing retains proxy evidence",
    measureAutoMovieSweptCapsuleCollision({
      ...request,
      first: { ...cord, basis: "proxy" },
    }).status,
    "proxy",
  );

  const diagonal: Sweep.ISpan = {
    ...cord,
    a0: point(-1, -1),
    b0: point(1, 1),
    a1: point(-1, -1),
    b1: point(1, 1),
  };
  const far: IAutoMovieVector3 = point(0.5, -0.5);
  TestValidator.equals(
    "inseparable axis bounds without a penetration witness defer",
    measureAutoMovieSweptCapsuleCollision({
      ...request,
      first: diagonal,
      second: { ...sphere, a0: far, b0: far, a1: far, b1: far },
      maxIntervals: 3,
    }),
    { status: "deferred", reason: "budget", compared: 3 },
  );
  TestValidator.equals(
    "unknown temporal motion cannot count as checked",
    measureAutoMovieSweptCapsuleCollision({ ...request, first: null }),
    { status: "deferred", reason: "unsupported-motion", compared: 0 },
  );
  TestValidator.equals(
    "zero work remains deferred",
    measureAutoMovieSweptCapsuleCollision({ ...request, maxIntervals: 0 }),
    { status: "deferred", reason: "budget", compared: 0 },
  );
  TestValidator.equals(
    "an allowance exceeding both radii proves no violation",
    measureAutoMovieSweptCapsuleCollision({ ...request, maxPenetration: 0.03 }),
    { status: "clear", basis: "displayed", compared: 0 },
  );
  assert.throws(
    (): Sweep.IResult =>
      measureAutoMovieSweptCapsuleCollision({ ...request, endSeconds: 10 }),
    /clock/,
  );
}

/** One world-metre coordinate in the explicit fixture axes. */
function point(x: number, y: number, z: number = 0): IAutoMovieVector3 {
  return { x, y, z };
}
