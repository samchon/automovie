import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGait,
  AutoMovieMotionHumanSeat,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

/** How far each walk goes, metres. */
const DISTANCE: number = 3;

/** The grades walked, from the ordinary walk to a shuffle. */
const GRADES: readonly number[] = [0, 0.5, 1];

/**
 * The anchor the compared walks share, so they draw one stream of seeded step
 * unevenness.
 */
const STRIDES: string = "strides";

/** How close the ungraded frail walk keeps to the ordinary walk's time, seconds. */
const SAME: number = 1e-6;

/**
 * How far the head may turn ahead of the pelvis in an en-bloc turn, degrees
 * (provisional: the head leads an ordinary turn by about 20 to 30 degrees,
 * Hollands et al. 2004, and en bloc it does not).
 */
const EN_BLOC: number = 10;

/**
 * The walk of a frail older person (#4009), graded by severity.
 *
 * Scenarios, on the average man and the small woman, each take clean:
 *
 * 1. Severity 0 is the ordinary walk: the same time over the same way.
 * 2. As the severity grows the walk takes longer and more steps over the same way
 *    on a wider base, and the trunk leans further forward.
 * 3. A half turn in place takes more steps at full severity, and the head turns
 *    with the pelvis, en bloc.
 * 4. The frail walker sits into an armchair and rises from it with both hands
 *    bearing on its armrests.
 * 5. A severity outside 0 to 1 is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cases and what each reads.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the plans' durations and heel strikes and the displayed chest's lean; a frail walk as fast as the ordinary one, as few steps, an upright trunk or an admitted out-of-range grade fails.
 * @evidence contracts/development/testing.md#independent-expectations Speed and step length fall and the lean grows with frailty (Studenski et al. 2011; Winter et al. 1990); the ordinary walk is the walk law itself.
 * @evidence contracts/development/testing.md#distinguishing-cases Three grades on two bodies, the ordinary walk and the refusal.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain.
 */
