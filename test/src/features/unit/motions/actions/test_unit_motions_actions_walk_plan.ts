import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionManner,
  HumanFoot,
  walk,
} from "@automovie/motions/internal";
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
 * toe-offs bound each foot's plant windows, the seed varies only their timing,
 * a planted sole stays put and a swinging one lifts.
 *
 * The law reads most of the body record: its rig, pose resolution, chains,
 * projection, rest joints, measure, surfaces and profile, so the test builds
 * the stored body (humanFixtureBody).
 *
 * Scenarios, on the average man walking 6 m along +Z:
 *
 * 1. The same seed repeats every heel strike; another seed moves their times by
 *    more than a millisecond but places every footfall within 2 mm and ends the
 *    walk within 1 mm of the same place.
 * 2. `leftToeOff1` comes before `leftHeelStrike1`, which comes no later than
 *    `lastFootfall`, which comes no later than `arrive`; the left foot's plant
 *    window closes at the toe-off and opens again at the heel strike.
 * 3. Half way through the left foot's second stance its sole sockets bear on the
 *    floor and slip no more than 5 mm over 1/120 s; half way through its first
 *    swing its lowest socket is clear of the floor.
 * 4. Walking backwards takes 1.1 to 1.4 times as long as forwards; a fixed heading
 *    backwards and sideways, and a point faced on a bend, keep the hips within
 *    15 degrees of it, and each walk arrives within 0.1 m.
 * 5. A walk turned 30 or 60 degrees left or 60 or 90 right off a walk ahead
 *    arrives within 5 cm.
 * 6. The steady walk goes 1.27 to 1.46 m/s, and the weary walk slower.
 */
