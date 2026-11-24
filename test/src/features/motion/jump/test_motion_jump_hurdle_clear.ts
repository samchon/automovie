import { createHurdle } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieComposition,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAcrobatics,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { motionHumanBody } from "../../internal/motionHumanBody";

/** The planted-contact bound, metres (the campaign's 5 mm). */
const PLANT: number = 0.005;

/** The authored take-off distance before the hurdle, metres: inside McDonald and Dapena's 2.0 to 2.2 m. */
const BEFORE: number = 2.1;

/**
 * Clear a hurdle out of a run and take the run on from the lead foot.
 *
 * Scenarios:
 * 1. The run is cut at a left footfall 2.1 m before a women's 400 m hurdle;
 *    the left foot holds its toes' joint within 5 mm until `takeoff`.
 * 2. Each swinging foot's sole passes the bar's middle plane above its top,
 *    and the hips are above the top at `clear`.
 * 3. The right (lead) foot lands beyond the bar and holds within 5 mm from
 *    `touchdown` into the following run's stance, and the run that follows
 *    keeps at least 70 % of the approach speed half a second on, with the
 *    hips moving less than 20 mm between millisecond samples across both
 *    cuts.
 * 4. A footfall 1.2 m before the hurdle is refused on `approach`; a men's
 *    110 m hurdle the run cannot lift the trail foot over is refused on
 *    `hurdle`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cut, the clearance, the landing, the continued run and the refusals with their bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Composes run, clearance and run through the public chain over a real hurdle model and measures displayed feet and hips.
 * @evidence contracts/development/testing.md#independent-expectations The bar height and depth are the archetype's, the take-off distance band is McDonald and Dapena's, and the 5 mm and 20 mm bounds are the campaign's contact and continuity tolerances.
 * @evidence contracts/development/testing.md#distinguishing-cases An admitted take-off beside one too close and a hurdle too high for the run.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on the shared Human fixture, without a render or external process.
 */
export function test_motion_jump_hurdle_clear(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const low: ReturnType<typeof createHurdle> = createHurdle({
    kind: "women400",
  });
  const plain: HumanPerformance = stage(body, low, 40, undefined);
  const run: IAutoMovieMotionHumanSegment = plain.segments("a")[1]!;

  // The left footfall nearest 12 m down the runway.
  let cut: string = "";
  let ankle: number = 0;
  let best: number = Infinity;
  for (const event of run.plan.events) {
    if (!event.name.startsWith("leftHeelStrike")) continue;
    const at: number = run.start + event.share * run.plan.duration + 1e-3;
    const z: number = plain.bones("a", at).get("leftFoot")!.worldPosition.z;
    if (Math.abs(z - 12) < best) {
      best = Math.abs(z - 12);
      cut = event.name;
      ankle = z;
    }
  }
  const near: number = ankle + BEFORE;
  const film: HumanPerformance = stage(body, low, near, cut);
  assertTakeClean("hurdle clear", film);
  const [, approach, clear, after]: readonly IAutoMovieMotionHumanSegment[] =
    film.segments("a");
  TestValidator.predicate(
    "the run is cut into the clearance and taken on by a run",
    approach?.name === "run" &&
      clear?.name === "hurdleClear" &&
      after?.name === "run",
  );

  // 1. The take-off.
  const takeoff: number = when(clear!, "takeoff");
  const touchdown: number = when(clear!, "touchdown");
  const pushed: number = Vector3.distance(
    socket(film, body, clear!.start, "left", "mtp"),
    socket(film, body, takeoff - 1e-3, "left", "mtp"),
  );
  TestValidator.predicate(
    `the left foot holds its toes' joint through the take-off (${(pushed * 1000).toFixed(1)} mm)`,
    pushed <= PLANT,
  );

  // 2. Over the bar.
  const top: number = low.affordance("top").frame.translation.y;
  const depth: number = createHurdle.BAR_DEPTH;
  const middle: number = near + depth / 2;
  // Each sole point is read where it itself crosses the bar's middle
  // plane, sampled every 2 ms.
  for (const side of ["left", "right"] as const)
    for (const point of ["heel", "toe"] as const) {
      let lowest: number = Infinity;
      for (let t: number = takeoff; t < touchdown; t += 0.002) {
        const a: IAutoMovieVector3 = socket(film, body, t, side, point);
        const b: IAutoMovieVector3 = socket(film, body, t + 0.002, side, point);
        if ((a.z - middle) * (b.z - middle) <= 0)
          lowest = Math.min(lowest, a.y, b.y);
      }
      TestValidator.predicate(
        `the ${side} ${point} passes the bar's plane above its top (${lowest.toFixed(3)} of ${top.toFixed(3)} m)`,
        lowest !== Infinity && lowest > top,
      );
    }
  const hips: number = film.bones("a", when(clear!, "clear")).get("hips")!
    .worldPosition.y;
  TestValidator.predicate(
    `the hips are over the bar at the crossing (${hips.toFixed(3)} m)`,
    hips > top,
  );

  // 3. The landing and the continued run.
  const landed: IAutoMovieVector3 = socket(
    film,
    body,
    touchdown + 1e-3,
    "right",
    "mtp",
  );
  const held: number = Vector3.distance(
    landed,
    socket(film, body, after!.start + 0.03, "right", "mtp"),
  );
  TestValidator.predicate(
    `the lead foot lands beyond the bar and bears into the run (${(held * 1000).toFixed(1)} mm)`,
    landed.z > near + depth && held <= PLANT,
  );
  const speed: (t: number) => number = (t: number): number =>
    (film.bones("a", t + 0.05).get("hips")!.worldPosition.z -
      film.bones("a", t).get("hips")!.worldPosition.z) /
    0.05;
  // The run that takes the stride on keeps running: the hips never slow
  // to a walk's preferred 1.4 m/s (Bohannon 1997) over the next 0.5 s.
  let slowest: number = Infinity;
  for (let t: number = touchdown; t <= touchdown + 0.5; t += 0.05)
    slowest = Math.min(slowest, speed(t));
  TestValidator.predicate(
    `the run takes the stride on without slowing to a walk (${slowest.toFixed(2)} m/s)`,
    slowest > 1.4,
  );
  let jump: number = 0;
  for (const cutAt of [clear!.start, after!.start])
    for (let t: number = cutAt - 0.01; t < cutAt + 0.01; t += 0.001)
      jump = Math.max(
        jump,
        Vector3.distance(
          film.bones("a", t).get("hips")!.worldPosition,
          film.bones("a", t + 0.001).get("hips")!.worldPosition,
        ),
      );
  TestValidator.predicate(
    `the hips move continuously across both cuts (${(jump * 1000).toFixed(1)} mm per ms)`,
    jump <= 0.02,
  );

  // 4. Refusals.
  const refused: (
    hurdle: ReturnType<typeof createHurdle>,
    at: number,
  ) => HumanRefusal | undefined = (
    hurdle: ReturnType<typeof createHurdle>,
    at: number,
  ): HumanRefusal | undefined => {
    try {
      stage(body, hurdle, at, cut);
    } catch (error) {
      if (error instanceof HumanRefusal) return error;
      throw error;
    }
    return undefined;
  };
  TestValidator.predicate(
    "a take-off too close to the hurdle is refused",
    refused(low, ankle + 1.2)?.axis === "approach",
  );
  TestValidator.predicate(
    "a hurdle too high for the run is refused",
    refused(createHurdle({ kind: "men110" }), near)?.axis === "hurdle",
  );
}

