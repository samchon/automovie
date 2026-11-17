import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieHumanPostureRotation,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFlight,
  IAutoMovieMotionHumanFlightTurns,
  IAutoMovieMotionHumanJump,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  jump,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/**
 * The public jump planner declares turns before any flight integration.
 * Signed counts, side frames and rotation handback are authoring semantics
 * and need no repeatedly solved full-performance Cartesian matrix.
 *
 * Scenarios:
 * 1. Zero, half, one and two somersaults in all four directions preserve
 *    their signed count. A side salto's lateral axis is -Z for left and +Z
 *    for right, while its long axis stays +Y. Forward/backward retain the
 *    ordinary lateral frame. Zero turns declare no flight or callback.
 * 2. Both twist signs survive without a somersault. Omitted, empty and
 *    explicit signed-zero requests declare no integration work.
 * 3. A result handed back to one plan applies only strictly inside its
 *    declared flight. Its callback receives the actual local query time;
 *    a different plan has no result and the unchanged prior posture stays
 *    without a rotation. The flight interval must be finite and positive.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States turn units, independent side-axis vectors, actual canonical entry provenance, plan-local seconds and the three request/ownership scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public jump.plan over a real standing Human entry and observes flight declarations and public handback/posture seams. Dropped counts, reversed direction, wrong frames, needless zero-turn integration or leaked/out-of-window results fail.
 * @evidence contracts/development/testing.md#independent-expectations Authoring counts and right-handed quarter-turn axis vectors determine numeric expectations. An owned handback callback returns its query time as an about coordinate. The plan supplies its declared interval only to test interval consistency and ownership, not as an independent oracle of takeoff physics or phase timing.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers zero/half/one/two turns, every way, both twist signs, omitted/empty/signed-zero requests and handback boundaries/ownership. Mandatory feasible full flights, displayed winding, momentum, contacts and ROM remain core_flight/core_flight_sample and the existing action audits' contracts.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable synchronous unit obtains a canonical average-man standing entry once, then calls the public law planner without composing any turned performance or integrating flight dynamics. Owned callbacks observe their real queries; no source-boundary import, extra product export, renderer, host, process or foreign-method replacement is used.
 */
export function test_motion_jump_turning(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const standing: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "jump-turn-request",
    performers: [{ subject: "a", body, at: { x: 0, y: 0, z: 0 }, yaw: 0, proficiency: { level: "trained" } }],
    composition: HumanChain.subject("a").stand({ seconds: 0.3, sway: 0 }).node,
  });
  const entry: IAutoMovieMotionHumanSegment = standing.segments("a")[0]!;
  const plan: (rotation?: IAutoMovieMotionHumanJump.IParams["rotation"]) => IAutoMovieMotionHumanActionPlan = (
    rotation?: IAutoMovieMotionHumanJump.IParams["rotation"],
  ): IAutoMovieMotionHumanActionPlan => jump.plan({
    ...entry.context,
    params: { to: { x: 0, y: 0, z: 1 }, apex: 0.5, ...(rotation === undefined ? {} : { rotation }) },
  });
  const failures: string[] = [];
  const check: (label: string, condition: boolean) => void = (
    label: string,
    condition: boolean,
  ): void => {
    if (!condition) failures.push(label);
  };

  for (const somersault of [0, 0.5, 1, 2])
    for (const way of ["forward", "backward", "left", "right"] as const) {
      const label: string = `${somersault} ${way}`;
      const current: IAutoMovieMotionHumanActionPlan = plan({ somersault, way });
      const flight: IAutoMovieMotionHumanFlight | undefined = current.flight;
      if (somersault === 0) {
        check(`${label}: no unnecessary flight`, flight === undefined);
        check(`${label}: no unnecessary handback`, current.airborne === undefined);
        continue;
      }
      check(`${label}: declares a flight and handback`, flight !== undefined && current.airborne !== undefined);
      if (flight === undefined) continue;
      check(`${label}: finite positive flight window`,
        Number.isFinite(current.duration) && current.duration > 0 &&
        Number.isFinite(flight.from) && Number.isFinite(flight.to) &&
        0 <= flight.from && flight.from < flight.to && flight.to <= 1,
      );
      check(`${label}: declares turns`, flight.momentum.kind === "turns");
      if (flight.momentum.kind !== "turns") continue;
      const request: IAutoMovieMotionHumanFlightTurns = flight.momentum;
      check(`${label}: signed somersault request`,
        nclose(request.somersault, way === "backward" ? -somersault : somersault, 0),
      );
      check(`${label}: no invented twist`, nclose(request.twist, 0, 0));
      if (way === "left" || way === "right") {
        const lateral: IAutoMovieVector3 = { x: 0, y: 0, z: way === "left" ? -1 : 1 };
        check(`${label}: side salto declares a frame`, request.frame !== undefined);
        if (request.frame !== undefined) {
          check(`${label}: independent lateral axis`,
            vclose(Quaternion.rotateVector(request.frame, { x: 1, y: 0, z: 0 }), lateral, 1e-12),
          );
          check(`${label}: unchanged long axis`,
            vclose(Quaternion.rotateVector(request.frame, { x: 0, y: 1, z: 0 }), { x: 0, y: 1, z: 0 }, 1e-12),
          );
        }
      } else check(`${label}: ordinary frame`, request.frame === undefined);
    }

  for (const twist of [-1, 1]) {
    const flight: IAutoMovieMotionHumanFlight | undefined = plan({ twist }).flight;
    check(`twist ${twist}: independently signed request`,
      flight?.momentum.kind === "turns" &&
      nclose(flight.momentum.somersault, 0, 0) && nclose(flight.momentum.twist, twist, 0),
    );
  }
  for (const rotation of [undefined, {}, { somersault: -0, twist: -0 }]) {
    const current: IAutoMovieMotionHumanActionPlan = plan(rotation);
    check("absent/empty/signed-zero request declares no flight or handback",
      current.flight === undefined && current.airborne === undefined,
    );
  }

  const current: IAutoMovieMotionHumanActionPlan = plan({ somersault: 1 });
  const other: IAutoMovieMotionHumanActionPlan = plan({ somersault: 1 });
  if (current.flight === undefined || current.airborne === undefined)
    failures.push("nonzero request has no result receiver or flight");
  else {
    const from: number = current.flight.from * current.duration;
    const to: number = current.flight.to * current.duration;
    const middle: number = (from + to) / 2;
    const original: IAutoMovieMotionHumanPosture = current.posture(middle);
    check("before handback has no result", original.rotation === undefined);
    const queries: number[] = [];
    current.airborne((seconds: number): IAutoMovieHumanPostureRotation => {
      queries.push(seconds);
      return { about: { x: seconds, y: 5, z: -2 }, turn: { x: 0, y: 0, z: 0, w: 1 } };
    });
    for (const seconds of [0, from, to, current.duration])
      check(`outside/at boundary ${seconds} has no result`, current.posture(seconds).rotation === undefined);
    const shown: IAutoMovieMotionHumanPosture = current.posture(middle);
    check("interior result receives the actual local time",
      shown.rotation !== undefined && vclose(shown.rotation.about, { x: middle, y: 5, z: -2 }, 0),
    );
    TestValidator.predicate("only the actual interior query reaches the result owner",
      queries.length === 1 && nclose(queries[0]!, middle, 0),
    );
    check("a different flight has no handed-back result", other.posture(middle).rotation === undefined);
    check("the prior posture remains without a rigid result", original.rotation === undefined);
  }
  TestValidator.equals("jump turn request and result ownership", failures, []);
}
