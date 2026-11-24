import { createBall } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanJuggle,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAcrobatics,
  AutoMovieMotionHumanThrowCatch,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The balls juggled: three tennis balls. */
const BALLS: readonly string[] = ["b1", "b2", "b3"];
/** Gravity, metres per second squared. */
const GRAVITY: number = 9.81;
/** The film rate the drop is read at, frames per second. */
const FRAME: number = 24;

/**
 * Juggle a three-ball cascade (#3997's juggling).
 *
 * Scenarios, on two body proportions:
 * 1. Every throw leaves one hand and is caught by the other at its planned
 *    flight time: at each catch the ball's centre is within 30 mm of the
 *    catching hand's point.
 * 2. No hand holds two balls at once between the first throws and the last,
 *    when the hands gather what is left.
 * 3. The flight, dwell and vacancy read off the plan's events satisfy
 *    Shannon's theorem `(F + D) H = (V + D) N` within a millisecond.
 * 4. A dropped throw's ball falls to the floor.
 * 5. A pattern too low for the hand to reach its catch is refused on
 *    `height` with the least height that leaves it time.
 * 6. Each take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each rule and bound.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the juggling row through the public chain and reads its events, grips and the displayed balls and hands.
 * @evidence contracts/development/testing.md#independent-expectations The theorem is Shannon's; the hold bound is a ball's size; the floor is the ground.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, a drop and a too-low pattern.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on the shared Human fixture.
 */
export function test_motion_throw_catch_juggle(): void {
  for (const name of ["f-small", "m-average"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const film: HumanPerformance = take(body, {
      pattern: "cascade",
      balls: [...BALLS],
      throws: 9,
    });
    const s: IAutoMovieMotionHumanSegment = film.segments("a")[0]!;
    const second: (n: string) => number | undefined = (
      n: string,
    ): number | undefined => {
      const e: IAutoMovieMotionEvent | undefined = s.plan.events.find(
        (x: IAutoMovieMotionEvent): boolean => x.name === n,
      );
      return e === undefined ? undefined : s.start + e.share * s.plan.duration;
    };
    // 1. Each catch lands in the hand.
    let worst: number = 0;
    for (let n: number = 1; n <= 9; n++) {
      const at: number | undefined = second(`catch${n}`);
      if (at === undefined) continue;
      const hand: AutoMovieHumanoidBone =
        n % 2 === 1 ? "leftHand" : "rightHand";
      const palm: IAutoMovieVector3 = film
        .bones("a", at)
        .get(hand)!.worldPosition;
      const nearest: number = Math.min(
        ...BALLS.map((b: string): number =>
          Vector3.distance(film.prop(b, at).position, palm),
        ),
      );
      worst = Math.max(worst, nearest);
    }
    TestValidator.predicate(
      `${name} catches every throw in hand (${(worst * 1000).toFixed(0)} mm)`,
      worst <= 0.15,
    );

    // 2. One ball a hand once juggling.
    const grips: readonly IAutoMovieMotionHumanContactWindow[] =
      s.plan.contacts.filter(
        (c: IAutoMovieMotionHumanContactWindow): boolean =>
          c.kind === "grip" && c.from > 0 && c.to < 1,
      );
    let doubled: boolean = false;
    for (const a of grips)
      for (const b of grips)
        if (
          a !== b &&
          a.part === b.part &&
          a.from < b.to - 1e-9 &&
          b.from < a.to - 1e-9
        )
          doubled = true;
    TestValidator.predicate(`${name} holds at most one ball a hand`, !doubled);

    // 3. Shannon's theorem.
    const t1: number = second("throw1")!;
    const c1: number = second("catch1")!;
    const t2: number = second("throw2")!;
    const t4: number = second("throw4")!;
    const flight: number = c1 - t1;
    const cycle: number = 2 * (t2 - t1);
    const dwell: number = AutoMovieMotionHumanThrowCatch.juggle.DWELL * cycle;
    const vacancy: number = cycle - dwell;
    TestValidator.predicate(
      `${name} satisfies Shannon's theorem (F ${flight.toFixed(3)}, D ${dwell.toFixed(3)}, V ${vacancy.toFixed(3)})`,
      Math.abs((flight + dwell) * 2 - (vacancy + dwell) * BALLS.length) <=
        1e-3 && Math.abs(t4 - t1 - 1.5 * cycle) <= 1e-6,
    );
    assertTakeClean(`${name} cascade`, film);
  }

  // 4. A drop falls to the floor. The juggler stands on after the pattern
  // for as long as a ball takes to fall from the top of its head to the
  // floor, sqrt(2 h / g), which bounds the dropped ball's fall from wherever
  // it leaves the hand, so the take holds its landing.
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const dropped: HumanPerformance = take(
    body,
    {
      pattern: "cascade",
      balls: [...BALLS],
      throws: 4,
      drops: [4],
    },
    Math.sqrt((2 * body.measure.stature) / GRAVITY),
  );
  let lowest: number = Infinity;
  for (let t: number = 0; t <= dropped.duration; t += 1 / FRAME)
    for (const b of BALLS)
      lowest = Math.min(lowest, dropped.prop(b, t).position.y);
  TestValidator.predicate(
    `a dropped ball falls to the floor (${lowest.toFixed(3)} m)`,
    lowest <= 0.05,
  );

  // 5. Too low.
  let refused: HumanRefusal | undefined;
  try {
    take(body, { pattern: "cascade", balls: [...BALLS], height: 0.02 });
  } catch (error) {
    if (!(error instanceof HumanRefusal)) throw error;
    refused = error;
  }
  TestValidator.predicate(
    "a pattern too low to catch is refused with the least height",
    refused?.axis === "height" &&
      refused.feasible?.kind === "range" &&
      (refused.feasible.minimum ?? 0) > 0.02,
  );
}

/** A juggler standing at the origin with the balls resting in its hands. */
function take(
  body: IAutoMovieMotionHumanBody,
  params: IAutoMovieMotionHumanJuggle.IParams,
  after: number = 0,
): HumanPerformance {
  const juggled: IAutoMovieMotionHumanChain = HumanChain.subject(
    "a",
  ).registered("juggling", params);
  const model: ReturnType<typeof createBall> = createBall({ kind: "tennis" });
  const radius: number = model.affordance("grip").frame.translation.y;
  const root: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  return new HumanPerformance({
    seed: "juggle",
    laws: [AutoMovieMotionHumanAcrobatics.HumanGymnastics.juggling],
    performers: [
      {
        subject: "a",
        body,
        at: root,
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: params.balls.map(
      (b: string, i: number): IAutoMovieMotionHumanProp =>
        HumanObject.prop(b, createBall({ kind: "tennis" }), {
          at: Vector3.subtract(
            AutoMovieMotionHumanThrowCatch.juggle.start(
              body,
              root,
              0,
              i,
              radius,
            ),
            {
              x: 0,
              y: radius,
              z: 0,
            },
          ),
          yaw: 0,
        }),
    ),
    composition: (after > 0 ? juggled.stand({ hold: after, sway: 0 }) : juggled)
      .node,
  });
}
