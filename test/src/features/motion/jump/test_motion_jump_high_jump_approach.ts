import { createHighJump, createLandingMat } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieComposition,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanRun,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAcrobatics,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * The crossbar's world height and plane, metres: createHighJump's bar at 1.415
 * m standing at z = BAR_Z.
 */
const BAR_Z: number = 3.4;

/** The planted-contact bound, metres (the campaign's 5 mm). */
const PLANT: number = 0.005;

/**
 * Carry a curved run-up into a Fosbury flop's take-off, flight and landing.
 *
 * Scenarios:
 *
 * 1. A sprint curves left over its last strides (its footfalls turn the heading by
 *    more than 25 degrees) and each of the run's last three planted feet holds
 *    within 5 mm through its stance.
 * 2. Cut at the left foot's footfall with the bar's plane on the runner's right,
 *    the flop takes off from that same left foot, which stays within 5 mm of
 *    the run's footfall until `takeoff`.
 * 3. The centre crosses the crossbar's plane between take-off and touchdown, peaks
 *    at the bar's height within 10 mm, and the back comes down on the mat.
 * 4. The same run cut at the right foot's footfall, the foot nearer the bar, is
 *    refused on `takeoffFoot`; a jog cut at its left footfall cannot bring the
 *    horizontal speed the landing asks and is refused on `to`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the run-up, take-off foot, flight, landing and refusal cases and their bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Composes run and flop through the public chain and measures displayed ankles, centre of mass, events and contact windows.
 * @evidence contracts/development/testing.md#independent-expectations The far-foot take-off is Dapena's rule, the bar plane and height are the archetype's, the 5 mm and 10 mm bounds are the campaign's contact and centre tolerances, and a jog's speed is the run law's documented 2.4 m/s band.
 * @evidence contracts/development/testing.md#distinguishing-cases The admitted left-foot cut beside a near-foot cut and a slow approach with the same landing.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on the shared Human fixture, without a render or external process.
 */
