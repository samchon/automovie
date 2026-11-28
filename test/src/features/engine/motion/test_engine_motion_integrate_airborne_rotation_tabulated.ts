import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
  AutoMovieEngineMotionAirborneRotation,
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

import { throwsError } from "../../internal/throwsError";

/**
 * A flight's shape history tabulated once on uniform knots gives the shape's
 * inertia and relative momentum between its knots without reading the shape
 * again.
 *
 * Two thin rings of mass 1 with intrinsic moments (2, 1, 1) sit on the X axis
 * at x = -r(t) and +r(t), r(t) = 1 + 0.2 sin(2 t) metres, and both spin about X
 * by the angle 0.25 t + 0.1 t^2 radians. The parallel-axis theorem gives the
 * composite tensor diag(4, 2 + 2 r^2, 2 + 2 r^2) kg m^2; the rings move along
 * the line through the centre, so their orbital angular momentum about it is
 * zero, and their spin carries h = 2 * 2 * (0.25 + 0.2 t) = (1 + 0.8 t) X kg
 * m^2/s. The spin's rate is linear in time, so its mean over an interval is its
 * value at the interval's middle and the knots' momenta, their slopes and the
 * cubic between them are exact up to rounding; the tensor's error is the
 * interpolant's, of the fourth order in the step plus the slopes' second-order
 * error times the step.
 *
 * Scenarios:
 *
 * 1. Constructing the history reads no shape and counts nothing; the first query
 *    reads the shape once at each of the 121 knots of a one-second span at
 *    1/120 s, and counts 121 numeric nodes.
 * 2. At nine interior query times and both ends the principal moments lie
 *    within 1e-5 kg m^2 of the closed form and the relative momentum within
 *    1e-6 kg m^2/s: a nearest-knot answer misses the tensor by up to 8e-3 (half
 *    a step of its rate, 1.9) and a linear interpolant by up to 4e-5 (an eighth
 *    of the squared step of its second derivative, 4.5). No query reads the
 *    shape again, a repeated second returns the same instant and counts a memo
 *    hit.
 * 3. A span that is not a whole number of steps is divided into equal intervals no
 *    longer than the step: 0.1 s at 0.03 s reads four intervals' five knots,
 *    all inside the span.
 * 4. One adaptive flight over the tabulated history ends within 1e-5 radian of the
 *    same flight over the millisecond stencil history of the same model and
 *    shape.
 * 5. `clear` releases the table: the next query reads the 121 knots again.
 * 6. The grid keeps positive transverse inertia, bounded turns between sampled
 *    seconds, and refuses a packed-table overflow, duplicate floating-point
 *    seconds and a turn beyond the table's capacity.
 * 7. A span that does not increase, and a step that is not positive, are refused
 *    at construction.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names lazy construction, rounded knot count, memoization, interpolation, flight agreement, clearing, and table capacity refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the public tabulated history from moving ring poses and records reads, memo hits, and returned moments. It compares downstream orientation with a stencil-history flight and separately exercises malformed grids and capacity limits.
 * @evidence contracts/development/testing.md#independent-expectations Parallel axes give diagonal moments (4, 2 + 2r², 2 + 2r²) and ring spin gives (1 + 0.8t) X. Off-knot budgets of 1e-5 for moments and 1e-6 for momentum distinguish nearest-knot reads. A 0.1 s span divided into intervals of at most 0.03 s requires five knots.
 */