export function test_motion_gait_frail_walk(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const fit of ["m-average", "f-small"] as const) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(fit);
      // A step's seeded unevenness is drawn on a stream keyed by the action's
      // anchor, its name when it has none; the walks share one anchor so they
      // draw the same strides and differ only by their laws.
      const ordinary: HumanPerformance = perform(
        body,
        HumanChain.subject("a").walk(
          { to: { x: 0, y: 0, z: DISTANCE } },
          STRIDES,
        ),
      );
      const films: HumanPerformance[] = GRADES.map(
        (severity: number): HumanPerformance =>
          perform(
            body,
            HumanChain.subject("a").registered(
              AutoMovieMotionHumanGait.HumanFrailWalk.frailWalk.name,
              {
                to: { x: 0, y: 0, z: DISTANCE },
                severity,
              },
              STRIDES,
            ),
          ),
      );
      films.forEach((film: HumanPerformance, i: number): void =>
        verdict(checks, `${fit} frail walk at ${GRADES[i]}`, film),
      );
      checks.check(
        `${fit}: severity 0 walks as the ordinary walk`,
        Math.abs(
          walked(films[0]!).plan.duration - walked(ordinary).plan.duration,
        ) <= SAME,
      );
      const times: number[] = films.map(
        (film: HumanPerformance): number => walked(film).plan.duration,
      );
      const steps: number[] = films.map(
        (film: HumanPerformance): number =>
          walked(film).plan.events.filter(
            (event: IAutoMovieMotionEvent): boolean =>
              event.name.includes("HeelStrike"),
          ).length,
      );
      const leans: number[] = films.map((film: HumanPerformance): number => {
        const chest: IAutoMovieResolvedBone = film
          .bones("a", film.duration / 2)
          .get("chest")!;
        const hips: IAutoMovieResolvedBone = film
          .bones("a", film.duration / 2)
          .get("hips")!;
        return Math.atan2(
          chest.worldPosition.z - hips.worldPosition.z,
          chest.worldPosition.y - hips.worldPosition.y,
        );
      });
      checks.check(
        `${fit}: frailer walks take longer (${times.map((t: number): string => t.toFixed(2)).join(", ")} s)`,
        times[0]! < times[1]! && times[1]! < times[2]!,
      );
      checks.check(
        `${fit}: frailer walks take more steps (${steps.join(", ")})`,
        steps[0]! <= steps[1]! && steps[1]! < steps[2]!,
      );
      checks.check(
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
      checks.check(
        `${fit}: frailer walks walk on a wider base (${widths.map((w: number): string => (w * 1000).toFixed(0)).join(", ")} mm)`,
        widths[0]! < widths[1]! && widths[1]! < widths[2]!,
      );
      // A half turn in place: frailer, more steps, and the head turning with
      // the pelvis (en bloc) rather than ahead of it.
      const turns: HumanPerformance[] = [0, 1].map(
        (severity: number): HumanPerformance =>
          perform(
            body,
            HumanChain.subject("a").registered(
              AutoMovieMotionHumanGait.HumanFrailWalk.frailWalk.name,
              {
                to: { x: 0, y: 0, z: 0 },
                face: 180,
                severity,
              },
            ),
          ),
      );
      turns.forEach((film: HumanPerformance, i: number): void =>
        verdict(checks, `${fit} frail half turn at ${i}`, film),
      );
      const turnSteps: number[] = turns.map(
        (film: HumanPerformance): number =>
          walked(film).plan.events.filter(
            (event: IAutoMovieMotionEvent): boolean =>
              event.name.includes("HeelStrike"),
          ).length,
      );
      checks.check(
        `${fit}: a frail half turn takes more steps (${turnSteps.join(", ")})`,
        turnSteps[0]! < turnSteps[1]!,
      );
      const lead: number = Array.from(
        { length: 13 },
        (_v: unknown, k: number): number => {
          const film: HumanPerformance = turns[1]!;
          const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
            film.bones("a", (film.duration * k) / 12);
          const apart: number =
            heading(bones.get("head")!) - heading(bones.get("hips")!);
          return Math.abs((((apart % 360) + 540) % 360) - 180);
        },
      ).reduce((a: number, b: number): number => Math.max(a, b));
      checks.check(
        `${fit}: the frail half turn is en bloc, the head within ${EN_BLOC} degrees of the pelvis (${lead.toFixed(1)})`,
        lead <= EN_BLOC,
      );
      // The frail walker sits into an armchair and rises from it with both
      // hands on its armrests.
      const chair: HumanPerformance = armchair(body);
      verdict(checks, `${fit} frail armchair`, chair);
      for (const name of ["sit", "rise"] as const) {
        const span: IAutoMovieMotionHumanSegment = chair
          .segments("a")
          .find((s: IAutoMovieMotionHumanSegment): boolean => s.name === name)!;
        const bearing: number = span.plan.contacts.filter(
          (w: IAutoMovieMotionHumanContactWindow): boolean =>
            (w.part === "leftHand" || w.part === "rightHand") &&
            (w.kind === "bear" || w.kind === "plant"),
        ).length;
        checks.check(
          `${fit}: the frail walker ${name}s with both hands on the armrests`,
          bearing >= 2,
        );
      }
      checks.check(
        `${fit}: a severity past 1 is refused`,
        ((): boolean => {
          try {
            perform(
              body,
              HumanChain.subject("a").registered(
                AutoMovieMotionHumanGait.HumanFrailWalk.frailWalk.name,
                {
                  to: { x: 0, y: 0, z: DISTANCE },
                  severity: 1.5,
                },
              ),
            ).bones("a", 1);
            return false;
          } catch (error: unknown) {
            return error instanceof HumanRefusal;
          }
        })(),
      );
    } catch (error: unknown) {
      checks.check(`${String(fit)}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.assert("gait frail walk");
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
    laws: [AutoMovieMotionHumanGait.HumanFrailWalk.frailWalk],
    composition: chain.node,
  });
}

/** A frail walk to an armchair 2 m ahead, a sit into it and a rise from it. */
function armchair(body: IAutoMovieMotionHumanBody): HumanPerformance {
  const front: number = 2;
  const height: number = AutoMovieMotionHumanSeat.seated.popliteal(body);
  // Armrests 0.2 m above the seat at the sitter's sides, 0.25 m back from the front edge (provisional armchair).
  const half: number =
    body.measure.hipHalfWidth + body.measure.thighRadius + 0.05;
  const seat: IAutoMovieMotionHumanSeated.ISeat = {
    at: { x: 0, y: height, z: front },
    yaw: 180,
    depth: 0.45,
    back: 0.5,
    armrests: {
      // Facing -Z, the sitter's left is -X.
      left: { x: -half, y: height + 0.2, z: front + 0.25 },
      right: { x: half, y: height + 0.2, z: front + 0.25 },
    },
  };
  return perform(
    body,
    HumanChain.subject("a")
      .registered(AutoMovieMotionHumanGait.HumanFrailWalk.frailWalk.name, {
        to: { x: 0, y: 0, z: front - 0.15 },
        face: 180,
        severity: 1,
      })
      .sit({ seat, hold: 1 })
      .rise(),
  );
}

/** The performer's walking segment. */
function walked(film: HumanPerformance): IAutoMovieMotionHumanSegment {
  return film.segments("a")[0]!;
}

/** A displayed bone's heading about +Y, degrees. */
function heading(bone: IAutoMovieResolvedBone): number {
  const forward: IAutoMovieVector3 = Quaternion.rotateVector(
    bone.worldRotation,
    { x: 0, y: 0, z: 1 },
  );
  return (Math.atan2(forward.x, forward.z) * 180) / Math.PI;
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