export function test_motion_jump_high_jump_approach(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const bar: ReturnType<typeof createHighJump> = createHighJump({
    kind: "highJump",
    height: 1.415,
    diameter: 0.03,
  });
  const mat: ReturnType<typeof createLandingMat> = createLandingMat({
    kind: "highJump",
  });
  const matTop: number = mat.affordance("surface").frame.translation.y;
  const landing: IAutoMovieVector3 = { x: 0, y: matTop, z: BAR_Z + 1.2 };

  // A J-shaped run-up from the runner's right of the bar: straight toward
  // the bar, then a left curve of 5 m radius whose 40 degree point lies 0.9 m
  // before the bar's plane, where a flop takes off.
  const arc = (degrees: number): IAutoMovieVector3 => {
    const a: number = (degrees * Math.PI) / 180;
    return { x: 2.5 - 5 * Math.cos(a), y: 0, z: -0.71 + 5 * Math.sin(a) };
  };
  const course: IAutoMovieMotionHumanRun.IParams = {
    pace: "sprint",
    via: [{ x: -2.5, y: 0, z: -0.71 }, arc(15), arc(30)],
    to: arc(70),
  };

  /** Stage the run, optionally cut at a footfall into the flop. */
  const take = (
    run: IAutoMovieMotionHumanRun.IParams,
    cut?: string,
  ): HumanPerformance => {
    const chain: ReturnType<typeof HumanChain.subject> = HumanChain.subject("a")
      .stand({ hold: 0.3, sway: 0 })
      .run(run);
    const node: IAutoMovieComposition =
      cut === undefined
        ? chain.node
        : chain
            .until({ event: cut })
            .registered("fosburyFlop", { bar: "bar", on: "mat", to: landing })
            .node;
    return new HumanPerformance({
      seed: "high-jump-approach",
      laws: [AutoMovieMotionHumanAcrobatics.HumanGymnastics.fosburyFlop],
      performers: [
        {
          subject: "a",
          body,
          at: { x: -2.5, y: 0, z: -7 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        HumanObject.prop("bar", bar, { at: { x: 0, y: 0, z: BAR_Z }, yaw: 0 }),
        HumanObject.prop("mat", mat, {
          at: { x: 0, y: 0, z: BAR_Z + 1.5 },
          yaw: 0,
        }),
      ],
      composition: node,
    });
  };

  // The cut is a footfall nearest the end of the curve; the run alone shows
  // where its footfalls fall.
  const strike = (
    run: IAutoMovieMotionHumanRun.IParams,
    side: AutoMovieHumanSide,
  ): string => {
    const plain: IAutoMovieMotionHumanSegment = take(run).segments("a")[1]!;
    const target: IAutoMovieVector3 = arc(40);
    let best: string = "";
    let distance: number = Infinity;
    for (const event of plain.plan.events) {
      if (!event.name.startsWith(`${side}HeelStrike`)) continue;
      const at: IAutoMovieVector3 = plain.plan.posture(
        event.share * plain.plan.duration,
      ).root;
      const d: number = Math.hypot(at.x - target.x, at.z - target.z);
      if (d < distance) {
        distance = d;
        best = event.name;
      }
    }
    return best;
  };
  const leftCut: string = strike(course, "left");
  const film: HumanPerformance = take(course, leftCut);
  assertTakeClean("high jump approach", film);
  const [, run, flop]: readonly IAutoMovieMotionHumanSegment[] =
    film.segments("a");
  TestValidator.predicate(
    "the run is cut into the flop",
    run?.name === "run" && flop?.name === "fosburyFlop",
  );

  // 1. The curve and the planted stances of the run's last steps.
  const plants: IAutoMovieMotionHumanContactWindow[] = run!.plan.contacts
    .filter(
      (c: IAutoMovieMotionHumanContactWindow): boolean =>
        c.kind === "plant" &&
        run!.start + c.from * run!.plan.duration < flop!.start - 1e-6,
    )
    .sort(
      (
        a: IAutoMovieMotionHumanContactWindow,
        b: IAutoMovieMotionHumanContactWindow,
      ): number => a.from - b.from,
    )
    .slice(-3);
  for (const c of plants) {
    const from: number = run!.start + c.from * run!.plan.duration + 1e-3;
    const to: number =
      Math.min(run!.start + c.to * run!.plan.duration, flop!.start) - 1e-3;
    const side: AutoMovieHumanSide = c.part === "leftFoot" ? "left" : "right";
    const slip: number = Vector3.distance(
      mtp(film, body, from, side),
      mtp(film, body, to, side),
    );
    TestValidator.predicate(
      `the run's ${c.part} stance from ${from.toFixed(2)} s holds its forefoot pivot (${(slip * 1000).toFixed(1)} mm)`,
      slip <= PLANT,
    );
  }
  // The hips' heading of travel over 0.15 s on the straight and into the cut.
  const heading: (at: number) => number = (at: number): number => {
    const a: IAutoMovieVector3 = film
      .bones("a", at - 0.15)
      .get("hips")!.worldPosition;
    const b: IAutoMovieVector3 = film.bones("a", at).get("hips")!.worldPosition;
    return (Math.atan2(b.x - a.x, b.z - a.z) * 180) / Math.PI;
  };
  const turn: number =
    heading(flop!.start) -
    heading(run!.start + 0.6 * (flop!.start - run!.start));
  TestValidator.predicate(
    `the run-up curves left by ${turn.toFixed(1)} degrees before the take-off`,
    turn > 25,
  );

  // 2. The take-off foot is the run's last footfall.
  const takeoff: number = when(flop!, "takeoff");
  const support: IAutoMovieMotionHumanContactWindow | undefined =
    flop!.plan.contacts.find(
      (c: IAutoMovieMotionHumanContactWindow): boolean => c.from === 0,
    );
  const pushed: number = Vector3.distance(
    mtp(film, body, flop!.start, "left"),
    mtp(film, body, takeoff - 1e-3, "left"),
  );
  TestValidator.predicate(
    `the flop pushes off the left foot the run planted (${support?.part}, ${(pushed * 1000).toFixed(1)} mm)`,
    support?.part === "leftFoot" && pushed <= PLANT,
  );

  // 3. Flight over the bar and the landing.
  const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
    film,
    "a",
    body,
    0,
  );
  const crossing: number = when(flop!, "barCrossing");
  TestValidator.predicate(
    "the centre crosses the bar's plane in flight and peaks at its height",
    takeoff < crossing &&
      crossing < when(flop!, "touchdown") &&
      Math.abs(HumanSignature.centre(reader, crossing).z - BAR_Z) <= 0.01 &&
      Math.abs(
        HumanSignature.centre(reader, when(flop!, "apex")).y -
          bar.affordance("bar").frame.translation.y,
      ) <= 0.01,
  );
  const lie: IAutoMovieMotionHumanContactWindow | undefined =
    flop!.plan.contacts.find(
      (c: IAutoMovieMotionHumanContactWindow): boolean => c.part === "back",
    );
  TestValidator.predicate(
    "the back comes down on the mat",
    lie?.support.kind === "prop" && lie.support.subject === "mat",
  );

  // 4. Unsuitable approaches.
  const refusal = (
    run: IAutoMovieMotionHumanRun.IParams,
    cut: string,
  ): HumanRefusal | undefined => {
    try {
      take(run, cut);
    } catch (error) {
      if (error instanceof HumanRefusal) return error;
      throw error;
    }
    return undefined;
  };
  const near: HumanRefusal | undefined = refusal(
    course,
    strike(course, "right"),
  );
  TestValidator.predicate(
    "a take-off from the foot nearer the bar is refused",
    near?.axis === "takeoffFoot",
  );
  const jog: IAutoMovieMotionHumanRun.IParams = { ...course, pace: "jog" };
  const slow: HumanRefusal | undefined = refusal(jog, strike(jog, "left"));
  TestValidator.predicate(
    "a jog cannot bring the horizontal speed the landing asks",
    slow?.axis === "to",
  );
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

/**
 * One displayed metatarsophalangeal axis point at a film second: the forefoot
 * rocker's pivot a run's stance holds.
 */
function mtp(
  film: HumanPerformance,
  body: IAutoMovieMotionHumanBody,
  time: number,
  side: AutoMovieHumanSide,
): IAutoMovieVector3 {
  const foot: IAutoMovieResolvedBone = film
    .bones("a", time)
    .get(`${side}Foot`)!;
  return HumanFoot.point(body, side, "mtp", {
    ankle: foot.worldPosition,
    rotation: foot.worldRotation,
  });
}
