import {
  Quaternion,
  Vector3,
  integrateAirborneRotation,
  solveAirborneTakeoff,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieSolveAirborneTakeoff,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A known-feasible anisotropic somersault whose principal axis is tilted
 * 20 degrees from the requested frame's lateral axis exercises shooting.
 *
 * Principal moments are (1,2,3), and S=Rz(20 degrees) places the first axis
 * a=S X. L=2 pi a gives q(t)=q0 Exp(2 pi t a) over one second. Its long
 * axis's YZ ellipse encloses the origin because 20<45 degrees, so its
 * somersault winds once and its tilt/twist return to zero. The linear seed
 * I X 2 pi is not along a, requiring the nonlinear solver's correction.
 * Check both fixed and adaptive integration and rotate the whole world.
 * The requested adaptive budget is the flight pass's 0.005 relative with
 * zero absolute tolerance. Actual landing and winding use the existing
 * takeoff solver's angular tolerance, independently of its reported residual.
 * The existing adaptive identity-world cell uses an actual factory history
 * of that same single-part tensor, so operation-owned mesh/shape reuse is
 * exercised without adding a shooting case. Other cells retain raw history.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the tensor, known feasible momentum, tilt bound, winding, frames and unchanged admission tolerance.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public shooting on an independently feasible request and observes actual quaternion playback; inaccurate sensitivity causing refusal, a missed turn or a world-frame error fails.
 * @evidence contracts/development/testing.md#independent-expectations A rigid body rotating about a principal axis has constant L/I; the tilted-axis long-vector ellipse winds once and the 2 pi rotation lands at q0. No unique solved momentum is presumed.
 * @evidence contracts/development/testing.md#distinguishing-cases Fixed and adaptive solving, identity and rotated world frames, direct known-momentum integration and the corrected shooting answer. One existing adaptive cell uses actual single-part factory provenance, while the other raw-history cells retain the general consumer path.
 * @evidence contracts/development/testing.md#execution-ownership One unit test of constant numeric inertia and public engine functions; it starts no host.
 */
export function test_engine_airborne_takeoff_tilted(): void {
  const findings: string[] = [];
  const identity: IAutoMovieQuaternion = Quaternion.identity();
  const principal: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 0, z: 1 },
    20,
  );
  const axis: IAutoMovieVector3 = Quaternion.rotateVector(principal, {
    x: 1,
    y: 0,
    z: 0,
  });
  const history: IAutoMovieIntegrateAirborneRotation.IHistory =
    (): IAutoMovieIntegrateAirborneRotation.IInstant => ({
      inertia: { moments: { x: 1, y: 2, z: 3 }, rotation: principal },
      relative: { x: 0, y: 0, z: 0 },
    });
  const model: IAutoMovieResolveCenterOfMass.IModel = {
    mass: 1,
    segments: [{ bone: "hips", mass: 1, point: { x: 0, y: 0, z: 0 },
      inertia: { x: 1, y: 2, z: 3 }, axes: identity }],
  };
  const native: integrateAirborneRotation.ICachedHistory = integrateAirborneRotation.history(model,
    (): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => new Map([
      ["hips", { bone: "hips", localRotation: identity, worldPosition: { x: 0, y: 0, z: 0 }, worldRotation: principal }],
    ]),
  );
  const observe: (
    flight: IAutoMovieIntegrateAirborneRotation.IFlight,
    q0: IAutoMovieQuaternion,
  ) => { winding: number; landing: number } = (
    flight: IAutoMovieIntegrateAirborneRotation.IFlight,
    q0: IAutoMovieQuaternion,
  ): { winding: number; landing: number } => {
    let winding: number = 0;
    let previous: number = 0;
    for (let k: number = 0; k <= 120; k++) {
      const relative: IAutoMovieQuaternion = Quaternion.multiply(
        Quaternion.inverse(q0),
        flight.orientation(k / 120),
      );
      const long: IAutoMovieVector3 = Quaternion.rotateVector(relative, {
        x: 0,
        y: 1,
        z: 0,
      });
      const angle: number = Math.atan2(long.z, long.y);
      const change: number = angle - previous;
      winding += change - 2 * Math.PI * Math.round(change / (2 * Math.PI));
      previous = angle;
    }
    return { winding, landing: Quaternion.angle(q0, flight.orientation(1)) };
  };
  try {
  for (const q0 of [
    identity,
    Quaternion.fromAxisAngle({ x: 1, y: 2, z: 3 }, 97),
  ])
    for (const adaptive of [false, true]) {
      const selected: IAutoMovieIntegrateAirborneRotation.IHistory = adaptive && q0 === identity ? native : history;
      const precision: NonNullable<
        IAutoMovieIntegrateAirborneRotation.IProps["tolerance"]
      > = { relative: 0.005, absolute: 0 };
      const known: IAutoMovieIntegrateAirborneRotation.IFlight =
        integrateAirborneRotation({
          history: selected,
          t0: 0,
          t1: 1,
          q0,
          momentum: Quaternion.rotateVector(
            q0,
            Vector3.scale(axis, 2 * Math.PI),
          ),
          ...(adaptive ? { tolerance: precision } : {}),
        });
      const solved: IAutoMovieSolveAirborneTakeoff.ISolution = solveAirborneTakeoff({
        history: selected,
        t0: 0,
        t1: 1,
        q0,
        somersault: 1,
        twist: 0,
        ...(adaptive ? { integration: precision } : {}),
      });
      for (const [label, flight] of [
        ["known", known],
        ["solved", solved.flight],
      ] as const) {
        const result: ReturnType<typeof observe> = observe(flight, q0);
        if (
          !(
            Math.abs(result.winding - 2 * Math.PI) <=
            solveAirborneTakeoff.TOLERANCE
          ) ||
          !(result.landing <= solveAirborneTakeoff.TOLERANCE)
        )
          findings.push(
            `${label}, adaptive=${adaptive}: winding=${result.winding}, landing=${result.landing}`,
          );
      }
      if (!solved.met)
        findings.push(
          `known-feasible tilted takeoff refused, adaptive=${adaptive}: ${JSON.stringify(solved.residual)}`,
        );
    }
  } finally {
    native.clear();
  }
  TestValidator.predicate(
    `tilted anisotropic takeoff: ${findings.join("; ") || "all hold"}`,
    findings.length === 0,
  );
}
