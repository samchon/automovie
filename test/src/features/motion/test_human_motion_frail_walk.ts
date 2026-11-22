import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import {
  HumanChain,
  HumanFrailWalk,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../internal/assertTakeClean";
import { motionHumanBody } from "../internal/motionHumanBody";

/** How far each walk goes, metres. */
const DISTANCE: number = 3;

/** The grades walked, from the ordinary walk to a shuffle. */
const GRADES: readonly number[] = [0, 0.5, 1];

/** How close the ungraded frail walk keeps to the ordinary walk's time, seconds. */
const SAME: number = 1e-6;

/**
 * The walk of a frail older person (#4009), graded by severity.
 *
 * Scenarios, on the average man and the small woman, each take clean:
 * 1. Severity 0 is the ordinary walk: the same time over the same way.
 * 2. As the severity grows the walk takes longer and more steps over the same
 *    way on a wider base, and the trunk leans further forward.
 * 3. A severity outside 0 to 1 is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cases and what each reads.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the plans' durations and heel strikes and the displayed chest's lean; a frail walk as fast as the ordinary one, as few steps, an upright trunk or an admitted out-of-range grade fails.
 * @evidence contracts/development/testing.md#independent-expectations Speed and step length fall and the lean grows with frailty (Studenski et al. 2011; Winter et al. 1990); the ordinary walk is the walk law itself.
 * @evidence contracts/development/testing.md#distinguishing-cases Three grades on two bodies, the ordinary walk and the refusal.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain.
 */
export function test_human_motion_frail_walk(): void {
  for (const fit of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(fit);
    const ordinary: HumanPerformance = perform(
      body,
      HumanChain.subject("a").walk({ to: { x: 0, y: 0, z: DISTANCE } }),
    );
    const films: HumanPerformance[] = GRADES.map(
      (severity: number): HumanPerformance =>
        perform(
          body,
          HumanChain.subject("a").registered(HumanFrailWalk.frailWalk.name, {
            to: { x: 0, y: 0, z: DISTANCE },
            severity,
          }),
        ),
    );
    films.forEach((film: HumanPerformance, i: number): void =>
      assertTakeClean(`${fit} frail walk at ${GRADES[i]}`, film),
    );
    TestValidator.predicate(
      `${fit}: severity 0 walks as the ordinary walk`,
      Math.abs(walked(films[0]!).plan.duration - walked(ordinary).plan.duration) <=
        SAME,
    );
    const times: number[] = films.map(
      (film: HumanPerformance): number => walked(film).plan.duration,
    );
    const steps: number[] = films.map(
      (film: HumanPerformance): number =>
        walked(film).plan.events.filter((event: IAutoMovieMotionEvent): boolean =>
          event.name.includes("HeelStrike"),
        ).length,
    );
    const leans: number[] = films.map((film: HumanPerformance): number => {
      const chest: IAutoMovieResolvedBone = film.bones("a", film.duration / 2).get("chest")!;
      const hips: IAutoMovieResolvedBone = film.bones("a", film.duration / 2).get("hips")!;
      return Math.atan2(
        chest.worldPosition.z - hips.worldPosition.z,
        chest.worldPosition.y - hips.worldPosition.y,
      );
    });
    TestValidator.predicate(
      `${fit}: frailer walks take longer (${times.map((t: number): string => t.toFixed(2)).join(", ")} s)`,
      times[0]! < times[1]! && times[1]! < times[2]!,
    );
    TestValidator.predicate(
      `${fit}: frailer walks take more steps (${steps.join(", ")})`,
      steps[0]! <= steps[1]! && steps[1]! < steps[2]!,
    );
    TestValidator.predicate(
      `${fit}: frailer walks lean further forward`,
      leans[0]! < leans[1]! && leans[1]! < leans[2]!,
    );
    // The base: the feet's mean side-to-side distance at the heel strikes.
    const widths: number[] = films.map((film: HumanPerformance): number => {
      const strikes: number[] = walked(film)
        .plan.events.filter((event: IAutoMovieMotionEvent): boolean =>
          event.name.includes("HeelStrike"),
        )
        .map(
          (event: IAutoMovieMotionEvent): number =>
            event.share * walked(film).plan.duration,
        );
      return (
        strikes.reduce((sum: number, t: number): number => {
          const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
            film.bones("a", t);
          return (
            sum +
            Math.abs(
              bones.get("leftFoot")!.worldPosition.x -
                bones.get("rightFoot")!.worldPosition.x,
            )
          );
        }, 0) / Math.max(1, strikes.length)
      );
    });
    TestValidator.predicate(
      `${fit}: frailer walks walk on a wider base (${widths.map((w: number): string => (w * 1000).toFixed(0)).join(", ")} mm)`,
      widths[0]! < widths[1]! && widths[1]! < widths[2]!,
    );
    TestValidator.predicate(
      `${fit}: a severity past 1 is refused`,
      ((): boolean => {
        try {
          perform(
            body,
            HumanChain.subject("a").registered(HumanFrailWalk.frailWalk.name, {
              to: { x: 0, y: 0, z: DISTANCE },
              severity: 1.5,
            }),
          ).bones("a", 1);
          return false;
        } catch (error: unknown) {
          return error instanceof HumanRefusal;
        }
      })(),
    );
  }
}

/** One performer `a` at the origin facing +Z. */
function perform(
  body: IAutoMovieMotionHumanBody,
  chain: IAutoMovieMotionHumanChain,
): HumanPerformance {
  return new HumanPerformance({
    seed: "frail walk",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    laws: [HumanFrailWalk.frailWalk],
    composition: chain.node,
  });
}

/** The performer's walking segment. */
function walked(film: HumanPerformance): IAutoMovieMotionHumanSegment {
  return film.segments("a")[0]!;
}
