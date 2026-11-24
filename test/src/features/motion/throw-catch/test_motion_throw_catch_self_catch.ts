import { createRhythmicBall } from "@automovie/archetypes";
import { AutoMovieGravity, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanThrowObjectLaunch,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanThrowCatch,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * Toss a ball up and catch it again, the same performer cutting its throw into
 * its catch at the release (#3997's self-catch contract).
 *
 * Scenarios, on two body proportions: 0. A toss aimed through its apex rises at
 * least to the asked height, with at most 1 m/s across.
 *
 * 1. The throw cuts into the catch at its release, and the catch meets the ball as
 *    it falls to the chest (`catchObject.TOSS` of the stature): the catching
 *    palm holds the ball within its radius from the contact on.
 * 2. The whole take passes the shipped verdicts.
 * 3. A toss that peaks below the chest never falls to it to be caught and is
 *    refused on `from`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cut, the catch height, the hold and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Plans pickUp, throwObject and catchObject through the public chain and reads the displayed ball against the displayed hand.
 * @evidence contracts/development/testing.md#independent-expectations The catch height is the law's stated share of the stature; the hold bound is the ball's own radius.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, and a toss too low to catch.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on the shared Human fixture.
 */
export function test_motion_throw_catch_self_catch(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["f-small", "m-average"] as const) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(name);

      // 0. The toss aimed through its apex rises to the asked height and goes
      // up, not across: a path through a point at a height peaks no lower.
      const height: number = 1.2 * body.measure.stature;
      const apex: IAutoMovieVector3 = aimed(body, height);
      const launch: IAutoMovieMotionHumanThrowObjectLaunch.ILaunch =
        AutoMovieMotionHumanThrowCatch.throwObject.of(
          take(body, apex, false).segments("a")[1]!.plan,
        )!;
      const across: number = Math.hypot(launch.velocity.x, launch.velocity.z);
      const peak: number =
        launch.point.y +
        launch.velocity.y ** 2 / (2 * AutoMovieGravity.STANDARD);
      checks.check(
        `${name} tosses up to ${peak.toFixed(2)} m for ${height.toFixed(2)} m (${launch.velocity.y.toFixed(2)} m/s up, ${across.toFixed(2)} m/s across)`,
        launch.velocity.y > 0 && across <= 1 && peak >= height - 0.02,
      );

      const film: HumanPerformance = take(body, apex);
      const segments: readonly IAutoMovieMotionHumanSegment[] =
        film.segments("a");
      const thrown: IAutoMovieMotionHumanSegment = segments.find(
        (s: IAutoMovieMotionHumanSegment): boolean =>
          s.law.name === "throwObject",
      )!;
      const caught: IAutoMovieMotionHumanSegment = segments.find(
        (s: IAutoMovieMotionHumanSegment): boolean =>
          s.law.name === "catchObject",
      )!;
      const release: number =
        thrown.start +
        thrown.plan.events.find(
          (e: IAutoMovieMotionEvent): boolean => e.name === "release",
        )!.share *
          thrown.plan.duration;
      const contact: number =
        caught.start +
        caught.plan.events.find(
          (e: IAutoMovieMotionEvent): boolean => e.name === "contact",
        )!.share *
          caught.plan.duration;
      checks.check(
        `${name} cuts the throw into the catch at the release`,
        Math.abs(caught.start - release) <= 1e-6,
      );
      const radius: number = 0.09;
      let worst: number = 0;
      for (let t: number = contact + 0.05; t <= caught.end; t += 0.05) {
        const ball: IAutoMovieVector3 = film.prop("ball", t).position;
        const hand: IAutoMovieVector3 = film
          .bones("a", t)
          .get("rightHand")!.worldPosition;
        worst = Math.max(worst, Vector3.distance(ball, hand));
      }
      const at: IAutoMovieVector3 = film.prop("ball", contact).position;
      checks.check(
        `${name} meets the ball at the chest (${at.y.toFixed(2)} m) and holds it (${(worst * 1000).toFixed(0)} mm)`,
        Math.abs(
          at.y -
            AutoMovieMotionHumanThrowCatch.catchObject.TOSS *
              body.measure.stature,
        ) <= 0.1 && worst <= 2.5 * radius,
      );
      verdict(checks, `${name} toss and catch`, film);
    } catch (error: unknown) {
      checks.check(`${String(name)}: ${everydayTake.describe(error)}`, false);
    }
  }

  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  let refused: HumanRefusal | undefined;
  try {
    take(body, aimed(body, 0.66 * body.measure.stature));
  } catch (error) {
    if (!(error instanceof HumanRefusal)) throw error;
    refused = error;
  }
  checks.check(
    "a toss that never rises to the chest is refused",
    refused?.axis === "partner",
  );
  checks.assert("throw catch self catch");
}

/** The release angle of the toss, degrees. */
const ANGLE: number = 88;

/**
 * How many times the apex is re-aimed from the release the last aim gave: the
 * arm's release moves with its aim.
 */
const PASSES: number = 3;

/**
 * The apex of a toss rising to a height at `ANGLE`: a projectile tops out `2
 * rise / tan(ANGLE)` ahead of its release, read from the release point of a
 * toss aimed at the previous apex (the performer faces +Z).
 */
function aimed(
  body: IAutoMovieMotionHumanBody,
  height: number,
): IAutoMovieVector3 {
  let apex: IAutoMovieVector3 = { x: 0, y: height, z: 0.35 };
  for (let pass: number = 0; pass < PASSES; pass++) {
    const launch: IAutoMovieMotionHumanThrowObjectLaunch.ILaunch =
      AutoMovieMotionHumanThrowCatch.throwObject.of(
        take(body, apex, false).segments("a")[1]!.plan,
      )!;
    const rise: number = height - launch.point.y;
    apex = {
      x: launch.point.x,
      y: height,
      z: launch.point.z + (2 * rise) / Math.tan((ANGLE * Math.PI) / 180),
    };
  }
  return apex;
}
/** A performer picking up the ball, tossing it through a point and catching it. */
function take(
  body: IAutoMovieMotionHumanBody,
  through: IAutoMovieVector3,
  catching: boolean = true,
): HumanPerformance {
  const tossed: IAutoMovieMotionHumanChain = HumanChain.subject("a")
    .pickUp({ prop: "ball", handle: "grip", lift: 0.1 })
    .registered(
      "throwObject",
      {
        target: {
          kind: "point",
          at: through,
          frame: "performer",
        },
        style: "toss",
        angle: ANGLE,
        prop: "ball",
      },
      "toss",
    );
  return new HumanPerformance({
    seed: "self-catch",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      HumanObject.prop("ball", createRhythmicBall(), {
        at: { x: -0.3, y: 0.9, z: 0.35 },
        yaw: 0,
      }),
    ],
    composition: (catching
      ? tossed.until({ event: "release" }).registered("catchObject", {
          partner: "toss",
          ball: "ball",
          hands: "one",
          hand: "right",
        })
      : tossed
    ).node,
  });
}

/** Gather a take's shipped verdicts as one check. */
function verdict(
  checks: motionComplaints.IGatherer,
  label: string,
  film: HumanPerformance,
): void {
  try {
    assertTakeClean(label, film);
  } catch (error: unknown) {
    checks.check(
      `${label}: ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  }
}
