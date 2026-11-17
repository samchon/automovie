import { createBall } from "@automovie/archetypes";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanVerdicts,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanVerdicts,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A flight still in the air at the film's end is allowed and reported apart
 * from the findings (#3479).
 *
 * Scenarios, the average man throwing a handball overarm at a point 30 m
 * ahead, the film ending with the throw:
 * 1. The ball's flight is unended: its end is past the film.
 * 2. The verdicts report it under `unended` as `ball@<launch second>`, and
 *    do not count it among the findings.
 * 3. The same throw followed by 4 s of standing ends on the floor and
 *    reports no unended flight.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Throws a real ball through the public chain and reads its flight and the verdicts; a flight cut at the film's end, an unended flight counted as a finding or one not reported fails.
 * @evidence contracts/development/testing.md#independent-expectations The film's end and the throw's distance are the scene's.
 * @evidence contracts/development/testing.md#distinguishing-cases A film that ends in the air and one that lasts past the landing.
 * @evidence contracts/development/testing.md#execution-ownership Builds two performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the three numbered scenarios.
 */
export function test_human_motion_flight_unended(): void {
  const ball: ReturnType<typeof createBall> = createBall({ kind: "handball" });
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const perform = (after: number): IAutoMovieMotionHumanPerformance => {
    const chain = HumanChain.subject("a")
      .pickUp({ prop: "ball", handle: "grip" })
      .throwObject({
        at: { kind: "point", frame: "world", at: { x: 0, y: 0, z: 30 } },
        prop: "ball",
      });
    return new HumanPerformance({
      seed: "unended",
      props: [
        HumanObject.prop("ball", ball, {
          at: { x: -0.25, y: 0.9, z: 0.35 },
          yaw: 0,
        }),
      ],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: (after > 0 ? chain.stand({ seconds: after }) : chain).node,
    });
  };
  let short: IAutoMovieMotionHumanPerformance;
  try {
    short = perform(0);
  } catch (error) {
    TestValidator.predicate(
      `the throw plans (${error instanceof Error ? error.message : String(error)})`,
      false,
    );
    return;
  }
  const flight = short.flights("ball")[0];
  TestValidator.predicate(
    "the flight is unended",
    flight !== undefined && flight.end === Infinity,
  );
  const report: IAutoMovieMotionHumanVerdicts.IReport = HumanVerdicts.of(short);
  TestValidator.predicate(
    `the verdicts report it apart (${(report.unended ?? []).join(", ")})`,
    (report.unended ?? []).length === 1 &&
      (report.unended ?? [])[0]!.startsWith("ball@") &&
      report.findings.every((f) => !f.where.includes("ball")),
  );
  const long: IAutoMovieMotionHumanPerformance = perform(4);
  TestValidator.predicate(
    "a film that outlasts the flight reports none unended",
    (HumanVerdicts.of(long).unended ?? []).length === 0,
  );
}
