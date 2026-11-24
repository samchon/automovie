import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRitual,
  AutoMovieMotionHumanTouch,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

const { AutoMovieMotionHumanTouchEffector } = AutoMovieMotionHumanTouch;

const { touchEffectors } = AutoMovieMotionHumanTouch;

/** The touch contract's contact bound, metres. */
const TOUCH: number = 0.01;

/** A floor contact's bound above the floor, metres (the foot's bearing band). */
const FLOOR: number = HumanFoot.BEARING;

/**
 * How much farther than a thigh's length behind the standing heel the
 * genuflecting knee may land, metres (provisional: the heel's own depth).
 */
const BESIDE: number = 0.06;

/**
 * The devotional compositions place each touch and knee as their rites ask.
 *
 * Scenarios, on the average man and the small woman:
 *
 * 1. A Latin sign of the cross touches the forehead, the sternum, the left then
 *    the right shoulder with the right fingertips, each within 10 mm at its
 *    touch and in that order; the Byzantine rite crosses right then left.
 * 2. A genuflection brings the right knee to the floor within a thigh's length
 *    behind the left heel, the half kneel's front shank upright, while the left
 *    foot stays planted, and rises.
 * 3. A kneeling prayer rests both knees on the floor with the palms together.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three acts and what each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed fingertips, knees, soles and palms of public performances at the acts' own events; a touch off its region or out of order, a knee off the floor or far from the heel, a lifted standing foot or apart palms fails.
 * @evidence contracts/development/testing.md#independent-expectations The orders are the rites'; the 10 mm touch bound is the touch contract's and the floor band the foot's bearing band.
 * @evidence contracts/development/testing.md#distinguishing-cases Both rites, both acts that kneel, two body sizes; the touch and kneel laws' own fitting is their specifications'.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory performance through the public chain on canonical bodies.
 */
export function test_motion_ritual_basic(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const fit of ["m-average", "f-small"] as const) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(fit);
      for (const [rite, order] of [
        ["latin", ["forehead", "sternum", "shoulderLeft", "shoulderRight"]],
        ["byzantine", ["forehead", "sternum", "shoulderRight", "shoulderLeft"]],
      ] as const) {
        const film: HumanPerformance = perform(
          body,
          AutoMovieMotionHumanRitual.signOfCross(HumanChain.subject("a"), {
            hand: "right",
            rite,
          }),
        );
        verdict(checks, `${fit} ${rite} sign of the cross`, film);
        const touches: IAutoMovieMotionHumanSegment[] = film
          .segments("a")
          .filter(
            (segment: IAutoMovieMotionHumanSegment): boolean =>
              segment.name === "touch",
          );
        checks.equals(`${fit} ${rite}: four touches`, touches.length, 4);
        order.forEach((region: AutoMovieHumanoidRegion, i: number): void => {
          const at: number = event(touches[i]!, "ready");
          const miss: number = gap(film, body, region, at);
          checks.check(
            `${fit} ${rite}: touch ${i + 1} on the ${region} (${(1000 * miss).toFixed(1)} mm)`,
            miss <= AutoMovieMotionHumanRitual.SITE + TOUCH &&
              (i === 0 || at > event(touches[i - 1]!, "ready")),
          );
        });
      }

      const genuflect: HumanPerformance = perform(
        body,
        AutoMovieMotionHumanRitual.genuflect(HumanChain.subject("a"), {}),
      );
      verdict(checks, `${fit} genuflection`, genuflect);
      const bow: IAutoMovieMotionHumanSegment = genuflect.segments("a")[0]!;
      const down: number = event(bow, "settled");
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        genuflect.bones("a", down);
      const knee: IAutoMovieResolvedBone = bones.get("rightLowerLeg")!;
      const heel: IAutoMovieMotionHumanFoot.ISocket = HumanFoot.sockets(
        body,
        bones,
        "left",
      ).find(
        ({ socket }: IAutoMovieMotionHumanFoot.ISocket): boolean =>
          socket === "heel",
      )!;
      const behind: number = Math.hypot(
        knee.worldPosition.x - heel.point.x,
        knee.worldPosition.z - heel.point.z,
      );
      checks.check(
        `${fit}: the right knee is down ${(knee.worldPosition.y * 1000).toFixed(1)} mm high, ${(behind * 1000).toFixed(1)} mm from the left heel`,
        knee.worldPosition.y <= body.measure.stature * 0.05 &&
          behind <= body.measure.thigh + BESIDE,
      );
      checks.check(
        `${fit}: the left foot stays planted and the genuflection rises`,
        Math.abs(heel.point.y) <= FLOOR &&
          bow.plan.events.some(
            (item: IAutoMovieMotionEvent): boolean => item.name === "stood",
          ),
      );

      const prayer: HumanPerformance = perform(
        body,
        AutoMovieMotionHumanRitual.kneelingPrayer(HumanChain.subject("a"), {
          hold: 2,
        }),
      );
      verdict(checks, `${fit} kneeling prayer`, prayer);
      const kneel: IAutoMovieMotionHumanSegment = prayer.segments("a")[0]!;
      const held: number = event(kneel, "settled") + 1;
      const posed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        prayer.bones("a", held);
      const palm = (region: AutoMovieHumanoidRegion) =>
        resolveAutoMovieHumanoidSurfaces.place(
          body.surfaces.regions[region],
          posed.get(body.surfaces.regions[region].bone)!,
        ).point;
      checks.check(
        `${fit}: both knees rest on the floor with the palms together`,
        posed.get("leftLowerLeg")!.worldPosition.y <=
          body.measure.stature * 0.05 &&
          posed.get("rightLowerLeg")!.worldPosition.y <=
            body.measure.stature * 0.05 &&
          Vector3.distance(palm("palmLeft"), palm("palmRight")) <= 2 * TOUCH,
      );
    } catch (error: unknown) {
      checks.check(`${String(fit)}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.assert("ritual basic");
}

/** One performer `a` at the origin. */
function perform(
  body: IAutoMovieMotionHumanBody,
  chain: IAutoMovieMotionHumanChain,
): HumanPerformance {
  return new HumanPerformance({
    seed: "ritual",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: chain.node,
  });
}

/** The film second of a segment's named event. */
function event(segment: IAutoMovieMotionHumanSegment, name: string): number {
  return (
    segment.start +
    segment.plan.duration *
      segment.plan.events.find(
        (item: IAutoMovieMotionEvent): boolean => item.name === name,
      )!.share
  );
}

/**
 * How far the right fingertips are from one of the performer's own regions,
 * metres.
 */
function gap(
  film: HumanPerformance,
  body: IAutoMovieMotionHumanBody,
  region: AutoMovieHumanoidRegion,
  t: number,
): number {
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = film.bones(
    "a",
    t,
  );
  const frame = body.surfaces.regions[region];
  return Vector3.distance(
    AutoMovieMotionHumanTouchEffector.point(
      body,
      bones,
      "right",
      touchEffectors.TABLE.fingertips,
    ),
    resolveAutoMovieHumanoidSurfaces.place(frame, bones.get(frame.bone)!).point,
  );
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
