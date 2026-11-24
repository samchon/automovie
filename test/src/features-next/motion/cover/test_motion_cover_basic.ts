import { createDoor, createWall, createWindow } from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCover,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanCover,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanRefusal } from "../../../features/internal/motionHumanRefusal";

/** How far from the wall's face a body in cover keeps its hips, metres: its depth and a hand's breadth. */
const NEAR: number = 0.45;

/** How far the window is set above the floor, metres: a sill this high clears a crouched head, as no standard sill does. */
const RAISE: number = 0.55;

/** A door kicked open stands at least this open, degrees. */
const OPEN: number = 80;

/** One staged cover take. */
interface IStage {
  /** Floor point. */
  at: IAutoMovieVector3;

  /** Yaw, degrees. */
  yaw: number;

  /** The move. */
  move: IAutoMovieMotionHumanCover.IParams;
}

/**
 * Moving in cover (#3979).
 *
 * Scenarios, on the average man and the small woman:
 * 1. A peek past a wall's end puts the head past the end while the hips
 *    stay behind it, and brings the head back; a peek from a foot already
 *    past the end is refused.
 * 2. A sidle with the back to the wall moves along it by the asked distance,
 *    the hips near the face throughout; a stop beyond the wall's end is
 *    refused.
 * 3. Passing under a window keeps the head below the sill along the window.
 * 4. A kick breaches a door from its push side and it swings open; a breach
 *    from the side it opens toward is refused.
 * Every take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each move, the checks and the refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed head and hips against the wall's end and face and the window's sill, the door's displayed swing, and the take through the shipped verdicts.
 * @evidence contracts/development/testing.md#independent-expectations The face, end, sill and hinge are the props' own.
 * @evidence contracts/development/testing.md#distinguishing-cases Peek, sidle, window and breach, each with its refusal, on two bodies.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain.
 */
