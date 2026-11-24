import { createLandingMat, createStairs } from "@automovie/archetypes";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanStuntFall,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanFall,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanRefusal } from "../../../features/internal/motionHumanRefusal";

/** The hips' largest height over a surface they lie or sit on, metres. */
const LYING: number = 0.3;

/** The feet's largest height over a floor they stand on, metres. */
const STOOD: number = 0.03;

/** Where the performer stands. */
interface IStand {
  /** Floor point, world metres. */
  at: IAutoMovieVector3;

  /** Yaw, degrees. */
  yaw: number;
}

/**
 * Stunt falls (#3977).
 *
 * Scenarios, on the average man and the small woman:
 * 1. A tumble from the top tread touches each lower tread in order, its
 *    hips passing over each, and ends lying on the floor past the flight;
 *    a seat slide ends sitting there; a tumble with one tread below is
 *    refused.
 * 2. A high fall from the top landing onto a landing mat first touches the
 *    mat inside its top and ends lying on it; with a descender it ends
 *    standing on the floor; a pad the flight misses is refused.
 * Every take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each fall, the checks and the refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed hips and feet at the plan's contact events against the treads, the mat and the floor, and the take through the shipped verdicts.
 * @evidence contracts/development/testing.md#independent-expectations The treads' and the mat's places are the props' own affordances.
 * @evidence contracts/development/testing.md#distinguishing-cases Tumble, slide, free fall and descender, each with its refusal, on two bodies.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain.
 */
