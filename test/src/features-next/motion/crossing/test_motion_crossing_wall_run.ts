import { createWall } from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanWallRun,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanCrossing,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanRefusal } from "../../../features/internal/motionHumanRefusal";

/** A foot's or hand's largest gap from the surface it is on, metres. */
const ON: number = 0.06;

/** The run-up wall's top above the floor, metres. */
const TOP: number = 2;

/** The lowest wall step, hip heights: under the planner's first step. */
const STEP: number = 0.5;

/**
 * Stepping on and running up a wall (#4001).
 *
 * Scenarios, on the average man and the small woman:
 * 1. A wall step plants the stepping foot on the wall's face, at least half
 *    a hip height up, with the hips off the wall.
 * 2. A run up the wall plants the feet on the face and catches the top with
 *    both hands, then hangs from it.
 * 3. A wall whose top is beyond the run's reach is refused naming the top.
 * Every take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each move, the checks and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed feet, hands and hips at the plan's events against the wall's face and top, and the take through the shipped verdicts.
 * @evidence contracts/development/testing.md#independent-expectations The face and top are the wall's own affordances.
 * @evidence contracts/development/testing.md#distinguishing-cases Step, run and a wall out of reach, on two bodies.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain.
 */
export function test_motion_crossing_wall_run(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const model = createWall({ kind: "full", height: 2.286 });
  const face: IAutoMovieAffordance = model.affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === "face",
  )!;
  const top: IAutoMovieAffordance = model.affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === "top",
  )!;
  const front: number = face.frame.translation.z;
  // The wall set into the floor so its top stands `TOP` up, within both bodies' reach.
  const sunk: number = TOP - top.frame.translation.y;
  const height: number = TOP;
  const props: IAutoMovieMotionHumanProp[] = [
    HumanObject.prop("wall", model, {
      at: { x: 0, y: sunk, z: 0 },
      yaw: 0,
      fixed: true,
    }),
    HumanObject.prop("tall", model, {
      at: { x: 8, y: 2.5, z: 0 },
      yaw: 0,
      fixed: true,
    }),
  ];
  for (const fit of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(fit);
    const perform = (
      x: number,
      p: IAutoMovieMotionHumanWallRun.IParams,
    ): HumanPerformance =>
      new HumanPerformance({
        seed: "wall-run",
        performers: [
          {
            subject: "a",
            body,
            at: { x, y: 0, z: front + 0.7 },
            yaw: 180,
            proficiency: { level: "trained" },
          },
        ],
        props,
        laws: [AutoMovieMotionHumanCrossing.HumanWallRun.wallRun],
        composition: HumanChain.subject("a").registered("wallRun", p).node,
      });
    const run = (take: HumanPerformance): IAutoMovieMotionHumanSegment =>
      take
        .segments("a")
        .find(
          (s: IAutoMovieMotionHumanSegment): boolean =>
            s.law.name === "wallRun",
        )!;
    const at = (s: IAutoMovieMotionHumanSegment, name: string): number =>
      s.start +
      s.plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === name,
      )!.share *
        (s.end - s.start);
    const point = (
      take: HumanPerformance,
      bone: "leftToes" | "rightToes" | "leftHand" | "rightHand" | "hips",
      t: number,
    ): IAutoMovieVector3 => take.bones("a", t).get(bone)!.worldPosition;

    // 1. The wall step.
    try {
      const take: HumanPerformance = perform(0, {
        kind: "wallStep",
        wall: "wall",
        face: "face",
        foot: "right",
      });
      assertTakeClean(`${fit} wall step`, take);
      const t: number = at(run(take), "wallStep");
      const foot: IAutoMovieVector3 = point(take, "rightToes", t);
      all.check(
        `${fit} wall step plants the foot on the face (${(foot.z - front).toFixed(3)} m off)`,
        Math.abs(foot.z - front) <= ON,
      );
      all.check(
        `${fit} wall step plants it at least half a hip height up`,
        foot.y >= STEP * body.measure.hipHeight,
      );
      all.check(
        `${fit} wall step keeps the hips off the wall`,
        point(take, "hips", t).z > front,
      );
    } catch (error: unknown) {
      all.check(`${fit} wall step: ${String(error)}`, false);
    }

    // 2. The run up to the top.
    try {
      const take: HumanPerformance = perform(0, {
        kind: "run",
        wall: "wall",
        face: "face",
        top: "top",
      });
      assertTakeClean(`${fit} wall run`, take);
      const s: IAutoMovieMotionHumanSegment = run(take);
      const caught: number = at(s, "catch");
      for (const hand of ["leftHand", "rightHand"] as const) {
        const p: IAutoMovieVector3 = point(take, hand, caught);
        all.check(
          `${fit} the ${hand} catches the top`,
          Math.abs(p.y - height) <= ON * 2 && Math.abs(p.z - front) <= ON * 2,
        );
      }
      for (const hand of ["leftHand", "rightHand"] as const)
        all.check(
          `${fit} the ${hand} hangs from the top at the end`,
          Math.abs(point(take, hand, s.end).y - height) <= ON * 2,
        );
    } catch (error: unknown) {
      all.check(`${fit} wall run: ${String(error)}`, false);
    }

    // 3. A top beyond reach.
    all.check(
      `${fit} a wall whose top is out of reach is refused`,
      motionHumanRefusal(
        () =>
          perform(8, {
            kind: "run",
            wall: "tall",
            face: "face",
            top: "top",
          }).bones("a", 0.5),
        {
          kind: "reach",
          axis: "top",
          act: "wallRun",
        },
      ),
    );
  }
  all.assert("wall run");
}