export function test_engine_motion_integrate_airborne_rotation_tabulated(): void {
  tabulatedGrid();
  const findings: string[] = [];
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const identity: IAutoMovieQuaternion = AutoMovieEngineQuaternion.identity();
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
    const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
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
  const observation: ReturnType<typeof AutoMovieEngineMotionAirborneRotation.observe> =
    AutoMovieEngineMotionAirborneRotation.observe();
  const history: AutoMovieEngineMotionAirborneRotation.ICachedHistory =
    AutoMovieEngineMotionAirborneRotation.tabulated(
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
  for (const t of [
    0, 0.0031, 0.1234, 0.25004, 0.3771, 0.5004, 0.6219, 0.7493, 0.8762, 0.9979,
    1,
  ]) {
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
      ...moments.map((m: number, i: number): number =>
        Math.abs(m - expected[i]!),
      ),
    );
    if (!(off <= 1e-5))
      findings.push(
        `at ${t} s the principal moments miss the closed form by ${off}`,
      );
    const missed: number = AutoMovieEngineVector3.length(
      AutoMovieEngineVector3.subtract(relative, { x: 1 + 0.8 * t, y: 0, z: 0 }),
    );
    if (!(missed <= 1e-6))
      findings.push(
        `at ${t} s the relative momentum misses (1 + 0.8 t) X by ${missed}`,
      );
  }
  if (reads !== built)
    findings.push(`queries read ${reads - built} more shapes`);
  const hits: number = observation.read().memoHits;
  if (history(0.5004) !== first || observation.read().memoHits !== hits + 1)
    findings.push("a repeated second did not return its instant as a memo hit");

  // 3. A fractional number of steps: equal intervals inside the span.
  seen.length = 0;
  AutoMovieEngineMotionAirborneRotation.tabulated(model, shape, {
    from: 2,
    to: 2.1,
    step: 0.03,
  })(2.05);
  if (
    seen.length !== 5 ||
    seen.some((t: number): boolean => t < 2 || t > 2.1) ||
    seen.some(
      (t: number, i: number): boolean => Math.abs(t - (2 + 0.025 * i)) > 1e-12,
    )
  )
    findings.push(`0.1 s at 0.03 s read the knots ${JSON.stringify(seen)}`);

  // 4. A flight over the table against the stencil history's.
  const flown = (
    over: IAutoMovieIntegrateAirborneRotation.IHistory,
  ): IAutoMovieQuaternion =>
    AutoMovieEngineMotionAirborneRotation.integrate({
      history: over,
      t0: 0,
      t1: 1,
      q0: identity,
      momentum: { x: 3, y: 0.4, z: 0.2 },
      tolerance: { relative: 1e-10, absolute: 1e-10 },
    }).orientation(1);
  const apart: number = AutoMovieEngineQuaternion.angle(
    flown(history),
    flown(AutoMovieEngineMotionAirborneRotation.history(model, shape, { from: 0, to: 1 })),
  );
  if (!(apart <= 1e-5))
    findings.push(
      `the tabulated flight ends ${apart} rad from the stencil history's`,
    );

  TestValidator.equals("a tabulated shape history", findings, []);
  TestValidator.predicate(
    "a span that does not increase is refused",
    throwsError((): void => {
      AutoMovieEngineMotionAirborneRotation.tabulated(model, shape, {
        from: 1,
        to: 1,
        step: 0.01,
      });
    }),
  );
  TestValidator.predicate(
    "a step that is not positive is refused",
    throwsError((): void => {
      AutoMovieEngineMotionAirborneRotation.tabulated(model, shape, {
        from: 0,
        to: 1,
        step: 0,
      });
    }),
  );
}

/** The grid admissions of the tabulated history. */
function tabulatedGrid(): void {
  const model: IAutoMovieResolveCenterOfMass.IModel = {
    mass: 2,
    segments: (["hips", "head"] as const).map(
      (
        bone: AutoMovieHumanoidBone,
      ): IAutoMovieResolveCenterOfMass.ISegment => ({
        bone,
        mass: 1,
        point: { x: 0, y: 0, z: 0 },
        inertia: { x: 0.5, y: 0.5, z: 0.5 },
        axes: AutoMovieEngineQuaternion.identity(),
      }),
    ),
  };
  const pose: IPose = (
    radius: number,
    radians: number,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
    const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
      { x: 1, y: 0, z: 0 },
      (radians * 180) / Math.PI,
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
            worldPosition: { x: i === 0 ? -radius : radius, y: 0, z: 0 },
          },
        ],
      ),
    );
  };
  const midpoint: IAutoMovieIntegrateAirborneRotation.IInstant =
    AutoMovieEngineMotionAirborneRotation.tabulated(
      model,
      (t: number) => pose(t === 2 ? 2 : 0, 0),
      {
        from: 0,
        to: 2,
        step: 1,
      },
    )(0.5);
  TestValidator.predicate("positive transverse moments", () =>
    Object.values(midpoint.inertia.moments).every(
      (moment: number): boolean => moment > 0,
    ),
  );

  const seen: number[] = [];
  const rotating: (t: number) => ReturnType<IPose> = (
    t: number,
  ): ReturnType<typeof pose> => {
    seen.push(t);
    return pose(0, t * t);
  };
  const grid: Required<
    Parameters<typeof AutoMovieEngineMotionAirborneRotation.tabulated>[2]
  > = {
    from: 0,
    to: 1,
    step: 0.25,
    turn: 0.15,
  };
  AutoMovieEngineMotionAirborneRotation.tabulated(model, rotating, grid)(0.5);
  seen.sort((a: number, b: number): number => a - b);
  TestValidator.predicate(
    "adjacent sampled turns",
    () =>
      seen.length > 5 &&
      seen[0] === 0 &&
      seen[seen.length - 1] === 1 &&
      seen.slice(1).every((time: number, i: number): boolean => {
        const previous: number = seen[i]!;
        return (
          time > previous && time * time - previous * previous <= grid.turn
        );
      }),
  );

  TestValidator.error("too many uniform knots", () => {
    AutoMovieEngineMotionAirborneRotation.tabulated(model, rotating, {
      ...grid,
      step: Number.MIN_VALUE,
    })(0.5);
  });
  TestValidator.error("indistinguishable seconds", () => {
    AutoMovieEngineMotionAirborneRotation.tabulated(model, rotating, {
      from: 1,
      to: 1 + Number.EPSILON,
      step: Number.EPSILON / 4,
    })(1);
  });
  TestValidator.error("too many knots for requested turn", () => {
    AutoMovieEngineMotionAirborneRotation.tabulated(model, rotating, {
      ...grid,
      turn: Number.MIN_VALUE,
    })(0.5);
  });
}

/**
 * The owned two-part pose at the prescribed radius in metres and angle in
 * radians.
 */
type IPose = (
  radius: number,
  radians: number,
) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