export async function test_unit_motions_actions_walk_plan(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const plan = (seed: string): IAutoMovieMotionHumanActionPlan =>
    walk.plan(
      motionActionContext(body, { to: { x: 0, y: 0, z: 6 } }, { seed }),
    );
  const strikes = (
    p: IAutoMovieMotionHumanActionPlan,
  ): { name: string; time: number }[] =>
    p.events
      .filter((e: IAutoMovieMotionEvent): boolean =>
        /^(left|right)HeelStrike\d+$/.test(e.name),
      )
      .map((e: IAutoMovieMotionEvent) => ({
        name: e.name,
        time: e.share * p.duration,
      }))
      .sort((a, b): number => a.time - b.time);

  // 1. The seed's share.
  const first: IAutoMovieMotionHumanActionPlan = plan("recompose-travel");
  const other: IAutoMovieMotionHumanActionPlan = plan("timing-2");
  const a = strikes(first);
  const b = strikes(other);
  TestValidator.equals(
    "the same seed repeats",
    strikes(plan("recompose-travel")),
    a,
  );
  TestValidator.predicate(
    "another seed moves the strikes",
    a.length >= 4 &&
      a.length === b.length &&
      Math.max(
        ...a.map((v, i: number): number => Math.abs(v.time - b[i]!.time)),
      ) > TIMING,
  );
  for (const [i, one] of a.entries()) {
    const part: "leftFoot" | "rightFoot" = one.name.startsWith("left")
      ? "leftFoot"
      : "rightFoot";
    const x: IAutoMovieVector3 = R.bones(body, first, one.time + 1 / 24).get(
      part,
    )!.worldPosition;
    const y: IAutoMovieVector3 = R.bones(body, other, b[i]!.time + 1 / 24).get(
      part,
    )!.worldPosition;
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
      (s: ReturnType<typeof HumanFoot.sockets>[number]): IAutoMovieVector3 =>
        s.point,
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
    Math.min(
      ...sockets((toe + heel) / 2).map((p: IAutoMovieVector3): number => p.y),
    ) > SWING,
  );

  // 4. A fixed heading backwards and sideways, and a facing point on a bend.
  const point = (x: number, z: number): IAutoMovieVector3 => ({ x, y: 0, z });
  const walked = (
    params: Parameters<typeof walk.plan>[0]["params"],
  ): IAutoMovieMotionHumanActionPlan =>
    walk.plan(motionActionContext(body, params, { seed: "facing" }));
  const forward: IAutoMovieMotionHumanActionPlan = walked({ to: point(0, 2) });
  const back: IAutoMovieMotionHumanActionPlan = walked({
    to: point(0, -2),
    facing: { yaw: 0 },
  });
  const side: IAutoMovieMotionHumanActionPlan = walked({
    to: point(1.2, 0),
    facing: { yaw: 0 },
  });
  const centre: IAutoMovieVector3 = point(0, 1.5);
  const arc: IAutoMovieMotionHumanActionPlan = walked({
    to: point(1.5, 1.5),
    via: [1, 2, 3].map((i: number): IAutoMovieVector3 => {
      const angle: number = (i * Math.PI) / 8;
      return point(1.5 * Math.sin(angle), 1.5 * (1 - Math.cos(angle)));
    }),
    facing: { toward: centre },
  });
  const ratio: number = back.duration / forward.duration;
  TestValidator.predicate(
    `backwards takes ${ratio} times as long`,
    ratio >= BACKWARDS[0] && ratio <= BACKWARDS[1],
  );
  for (const [p, end, toward] of [
    [back, point(0, -2), undefined],
    [side, point(1.2, 0), undefined],
    [arc, point(1.5, 1.5), centre],
  ] as const) {
    const here: ReturnType<typeof R.bones> = R.bones(body, p, p.duration / 2);
    const pelvis: IAutoMovieVector3 = here.get("hips")!.worldPosition;
    const l: IAutoMovieVector3 = here.get("leftUpperLeg")!.worldPosition;
    const r: IAutoMovieVector3 = here.get("rightUpperLeg")!.worldPosition;
    const ax: number = l.x - r.x;
    const az: number = l.z - r.z;
    const wx: number = toward === undefined ? 0 : toward.x - pelvis.x;
    const wz: number = toward === undefined ? 1 : toward.z - pelvis.z;
    const facing: number =
      (-az * wx + ax * wz) / (Math.hypot(ax, az) * Math.hypot(wx, wz));
    const arrival: IAutoMovieVector3 = R.bones(body, p, p.duration).get(
      "hips",
    )!.worldPosition;
    TestValidator.predicate(
      "the hips face the authored heading",
      facing >= Math.cos((FACING * Math.PI) / 180),
    );
    TestValidator.predicate(
      "the hips arrive at the target",
      Math.hypot(arrival.x - end.x, arrival.z - end.z) <= ARRIVE,
    );
  }

  // 5. A walk turned off the one before it arrives where it was sent.
  const ahead: IAutoMovieMotionHumanActionPlan = walk.plan(
    motionActionContext(body, { to: point(0, 1.5) }, { seed: "walk-turn" }),
  );
  for (const degrees of [30, 60, -60, -90]) {
    const radians: number = (degrees * Math.PI) / 180;
    const to: IAutoMovieVector3 = point(
      1.2 * Math.sin(radians),
      1.5 + 1.2 * Math.cos(radians),
    );
    const turned: IAutoMovieMotionHumanActionPlan = walk.plan(
      motionActionContext.after(body, ahead, { to }, { seed: "walk-turn" }),
    );
    const root: IAutoMovieVector3 = turned.posture(turned.duration).root;
    TestValidator.predicate(
      `turned ${degrees} degrees: arrives`,
      Math.hypot(root.x - to.x, root.z - to.z) <= TURN_ARRIVE,
    );
  }

  // 6. A steady walk's speed and the weary walk's.
  const speed = (p: IAutoMovieMotionHumanActionPlan): number => {
    const from: number = 0.25 * p.duration;
    const to: number = 0.85 * p.duration;
    return (
      (R.bones(body, p, to).get("hips")!.worldPosition.z -
        R.bones(body, p, from).get("hips")!.worldPosition.z) /
      (to - from)
    );
  };
  const steady: number = speed(first);
  TestValidator.predicate(
    `the steady speed ${steady} m/s`,
    steady >= STEADY[0] && steady <= STEADY[1],
  );
  const weary: number = speed(
    walk.plan(
      motionActionContext(
        body,
        {
          to: { x: 0, y: 0, z: 6 },
          manner: AutoMovieMotionManner.PRESETS.weary,
        },
        { seed: "recompose-travel" },
      ),
    ),
  );
  TestValidator.predicate(
    `the weary walk is slower (${weary} m/s)`,
    weary < steady,
  );
}

/** The backwards walk's time over the forward walk's, as a band. */
const BACKWARDS: readonly [number, number] = [1.1, 1.4];

/** How far the hips may turn from an authored heading, degrees. */
const FACING: number = 15;

/** How near the hips arrive, metres. */
const ARRIVE: number = 0.1;

/** How near a turned walk's root arrives, metres. */
const TURN_ARRIVE: number = 0.05;

/**
 * The steady walking speed of the average man at the normal pace, m/s: the
 * Froude speed's band at his hip height.
 */
const STEADY: readonly [number, number] = [1.27, 1.46];