export function test_motion_cover_basic(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const wallModel = createWall({ kind: "full" });
  const face: IAutoMovieAffordance = wallModel.affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === "face",
  )!;
  const front: number = face.frame.translation.z;
  const end: number = face.width! / 2;
  const windowModel = createWindow({ kind: "casement" });
  const sill: IAutoMovieAffordance = windowModel.affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === "sill",
  )!;
  const aperture: IAutoMovieAffordance = windowModel.affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === "aperture",
  )!;
  const props: IAutoMovieMotionHumanProp[] = [
    HumanObject.prop("wall", wallModel, {
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
      fixed: true,
    }),
    HumanObject.prop("window", windowModel, {
      at: { x: 0, y: RAISE, z: -6 },
      yaw: 0,
      fixed: true,
    }),
    HumanObject.prop("door", createDoor({ kind: "hinged" }), {
      at: { x: 0, y: 0, z: -12 },
      yaw: 0,
      fixed: true,
    }),
  ];
  for (const fit of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(fit);
    const perform = (stage: IStage): HumanPerformance =>
      new HumanPerformance({
        seed: "cover",
        performers: [
          {
            subject: "a",
            body,
            at: stage.at,
            yaw: stage.yaw,
            proficiency: { level: "trained" },
          },
        ],
        props,
        laws: [AutoMovieMotionHumanCover.cover.moveInCover],
        composition: HumanChain.subject("a").registered(
          "moveInCover",
          stage.move,
        ).node,
      });
    const covered = (take: HumanPerformance): IAutoMovieMotionHumanSegment =>
      take
        .segments("a")
        .find(
          (s: IAutoMovieMotionHumanSegment): boolean =>
            s.law.name === "moveInCover",
        )!;
    const at = (s: IAutoMovieMotionHumanSegment, name: string): number =>
      s.start +
      s.plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === name,
      )!.share *
        (s.end - s.start);
    const point = (
      take: HumanPerformance,
      bone: "head" | "hips",
      t: number,
    ): IAutoMovieVector3 => take.bones("a", t).get(bone)!.worldPosition;

    // 1. The peek past the wall's right end.
    try {
      const take: HumanPerformance = perform({
        at: { x: end - 0.25, y: 0, z: front + 0.25 },
        yaw: 0,
        move: { kind: "peek", wall: "wall", face: "face", side: "right" },
      });
      assertTakeClean(`${fit} peek`, take);
      const s: IAutoMovieMotionHumanSegment = covered(take);
      const out: number = at(s, "peekOut");
      all.check(
        `${fit} peek puts the head past the wall's end`,
        Math.abs(point(take, "head", out).x) > end,
      );
      all.check(
        `${fit} peek keeps the hips behind the wall's end`,
        Math.abs(point(take, "hips", out).x) < end,
      );
      all.check(
        `${fit} peek brings the head back behind the end`,
        Math.abs(point(take, "head", s.end).x) < end,
      );
    } catch (error: unknown) {
      all.check(`${fit} peek: ${String(error)}`, false);
    }
    all.check(
      `${fit} a peek from a foot already past the end is refused`,
      motionHumanRefusal(
        () =>
          perform({
            at: { x: end + 0.3, y: 0, z: front + 0.25 },
            yaw: 0,
            move: { kind: "peek", wall: "wall", face: "face", side: "right" },
          }).bones("a", 0.5),
        { kind: "affordance", axis: "side", act: "moveInCover" },
      ),
    );

    // 2. The sidle with the back to the wall.
    try {
      const start: IAutoMovieVector3 = { x: -1, y: 0, z: front + 0.25 };
      const take: HumanPerformance = perform({
        at: start,
        yaw: 0,
        move: {
          kind: "sidle",
          wall: "wall",
          face: "face",
          along: 0.5,
          against: "back",
        },
      });
      assertTakeClean(`${fit} sidle`, take);
      const s: IAutoMovieMotionHumanSegment = covered(take);
      const moved: number =
        point(take, "hips", s.end).x - point(take, "hips", s.start).x;
      all.check(
        `${fit} sidle moves along the wall to the stop (${moved.toFixed(3)} m)`,
        Math.abs(point(take, "hips", s.end).x - 0.5) <= 0.1,
      );
      for (let t: number = s.start; t <= s.end; t += 0.1)
        all.check(
          `${fit} sidle keeps the hips near the face at ${t.toFixed(1)} s`,
          point(take, "hips", t).z - front <= NEAR,
        );
    } catch (error: unknown) {
      all.check(`${fit} sidle: ${String(error)}`, false);
    }
    all.check(
      `${fit} a sidle beyond the wall's end is refused`,
      motionHumanRefusal(
        () =>
          perform({
            at: { x: -1, y: 0, z: front + 0.25 },
            yaw: 0,
            move: { kind: "sidle", wall: "wall", face: "face", along: 50 },
          }).bones("a", 0.5),
        { kind: "affordance", axis: "along", act: "moveInCover" },
      ),
    );

    // 3. Under the window.
    try {
      const take: HumanPerformance = perform({
        at: { x: -1.6, y: 0, z: -6 + sill.frame.translation.z + 0.45 },
        yaw: 90,
        move: { kind: "window", window: "window", along: 1.6 },
      });
      assertTakeClean(`${fit} under the window`, take);
      const s: IAutoMovieMotionHumanSegment = covered(take);
      for (let t: number = s.start; t <= s.end; t += 0.05) {
        const head: IAutoMovieVector3 = point(take, "head", t);
        if (Math.abs(head.x) <= aperture.width! / 2)
          all.check(
            `${fit} under the window: the head stays below the sill at ${t.toFixed(2)} s`,
            head.y < sill.frame.translation.y + RAISE,
          );
      }
    } catch (error: unknown) {
      all.check(`${fit} under the window: ${String(error)}`, false);
    }

    // 4. The breach.
    try {
      const take: HumanPerformance = perform({
        at: { x: 0, y: 0, z: -12.8 },
        yaw: 0,
        move: { kind: "breach", door: "door" },
      });
      assertTakeClean(`${fit} breach`, take);
      const swung: number = Math.abs(
        take.state("door", covered(take).end)["hinge"] ?? 0,
      );
      all.check(
        `${fit} the kicked door swings open (${swung.toFixed(1)}°)`,
        swung >= OPEN,
      );
    } catch (error: unknown) {
      all.check(`${fit} breach: ${String(error)}`, false);
    }
    all.check(
      `${fit} a breach from the side the door opens toward is refused`,
      motionHumanRefusal(
        () =>
          perform({
            at: { x: 0, y: 0, z: -11.2 },
            yaw: 180,
            move: { kind: "breach", door: "door" },
          }).bones("a", 0.5),
        {
          kind: "affordance",
          axis: "door",
          act: "moveInCover",
        },
      ),
    );
  }
  all.assert("cover");
}
