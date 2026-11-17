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

/**
 * The history fed to a shooting solve is continuous at a boundary stencil,
 * and the flight carries the derivative of its attitude with its momentum.
 *
 * Scenarios:
 * 1. Two unit masses, one stationary and one at (0, 1, t^3), have relative
 *    angular momentum (3 t^2 / 2, 0, 0). On [0.5, 1] the boundary stencil
 *    remains second order within DELTA^2 plus roundoff, and its read either
 *    side of one DELTA from each end differs by at most the analytic rate
 *    3t times that time separation plus finite-difference roundoff.
 * 2. An isotropic rigid body of moment 2 kg m² with L = (3,0,0) turns at
 *    1.5 rad/s. Its body-frame sensitivities to world momentum are the
 *    integral of R^T / 2, checked in closed form at eleven instants within
 *    1e-6 rad per kg m²/s, the trajectory suite's fixed-step accuracy.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two physical models, their independent formulas and numerical bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public history and the integrated flight's momentum tangents; a stencil-switch jump, a loss of second order or a sensitivity with a wrong sign or frame fails.
 * @evidence contracts/development/testing.md#independent-expectations Orbital momentum of two equal masses gives z'/2; an isotropic body's rotation is exp(t L / 2), whose body sensitivity is the time integral of its inverse rotation divided by two.
 * @evidence contracts/development/testing.md#distinguishing-cases Both boundary stencils, their centred transition, all three momentum directions and eleven flight times; asymmetric-body shooting remains in test_engine_airborne_rotation.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable unit test of in-memory mass models and public engine functions; it starts no host.
 */
export function test_engine_airborne_variation(): void {
  const findings: string[] = [];
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const identity: IAutoMovieQuaternion = Quaternion.identity();
  const segment = (
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieResolveCenterOfMass.ISegment => ({
    bone,
    mass: 1,
    point: origin,
    inertia: { x: 2, y: 2, z: 2 },
    axes: identity,
  });
  const model: IAutoMovieResolveCenterOfMass.IModel = {
    mass: 2,
    segments: [segment("hips"), segment("head")],
  };
  const bones = (
    t: number,
  ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    new Map(
      model.segments.map(
        (
          part: IAutoMovieResolveCenterOfMass.ISegment,
        ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [
          part.bone,
          {
            bone: part.bone,
            localRotation: identity,
            worldRotation: identity,
            worldPosition:
              part.bone === "hips" ? origin : { x: 0, y: 1, z: t * t * t },
          },
        ],
      ),
    );
  const span: { from: number; to: number } = { from: 0.5, to: 1 };
  const history: IAutoMovieIntegrateAirborneRotation.IHistory =
    integrateAirborneRotation.history(model, bones, span);
  const delta: number = integrateAirborneRotation.DELTA;
  // For this unit-mass/identity-frame model the momentum's x is exactly
  // 0.5 (z(b)-z(a))/(b-a): the hip has zero speed, y offsets are exactly
  // 0.5, and spin is zero. Each cube has two products, gamma_2 relative
  // error, with magnitude at most 1. Adjacent positive differences are exact
  // by Sterbenz; their width is at least delta/2. The half-scaled difference
  // contributes at most 2 gamma_2/delta, and its reciprocal and product at
  // most 4 epsilon. This is below 4 gamma_2/delta + 2 epsilon here because
  // gamma_2/delta >= epsilon. Each moment's value is below 2.
  // Three momenta have weights of absolute value <=1; the ratio and final
  // addition contribute <=(4+2)epsilon. For exact cubic data their stencil
  // is H=.5(a²+ab+b²)+(t-s)(a+b+s), whose a,b,s derivatives are bounded by
  // 2,2,4 on this span. Node errors <=2epsilon therefore add <=16epsilon.
  const epsilon: number = Number.EPSILON;
  const gamma2: number = (2 * epsilon) / (1 - 2 * epsilon);
  const rounding: number =
    3 * ((4 * gamma2) / delta + 2 * epsilon) + (4 + 2 + 16) * epsilon;
  const eta: number = delta ** 3;

  // 1. The orbital momentum and its continuity under a moving stencil.
  for (const t of [span.from, span.from + delta, span.to - delta, span.to]) {
    const value: IAutoMovieVector3 = history(t).relative;
    if (
      Math.abs(value.x - 1.5 * t * t) > delta * delta + rounding ||
      Math.hypot(value.y, value.z) > rounding
    )
      findings.push(
        `cubic history at ${t}: ${JSON.stringify(value)}, expected ${1.5 * t * t}`,
      );
  }
  for (const t of [span.from + delta, span.to - delta]) {
    const change: number = Vector3.length(
      Vector3.subtract(history(t + eta).relative, history(t - eta).relative),
    );
    const bound: number = 6 * span.to * eta + rounding;
    if (change > bound)
      findings.push(`history jumps ${change} at ${t}, smooth bound ${bound}`);
  }

  // 2. A rigid isotropic body's exact forward sensitivities.
  const rigid: IAutoMovieIntegrateAirborneRotation.IFlight =
    integrateAirborneRotation({
      history: (): IAutoMovieIntegrateAirborneRotation.IInstant => ({
        inertia: { moments: { x: 2, y: 2, z: 2 }, rotation: identity },
        relative: origin,
      }),
      t0: 0,
      t1: 1,
      q0: identity,
      momentum: { x: 3, y: 0, z: 0 },
      variations: [
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 0, z: 1 },
      ],
    });
  for (let k: number = 0; k <= 10; k++) {
    const t: number = k / 10;
    const angle: number = 1.5 * t;
    const expected: IAutoMovieVector3[] = [
      { x: t / 2, y: 0, z: 0 },
      { x: 0, y: Math.sin(angle) / 3, z: -(1 - Math.cos(angle)) / 3 },
      { x: 0, y: (1 - Math.cos(angle)) / 3, z: Math.sin(angle) / 3 },
    ];
    rigid.variations(t).forEach((value: IAutoMovieVector3, i: number): void => {
      const error: number = Vector3.length(
        Vector3.subtract(value, expected[i]!),
      );
      if (error > 1e-6)
        findings.push(
          `momentum direction ${i} at ${t}: ${error} sensitivity error`,
        );
    });
  }
  TestValidator.predicate(
    `airborne history and sensitivity: ${findings.join("; ") || "all hold"}`,
    findings.length === 0,
  );
}