export function test_motion_fall_stunt_fall(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const flight = createStairs({ steps: 20, riser: 0.178, tread: 0.3 });
  const steps: IAutoMovieAffordance[] = flight.affordances
    .filter((a: IAutoMovieAffordance): boolean => /^step\d+$/.test(a.id))
    .sort(
      (a: IAutoMovieAffordance, b: IAutoMovieAffordance): number =>
        a.frame.translation.y - b.frame.translation.y,
    );
  const stairs: IAutoMovieMotionHumanProp = HumanObject.prop("stairs", flight, {
    at: { x: 0, y: 0, z: 0 },
    yaw: 0,
    fixed: true,
  });
  const lowest: IAutoMovieVector3 = steps[0]!.frame.translation;
  const highest: IAutoMovieVector3 = steps.at(-1)!.frame.translation;
  const downhill: number =
    (Math.atan2(lowest.x - highest.x, lowest.z - highest.z) * 180) / Math.PI;
  const landing: IAutoMovieVector3 = flight.affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === "landing",
  )!.frame.translation;
  // The mat beside the top landing, off its +X side.
  const mat = createLandingMat({ kind: "highJump" });
  const matTop: number = mat.affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === "surface",
  )!.frame.translation.y;
  const pad: IAutoMovieMotionHumanProp = HumanObject.prop("mat", mat, {
    at: { x: landing.x + 2.8, y: 0, z: landing.z },
    yaw: 0,
    fixed: true,
  });
  const away: IAutoMovieMotionHumanProp = HumanObject.prop("away", mat, {
    at: { x: landing.x + 20, y: 0, z: landing.z },
    yaw: 0,
    fixed: true,
  });
  const props: IAutoMovieMotionHumanProp[] = [stairs, pad, away];
  for (const fit of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(fit);
    const perform = (
      stand: IStand,
      p: IAutoMovieMotionHumanStuntFall.IParams,
    ): HumanPerformance =>
      new HumanPerformance({
        seed: "stunt-fall",
        performers: [
          {
            subject: "a",
            body,
            at: stand.at,
            yaw: stand.yaw,
            proficiency: { level: "trained" },
          },
        ],
        props,
        laws: [AutoMovieMotionHumanFall.HumanStuntFall.stuntFall],
        composition: HumanChain.subject("a").registered("stuntFall", p).node,
      });
    const onTread = (k: number): IStand => ({
      at: { ...steps[k]!.frame.translation },
      yaw: downhill,
    });

    // 1. The tumble and the slide.
    for (const slide of [false, true])
      try {
        const take: HumanPerformance = perform(onTread(5), {
          kind: "stairs",
          stairs: "stairs",
          slide,
        });
        const label: string = `${fit} ${slide ? "seat slide" : "tumble"}`;
        assertTakeClean(label, take);
        const fall: IAutoMovieMotionHumanSegment = take
          .segments("a")
          .find(
            (s: IAutoMovieMotionHumanSegment): boolean =>
              s.law.name === "stuntFall",
          )!;
        const touches: IAutoMovieMotionEvent[] = fall.plan.events.filter(
          (e: IAutoMovieMotionEvent): boolean => /Contact$/.test(e.name),
        );
        all.check(
          `${label} touches the five treads below in descending order`,
          touches
            .map((e: IAutoMovieMotionEvent): string => e.name)
            .join(",") ===
            steps
              .slice(0, 5)
              .reverse()
              .map((a: IAutoMovieAffordance): string => `${a.id}Contact`)
              .join(","),
        );
        for (const touch of touches) {
          const tread: IAutoMovieAffordance = steps.find(
            (a: IAutoMovieAffordance): boolean =>
              `${a.id}Contact` === touch.name,
          )!;
          const hips: IAutoMovieVector3 = take
            .bones("a", fall.start + touch.share * (fall.end - fall.start))
            .get("hips")!.worldPosition;
          all.check(
            `${label}: the hips pass over ${tread.id} (${(hips.y - tread.frame.translation.y).toFixed(3)} m above it)`,
            hips.y - tread.frame.translation.y <= LYING + 0.15,
          );
        }
        const rest: IAutoMovieVector3 = take
          .bones("a", fall.end)
          .get("hips")!.worldPosition;
        all.check(
          `${label} ends low on the floor (hips ${rest.y.toFixed(3)} m)`,
          rest.y <= (slide ? 0.45 : LYING),
        );
      } catch (error: unknown) {
        all.check(
          `${fit} ${slide ? "seat slide" : "tumble"}: ${String(error)}`,
          false,
        );
      }
    all.check(
      `${fit} a tumble with one tread below is refused`,
      motionHumanRefusal(
        () =>
          perform(onTread(1), { kind: "stairs", stairs: "stairs" }).bones(
            "a",
            0.5,
          ),
        {
          kind: "affordance",
          axis: "stairs",
          act: "stuntFall",
        },
      ),
    );

    // 2. The high fall onto the mat, and with a descender.
    const edge: IStand = {
      at: { x: landing.x + 0.4, y: landing.y, z: landing.z },
      yaw: 90,
    };
    try {
      const take: HumanPerformance = perform(edge, {
        kind: "high",
        exit: "step",
        pad: "mat",
      });
      assertTakeClean(`${fit} high fall onto the mat`, take);
      const fall: IAutoMovieMotionHumanSegment = take
        .segments("a")
        .find(
          (s: IAutoMovieMotionHumanSegment): boolean =>
            s.law.name === "stuntFall",
        )!;
      const touch: IAutoMovieMotionEvent = fall.plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === "touchdown",
      )!;
      const hips: IAutoMovieVector3 = take
        .bones("a", fall.start + touch.share * (fall.end - fall.start))
        .get("hips")!.worldPosition;
      all.check(
        `${fit} high fall first touches inside the mat's top`,
        Math.abs(hips.x - (landing.x + 2.8)) <= 2 &&
          Math.abs(hips.z - landing.z) <= 3 &&
          hips.y - matTop <= LYING,
      );
      all.check(
        `${fit} high fall ends lying on the mat`,
        take.bones("a", fall.end).get("hips")!.worldPosition.y - matTop <=
          LYING,
      );
    } catch (error: unknown) {
      all.check(`${fit} high fall onto the mat: ${String(error)}`, false);
    }
    try {
      const take: HumanPerformance = perform(edge, {
        kind: "high",
        descender: 3,
      });
      assertTakeClean(`${fit} descender`, take);
      const end = take.bones("a", take.duration);
      all.check(
        `${fit} descender ends standing on the floor`,
        (["leftToes", "rightToes"] as const).every(
          (b: AutoMovieHumanoidBone): boolean =>
            end.get(b)!.worldPosition.y <= STOOD,
        ),
      );
    } catch (error: unknown) {
      all.check(`${fit} descender: ${String(error)}`, false);
    }
    all.check(
      `${fit} a pad the fall misses is refused`,
      motionHumanRefusal(
        () => perform(edge, { kind: "high", pad: "away" }).bones("a", 0.5),
        {
          kind: "reach",
          axis: "pad",
          act: "stuntFall",
        },
      ),
    );
  }
  all.assert("stunt fall");
}
