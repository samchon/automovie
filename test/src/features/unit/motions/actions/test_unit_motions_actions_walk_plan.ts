import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanFoot, walk } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { motionPlanReading as R } from "../../../internal/motionPlanReading";

/** How far a planted sole may slip over a 1/120 s window, metres. */
const SLIP: number = 0.005;

/** How far apart two seeds may place a footfall, metres. */
const PLACEMENT: number = 0.002;

/** How far apart two seeds may end the walk, metres. */
const DESTINATION: number = 0.001;

/** The least difference two seeds make in a heel strike's time, seconds. */
const TIMING: number = 0.001;

/** The floor's contact height a bearing sole lies within, metres. */
const CONTACT: number = 0.01;

/** The least height of a swinging sole over the floor at mid-swing, metres. */
const SWING: number = 0.01;

/**
 * `walk`'s plan walks to a floor point in whole steps: its heel strikes and
 * toe-offs bound each foot's plant windows, the seed varies only their
 * timing, a planted sole stays put and a swinging one lifts.
 *
 * Scenarios, on the average man walking 6 m along +Z:
 *
 * 1. The same seed repeats every heel strike; another seed moves their times
 *    by more than a millisecond but places every footfall within 2 mm and ends
 *    the walk within 1 mm of the same place.
 * 2. `leftToeOff1` comes before `leftHeelStrike1`, which comes no later than
 *    `lastFootfall`, which comes no later than `arrive`; the left foot's plant
 *    window closes at the toe-off and opens again at the heel strike.
 * 3. Half way through the left foot's second stance its sole sockets bear on
 *    the floor and slip no more than 5 mm over 1/120 s; half way through its
 *    first swing its lowest socket is clear of the floor.
 */
export async function test_unit_motions_actions_walk_plan(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const plan = (seed: string): IAutoMovieMotionHumanActionPlan =>
    walk.plan(motionActionContext(body, { to: { x: 0, y: 0, z: 6 } }, { seed }));
  const strikes = (p: IAutoMovieMotionHumanActionPlan): { name: string; time: number }[] =>
    p.events
      .filter((e: IAutoMovieMotionEvent): boolean => /^(left|right)HeelStrike\d+$/.test(e.name))
      .map((e: IAutoMovieMotionEvent) => ({ name: e.name, time: e.share * p.duration }))
      .sort((a, b): number => a.time - b.time);

  // 1. The seed's share.
  const first: IAutoMovieMotionHumanActionPlan = plan("recompose-travel");
  const other: IAutoMovieMotionHumanActionPlan = plan("timing-2");
  const a = strikes(first);
  const b = strikes(other);
  TestValidator.equals("the same seed repeats", strikes(plan("recompose-travel")), a);
  TestValidator.predicate(
    "another seed moves the strikes",
    a.length >= 4 &&
      a.length === b.length &&
      Math.max(...a.map((v, i: number): number => Math.abs(v.time - b[i]!.time))) > TIMING,
  );
  for (const [i, one] of a.entries()) {
    const part: "leftFoot" | "rightFoot" = one.name.startsWith("left") ? "leftFoot" : "rightFoot";
    const x: IAutoMovieVector3 = R.bones(body, first, one.time + 1 / 24).get(part)!.worldPosition;
    const y: IAutoMovieVector3 = R.bones(body, other, b[i]!.time + 1 / 24).get(part)!.worldPosition;
    TestValidator.predicate(
      `${one.name} placed alike`,
      Math.hypot(x.x - y.x, x.z - y.z) <= PLACEMENT,
    );
  }
  const stop = (p: IAutoMovieMotionHumanActionPlan): number => {
    const bones: ReturnType<typeof R.bones> = R.bones(body, p, p.duration);
    return (
      (bones.get("leftUpperLeg")!.worldPosition.z +
        bones.get("rightUpperLeg")!.worldPosition.z) /
      2
    );
  };
  TestValidator.predicate(
    "the destination does not move",
    Math.abs(stop(first) - stop(other)) <= DESTINATION,
  );

  // 2. The events and the windows.
  const toe: number = R.event(first, "leftToeOff1")!;
  const heel: number = R.event(first, "leftHeelStrike1")!;
  const next: number = R.event(first, "leftToeOff2")!;
  TestValidator.predicate(
    "the events in order",
    toe < heel &&
      heel <= R.event(first, "lastFootfall")! &&
      R.event(first, "lastFootfall")! <= R.event(first, "arrive")!,
  );
  const supported = (t: number): boolean =>
    first.contacts.some(
      (c: IAutoMovieMotionHumanContactWindow): boolean =>
        c.part === "leftFoot" &&
        c.kind === "plant" &&
        t >= c.from * first.duration &&
        t <= c.to * first.duration,
    );
  const h: number = (heel - toe) / 1000;
  TestValidator.predicate(
    "the toe-off releases the plant",
    supported(toe - h) && !supported(toe + h),
  );
  TestValidator.predicate(
    "the heel strike restores it",
    !supported(heel - h) && supported(heel + h),
  );

  // 3. Planted and swinging soles.
  const sockets = (t: number): IAutoMovieVector3[] =>
    HumanFoot.sockets(body, R.bones(body, first, t), "left").map(
      (s: ReturnType<typeof HumanFoot.sockets>[number]): IAutoMovieVector3 => s.point,
    );
  const stance: number = (heel + next) / 2;
  const before: IAutoMovieVector3[] = sockets(stance - 1 / 240);
  const after: IAutoMovieVector3[] = sockets(stance + 1 / 240);
  TestValidator.predicate(
    "the planted sole bears and stays",
    Math.min(...before.map((p: IAutoMovieVector3): number => p.y)) <= CONTACT &&
      Math.min(
        ...before.map((p: IAutoMovieVector3, i: number): number =>
          Math.hypot(p.x - after[i]!.x, p.z - after[i]!.z),
        ),
      ) <= SLIP,
  );
  TestValidator.predicate(
    "the swinging sole lifts",
    Math.min(...sockets((toe + heel) / 2).map((p: IAutoMovieVector3): number => p.y)) > SWING,
  );
}
