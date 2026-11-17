import {
  Quaternion,
  Vector3,
  integrateAirborneRotation,
  solveAirborneTakeoff,
} from "@automovie/engine";
import type {
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieQuaternion,
  IAutoMovieSolveAirborneTakeoff,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Exact-point reuse in shooting preserves actual turns and reports the miss
 * against the full request, including when no continuation stage succeeds.
 *
 * An isotropic body with I=2 kg m², no relative shape momentum and one
 * second in flight has q(t)=Rx(Lx t/2), so one somersault requires Lx=4 pi.
 * Half that ceiling permits at most half a turn. A zero ceiling admits only
 * identity, with a full-request miss of minus one revolution.
 *
 * The zero-ceiling query also owns a history-read counter. Halving the
 * requested revolution reaches the public angular tolerance after at most
 * ceil(log2(2 pi/tolerance)) failed stages. Each stage has only one distinct
 * physical momentum, plus one initial linearization history read; rejected
 * step-halving trials need no fresh integration of that same zero point.
 * This is a deterministic work bound, separate from physical tolerances.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the isotropic closed form, feasible and impossible requests, residual units and the stage/read bound.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public shooting with full, half and zero momentum ceilings, reads actual returned flight attitudes and full-request residuals, and counts an owned real history callback rather than a foreign method.
 * @evidence contracts/development/testing.md#independent-expectations I omega=L gives Lx=4 pi and exact Rx(Lx t/2); zero momentum gives identity and a full one-revolution miss independently of Newton, continuation or cache bookkeeping.
 * @evidence contracts/development/testing.md#distinguishing-cases A feasible turn, a bounded partial success and no successful stage; eleven actual playback instants, physical ceiling, unwrapped endpoint and separate projected-duplicate work.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory isotropic physical history and owned callback counters through the public engine; no source replacement, renderer or process is used.
 */
export function test_engine_airborne_takeoff_reuse(): void {
  const identity: IAutoMovieQuaternion = Quaternion.identity();
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const complaints: string[] = [];
  for (const maximum of [Infinity, 2 * Math.PI, 0]) {
    let starts: number = 0;
    const history: IAutoMovieIntegrateAirborneRotation.IHistory = (
      seconds: number,
    ): IAutoMovieIntegrateAirborneRotation.IInstant => {
      if (seconds === 0) starts++;
      return {
        inertia: { moments: { x: 2, y: 2, z: 2 }, rotation: identity },
        relative: origin,
      };
    };
    const result: IAutoMovieSolveAirborneTakeoff.ISolution = solveAirborneTakeoff({
      history,
      t0: 0,
      t1: 1,
      q0: identity,
      somersault: 1,
      twist: 0,
      maximum,
      h: 1 / 60,
    });
    const work: number = starts;
    if (result.met !== (maximum === Infinity))
      complaints.push(`ceiling ${maximum}: met ${result.met}`);
    if (!(Vector3.length(result.momentum) <= maximum))
      complaints.push(`ceiling ${maximum}: momentum escaped its ball`);
    if (
      maximum === Infinity &&
      !(
        Math.abs(result.momentum.x - 4 * Math.PI) <=
        2 * solveAirborneTakeoff.TOLERANCE
      )
    )
      complaints.push(`one somersault needs 4 pi, got ${result.momentum.x}`);
    if (!(Math.hypot(result.momentum.y, result.momentum.z) <= 1e-9))
      complaints.push(
        `isotropic somersault has transverse momentum ${JSON.stringify(result.momentum)}`,
      );
    for (let k: number = 0; k <= 10; k++) {
      const t: number = k / 10;
      const expected: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        { x: 1, y: 0, z: 0 },
        (result.momentum.x * t * 90) / Math.PI,
      );
      if (!(Quaternion.angle(result.flight.orientation(t), expected) <= 1e-6))
        complaints.push(
          `ceiling ${maximum}: actual attitude off its isotropic closed form at ${t}`,
        );
    }
    const fullMiss: number = result.momentum.x / (4 * Math.PI) - 1;
    if (
      !(
        Math.abs(result.residual.somersault - fullMiss) <=
        solveAirborneTakeoff.TOLERANCE / (2 * Math.PI)
      )
    )
      complaints.push(
        `ceiling ${maximum}: residual ${result.residual.somersault}, actual full-request miss ${fullMiss}`,
      );
    if (maximum === 0) {
      const stages: number = Math.ceil(
        Math.log2((2 * Math.PI) / solveAirborneTakeoff.TOLERANCE),
      );
      if (!(work > 0 && work <= stages + 1))
        complaints.push(
          `one distinct zero point per stage: ${work} start reads, bound ${stages + 1}`,
        );
    }
    if (starts !== work)
      complaints.push("playback reevaluated the released shooting history");
  }
  TestValidator.equals(
    "shooting reuse preserves the full physical request",
    complaints,
    [],
  );
}
