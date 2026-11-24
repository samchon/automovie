import type {
  IAutoMovieInteractionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanStand,
  IAutoMovieMotionPropLaunch,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanPerformance,
  HumanVerdicts,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/**
 * A staged ball drop publishes a contact for its first impact and each
 * subsequent impact, on the film clock.
 *
 * Scenarios:
 * 1. A complete drop rebounds and then settles.
 * 2. A late drop has no contact during the film.
 * 3. A bounce still in the air at the end appears in the verdict.
 * 4. A pickup before the first floor impact cuts off the drop.
 *
 * The fixture drops the flight point from 1 m onto a plane with a declared
 * normal speed ratio of one half. With a 0.1 m settling radius, the first
 * rebound rises 0.25 m and returns to the floor, while the second would
 * rise 0.0625 m and settles. The impact times and speeds follow from
 * constant gravity and the authored ratio. The 1 µs timing limit is the
 * documented contact sweep resolution over this scene, rounded up.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes four drops, their authored floor response, the independent timing model and the tolerance.
 * @evidence contracts/development/testing.md#behavioral-verification Publishes releases from a registered standing action and reads the public performance hit list; a missing, duplicated, misclocked or misplaced physical episode fails.
 * @evidence contracts/development/testing.md#independent-expectations Computes impact times and incoming and outgoing normal speeds from authored height and restitution under standard gravity, without reading the implementation's flight samples or legs to form the expectations.
 * @evidence contracts/development/testing.md#distinguishing-cases A complete drop, an initially airborne drop, an airborne rebound and a displaced flight distinguish the events and verdicts.
 * @evidence contracts/development/testing.md#execution-ownership Uses one in-memory performance, one standing plan and ground-only sweeps. Samples the displayed rebound and reads the film-wide flight verdict with a one-frame body audit.
 */
export function test_motion_contact_prop_contact_timeline(): void {
  const start: number = 0.25;
  const duration: number = 1.5;
  const height: number = 1;
  const restitution: number = 0.5;
  const gravity: number = 9.80665; // Standard acceleration, third CGPM (1901).
  const radius: number = 0.1;
  const still: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const drop: IAutoMovieMotionPropLaunch = {
    prop: "ball",
    seconds: start,
    point: { x: 0, y: height, z: 2 },
    velocity: still,
  };
  const late: IAutoMovieMotionPropLaunch = {
    ...drop,
    prop: "late-ball",
    seconds: duration - start,
  };
  const falling: number = Math.sqrt((2 * height) / gravity);
  const reboundSample: number = 0.2;
  const rising: IAutoMovieMotionPropLaunch = {
    ...drop,
    prop: "rising-ball",
    seconds: duration - falling - reboundSample,
  };
  const picked: IAutoMovieMotionPropLaunch = { ...drop, prop: "picked-ball" };
  const pickup: number = start + falling / 2;
  const ball: IAutoMovieMotionHumanProp = {
    subject: drop.prop,
    frame: {
      position: drop.point,
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    points: {},
    shapes: [
      {
        kind: "sphere",
        id: "sphere",
        material: "ball",
        transform: {
          position: still,
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
        radius,
      },
    ],
    body: { mass: 1, centerOfMass: still, friction: 0, restitution },
  };
  const release: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> =
    {
      ...AutoMovieMotionHumanStance.stand,
      name: "stageBallDrop",
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
      ): IAutoMovieMotionHumanActionPlan => ({
        ...AutoMovieMotionHumanStance.stand.plan(context),
        launches: [drop, late, rising, picked],
        holds: [{ side: "right", prop: picked.prop, from: pickup / duration }],
      }),
    };
  const performance: HumanPerformance = new HumanPerformance({
    seed: "prop-contact-timeline",
    laws: [release],
    props: [
      ball,
      { ...ball, subject: late.prop },
      { ...ball, subject: rising.prop },
      { ...ball, subject: picked.prop },
    ],
    performers: [
      {
        subject: "stagehand",
        body: motionHumanBody("m-average"),
        at: still,
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("stagehand").registered("stageBallDrop", {
      hold: duration,
    }).node,
  });

  const hits: readonly IAutoMovieInteractionEvent[] = performance.hits();
  TestValidator.equals(
    "only the two complete-drop impacts and the rising ball's first impact are published",
    hits.map((hit: IAutoMovieInteractionEvent): string | null => hit.object),
    [drop.prop, drop.prop, rising.prop],
  );

  const first: IAutoMovieInteractionEvent = hits[0]!;
  const second: IAutoMovieInteractionEvent = hits[1]!;
  const incoming: number = gravity * falling;
  const returning: number = (2 * restitution * incoming) / gravity;
  const timeTolerance: number = 1e-6;
  const speedTolerance: number = gravity * timeTolerance;
  TestValidator.predicate(
    "impact seconds include the nonzero launch clock",
    Math.abs(first.time - (start + falling)) <= timeTolerance &&
      Math.abs(second.time - (start + falling + returning)) <= timeTolerance &&
      Math.abs(hits[2]!.time - (rising.seconds + falling)) <= timeTolerance,
  );
  TestValidator.predicate(
    "the initial identifier remains stable and the second is distinct",
    first.id === `flight:ball:${start.toFixed(6)}` && first.id !== second.id,
  );
  for (const hit of hits) {
    TestValidator.predicate(
      "each collision names its source and the upward floor normal",
      hit.actor === "stagehand" &&
        hit.kind === "contact" &&
        hit.source === "collisionSolver" &&
        hit.target === null &&
        hit.point?.y === 0 &&
        hit.normal?.y === 1 &&
        hit.mass === ball.body?.mass,
    );
  }
  TestValidator.predicate(
    "the contact publishes impact and rebound velocity, then terminal rest",
    Math.abs((first.velocity?.y ?? Infinity) + incoming) <= speedTolerance &&
      Math.abs((first.exit?.y ?? Infinity) - restitution * incoming) <=
        speedTolerance &&
      Math.abs((second.velocity?.y ?? Infinity) + restitution * incoming) <=
        speedTolerance &&
      second.exit?.y === 0,
  );

  // Flight verdicts use the whole film. Body findings are outside this spec.
  const framesPerSecond: number = 24;
  const unended: string[] =
    HumanVerdicts.of(performance, framesPerSecond, {
      from: duration - 1 / framesPerSecond,
      to: duration,
    }).unended ?? [];
  const rise: number =
    restitution * incoming * reboundSample - (gravity * reboundSample ** 2) / 2;
  TestValidator.predicate(
    "the displayed rebound is still airborne at the film end",
    Math.abs(performance.prop(rising.prop, duration).position.y - rise) <=
      speedTolerance &&
      unended.includes(`${rising.prop}@${rising.seconds.toFixed(3)}`),
  );
  TestValidator.predicate(
    "pickup suppresses the displaced flight's contacts and unfinished verdict",
    Math.abs(
      (performance.flights(picked.prop)[0]?.supersededAt ?? Infinity) - pickup,
    ) <= timeTolerance &&
      !unended.some((entry: string): boolean =>
        entry.startsWith(`${picked.prop}@`),
      ),
  );
}
