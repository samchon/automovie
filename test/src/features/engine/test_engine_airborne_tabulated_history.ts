import {
  Quaternion,
  Vector3,
  integrateAirborneRotation,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/throwsError";

/**
 * A flight's shape history tabulated once on uniform knots gives the shape's
 * inertia and relative momentum between its knots without reading the shape
 * again.
 *
 * Two thin rings of mass 1 with intrinsic moments (2, 1, 1) sit on the X
 * axis at x = -r(t) and +r(t), r(t) = 1 + 0.2 sin(2 t) metres, and both spin
 * about X by the angle 0.25 t + 0.1 t^2 radians. The parallel-axis theorem
 * gives the composite tensor diag(4, 2 + 2 r^2, 2 + 2 r^2) kg m^2; the rings
 * move along the line through the centre, so their orbital angular momentum
 * about it is zero, and their spin carries h = 2 * 2 * (0.25 + 0.2 t) =
 * (1 + 0.8 t) X kg m^2/s. The spin's rate is linear in time, so its mean
 * over an interval is its value at the interval's middle and the knots'
 * momenta, their slopes and the cubic between them are exact up to rounding;
 * the tensor's error is the interpolant's, of the fourth order in the step
 * plus the slopes' second-order error times the step.
 *
 * Scenarios:
 * 1. Constructing the history reads no shape and counts nothing; the first
 *    query reads the shape once at each of the 121 knots of a one-second
 *    span at 1/120 s, and counts 121 numeric nodes.
 * 2. At nine seconds off the knots and at both ends the principal moments
 *    lie within 1e-5 kg m^2 of the closed form and the relative momentum
 *    within 1e-6 kg m^2/s: a nearest-knot answer misses the tensor by up to
 *    8e-3 (half a step of its rate, 1.9) and a linear interpolant by up to
 *    4e-5 (an eighth of the squared step of its second derivative, 4.5). No query reads the shape
 *    again, a repeated second returns the same instant and counts a memo
 *    hit.
 * 3. A span that is not a whole number of steps is divided into equal
 *    intervals no longer than the step: 0.1 s at 0.03 s reads four intervals'
 *    five knots, all inside the span.
 * 4. One adaptive flight over the tabulated history ends within 1e-5 radian
 *    of the same flight over the millisecond stencil history of the same
 *    model and shape.
 * 5. `clear` releases the table: the next query reads the 121 knots again.
 * 6. A span that does not increase, and a step that is not positive, are
 *    refused at construction.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Derives the tensor and the relative momentum of the ring pair, says why the momentum is exact and the tensor is not, and lists the 6 scenarios with their bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public producer and integrator, counts the shape callback's actual calls and reads the public instants; an eager build, a shape read per query, a nearest-knot or linear answer, knots outside the span, a stale table after clear or an admitted bad span fails.
 * @evidence contracts/development/testing.md#independent-expectations The parallel-axis theorem and the spin's momentum give the closed forms; the stated misses of a nearest-knot and of a linear answer come from r's first and second derivatives at the step, not from the implementation. Scenario 4 alone compares with another implementation, the stencil history, as a flight-level cross-check.
 * @evidence contracts/development/testing.md#distinguishing-cases Interior seconds and both ends, a whole and a fractional number of steps, a varying tensor with a varying momentum, repeated and new seconds, before and after clear.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory model with its own shape counter through public engine entries; no host, process or replaced method.
 */
export function test_engine_airborne_tabulated_history(): void {
  const findings: string[] = [];
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const identity: IAutoMovieQuaternion = Quaternion.identity();
  const model: IAutoMovieResolveCenterOfMass.IModel = {
    mass: 2,
    segments: (["hips", "head"] as const).map(
      (bone: "hips" | "head"): IAutoMovieResolveCenterOfMass.ISegment => ({
        bone,
        mass: 1,
        point: zero,
        inertia: { x: 2, y: 1, z: 1 },
        axes: identity,
      }),
    ),
  };
  const radius = (t: number): number => 1 + 0.2 * Math.sin(2 * t);
  let reads: number = 0;
  const seen: number[] = [];
  const shape = (
    t: number,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
    reads++;
    seen.push(t);
    const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 1, y: 0, z: 0 },
      ((0.25 * t + 0.1 * t * t) * 180) / Math.PI,
    );
    return new Map(
      model.segments.map(
        (
          part: IAutoMovieResolveCenterOfMass.ISegment,
          i: number,
        ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [
          part.bone,
          {
            bone: part.bone,
            localRotation: rotation,
            worldRotation: rotation,
            worldPosition: { x: i === 0 ? -radius(t) : radius(t), y: 0, z: 0 },
          },
        ],
      ),
    );
  };

  // 1. Build at construction, one read a knot.
  const observation: ReturnType<typeof integrateAirborneRotation.observe> =
    integrateAirborneRotation.observe();
  const history: integrateAirborneRotation.ICachedHistory =
    integrateAirborneRotation.tabulated(
      model,
      shape,
      { from: 0, to: 1, step: 1 / 120 },
      observation,
    );
  if (reads !== 121 || observation.read().uniqueNumericNodes !== 121)
    findings.push(
      `construction read ${reads} shapes and counted ${observation.read().uniqueNumericNodes} nodes, 121 expected`,
    );
  const first: IAutoMovieIntegrateAirborneRotation.IInstant = history(0.5004);

  // 2. Closed forms off the knots and at the ends.
  const built: number = reads;
  for (const t of [0, 0.0031, 0.1234, 0.25004, 0.3771, 0.5004, 0.6219, 0.7493, 0.8762, 0.9979, 1]) {
    const instant: IAutoMovieIntegrateAirborneRotation.IInstant = history(t);
    const relative: IAutoMovieVector3 = instant.relative;
    const moments: number[] = [
      instant.inertia.moments.x,
      instant.inertia.moments.y,
      instant.inertia.moments.z,
    ].sort((a: number, b: number): number => a - b);
    const across: number = 2 + 2 * radius(t) * radius(t);
    const expected: number[] = [4, across, across].sort(
      (a: number, b: number): number => a - b,
    );
    const off: number = Math.max(
      ...moments.map((m: number, i: number): number => Math.abs(m - expected[i]!)),
    );
    if (!(off <= 1e-5))
      findings.push(`at ${t} s the principal moments miss the closed form by ${off}`);
    const missed: number = Vector3.length(
      Vector3.subtract(relative, { x: 1 + 0.8 * t, y: 0, z: 0 }),
    );
    if (!(missed <= 1e-6))
      findings.push(`at ${t} s the relative momentum misses (1 + 0.8 t) X by ${missed}`);
  }
  if (reads !== built)
    findings.push(`queries read ${reads - built} more shapes`);
  const hits: number = observation.read().memoHits;
  if (history(0.5004) !== first || observation.read().memoHits !== hits + 1)
    findings.push("a repeated second did not return its instant as a memo hit");

  // 3. A fractional number of steps: equal intervals inside the span.
  seen.length = 0;
  integrateAirborneRotation.tabulated(model, shape, { from: 2, to: 2.1, step: 0.03 })(2.05);
  if (
    seen.length !== 5 ||
    seen.some((t: number): boolean => t < 2 || t > 2.1) ||
    seen.some((t: number, i: number): boolean => Math.abs(t - (2 + 0.025 * i)) > 1e-12)
  )
    findings.push(`0.1 s at 0.03 s read the knots ${JSON.stringify(seen)}`);

  // 4. A flight over the table against the stencil history's.
  const flown = (
    over: IAutoMovieIntegrateAirborneRotation.IHistory,
  ): IAutoMovieQuaternion =>
    integrateAirborneRotation({
      history: over,
      t0: 0,
      t1: 1,
      q0: identity,
      momentum: { x: 3, y: 0.4, z: 0.2 },
      tolerance: { relative: 1e-10, absolute: 1e-10 },
    }).orientation(1);
  const apart: number = Quaternion.angle(
    flown(history),
    flown(integrateAirborneRotation.history(model, shape, { from: 0, to: 1 })),
  );
  if (!(apart <= 1e-5))
    findings.push(`the tabulated flight ends ${apart} rad from the stencil history's`);

  TestValidator.equals("a tabulated shape history", findings, []);
  TestValidator.predicate(
    "a span that does not increase is refused",
    throwsError((): void => {
      integrateAirborneRotation.tabulated(model, shape, { from: 1, to: 1, step: 0.01 });
    }),
  );
  TestValidator.predicate(
    "a step that is not positive is refused",
    throwsError((): void => {
      integrateAirborneRotation.tabulated(model, shape, { from: 0, to: 1, step: 0 });
    }),
  );
}