/** A run down the runway past a hurdle, cut into its clearance and run on when a footfall is given. */
function stage(
  body: IAutoMovieMotionHumanBody,
  hurdle: ReturnType<typeof createHurdle>,
  near: number,
  cut: string | undefined,
): HumanPerformance {
  const running: ReturnType<typeof HumanChain.subject> = HumanChain.subject("a")
    .stand({ hold: 0.3, sway: 0 })
    .run({ to: { x: 0, y: 0, z: 30 }, pace: "run" });
  const node: IAutoMovieComposition =
    cut === undefined
      ? running.node
      : running
          .until({ event: cut })
          .registered("hurdleClear", { hurdle: "hurdle" })
          .run({ to: { x: 0, y: 0, z: near + 12 }, pace: "run" }).node;
  return new HumanPerformance({
    seed: "hurdle",
    laws: [AutoMovieMotionHumanAcrobatics.HumanGymnastics.hurdleClear],
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
      HumanObject.prop("hurdle", hurdle, {
        at: { x: 0, y: 0, z: near },
        yaw: 0,
      }),
    ],
    composition: node,
  });
}

/** The absolute film second of a required event. */
function when(segment: IAutoMovieMotionHumanSegment, name: string): number {
  const event:
    | IAutoMovieMotionHumanSegment["plan"]["events"][number]
    | undefined = segment.plan.events.find(
    (
      candidate: IAutoMovieMotionHumanSegment["plan"]["events"][number],
    ): boolean => candidate.name === name,
  );
  if (event === undefined)
    throw new Error(segment.name + " has no " + name + " event");
  return segment.start + event.share * segment.plan.duration;
}

/** A displayed foot socket at a film second. */
function socket(
  film: HumanPerformance,
  body: IAutoMovieMotionHumanBody,
  time: number,
  side: AutoMovieHumanSide,
  point: Parameters<typeof HumanFoot.point>[2],
): IAutoMovieVector3 {
  const foot: IAutoMovieResolvedBone = film
    .bones("a", time)
    .get(`${side}Foot`)!;
  return HumanFoot.point(body, side, point, {
    ankle: foot.worldPosition,
    rotation: foot.worldRotation,
  });
}
