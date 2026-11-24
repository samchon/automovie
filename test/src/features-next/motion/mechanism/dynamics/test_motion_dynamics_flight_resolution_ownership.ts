import type {
  IAutoMovieHumanPostureRotation,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanJump,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanJump,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { nclose } from "../../../../features/internal/nclose";
import { vclose } from "../../../../features/internal/vclose";

/**
 * Only physical interior and touchdown queries reach the rotation owner.
 *
 * Scenarios:
 * 1. Offer an owned rotation callback to one jump and query adjacent phases and a different jump.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Only physical interior and touchdown queries reach the rotation owner.
 * @evidence contracts/development/testing.md#independent-expectations The callback receives exactly the interior and landing times from its own plan.
 * @evidence contracts/development/testing.md#distinguishing-cases The takeoff instant and the settled landing do not use the physical result.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_flight_resolution_ownership(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const standing: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "jump-turn-request",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").stand({ hold: 0.3, sway: 0 }).node,
  });
  const entry: IAutoMovieMotionHumanSegment = standing.segments("a")[0]!;
  const plan: (
    rotation?: IAutoMovieMotionHumanJump.IParams["rotation"],
  ) => IAutoMovieMotionHumanActionPlan = (
    rotation?: IAutoMovieMotionHumanJump.IParams["rotation"],
  ): IAutoMovieMotionHumanActionPlan =>
    AutoMovieMotionHumanJump.jump.plan({
      ...entry.context,
      params: {
        to: { x: 0, y: 0, z: 1 },
        apex: 0.5,
        ...(rotation === undefined ? {} : { rotation }),
      },
    });
  const failures: string[] = [];
  const check: (label: string, condition: boolean) => void = (
    label: string,
    condition: boolean,
  ): void => {
    if (!condition) failures.push(label);
  };

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
      return {
        about: { x: seconds, y: 5, z: -2 },
        turn: { x: 0, y: 0, z: 0, w: 1 },
      };
    });
    for (const seconds of [0, from, current.duration])
      check(
        `outside/at boundary ${seconds} has no result`,
        current.posture(seconds).rotation === undefined,
      );
    const touchdown: IAutoMovieMotionHumanPosture = current.posture(to);
    check(
      "touchdown keeps the flight's own turn",
      touchdown.rotation !== undefined &&
        vclose(touchdown.rotation.about, { x: to, y: 5, z: -2 }, 0),
    );
    const shown: IAutoMovieMotionHumanPosture = current.posture(middle);
    check(
      "interior result receives the actual local time",
      shown.rotation !== undefined &&
        vclose(shown.rotation.about, { x: middle, y: 5, z: -2 }, 0),
    );
    TestValidator.predicate(
      "only the actual touchdown and interior queries reach the result owner",
      queries.length === 2 &&
        nclose(queries[0]!, to, 0) &&
        nclose(queries[1]!, middle, 0),
    );
    check(
      "a different flight has no handed-back result",
      other.posture(middle).rotation === undefined,
    );
    check(
      "the prior posture remains without a rigid result",
      original.rotation === undefined,
    );
  }
  TestValidator.equals("jump turn request and result ownership", failures, []);
}
