import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanDanceBeats,
  IAutoMovieMotionHumanDanceCourse,
  IAutoMovieMotionHumanDanceFootKey,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { ExerciseKey } from "./ExerciseKey";

/**
 * A line dance's eight counts: a grapevine right (side, behind, side, close)
 * and a grapevine left whose last count closes after a quarter turn to the left
 * on the left foot's ball. The pattern returns the feet to where they stood and
 * the turned frame keeps the member's centre, so every member turns about its
 * own place and the rows keep their spacing; each repeat faces the next wall.
 *
 * Steps are `STEP` of the feet's spacing wide; the crossing foot lands `CROSS`
 * foot lengths behind. A foot travels over `TRAVEL` of a beat, lifted `LIFT` of
 * the stature.
 */
export namespace groupDanceLine {
  /** A side step, a share of twice the feet's half spacing (provisional). */
  export const STEP: number = 1;

  /** How far behind the crossing foot lands, foot lengths (provisional). */
  export const CROSS: number = 0.45;

  /** A foot's travel into a count, a share of a beat. */
  export const TRAVEL: number = 0.45;

  /** A travelling foot's lift, a share of the stature (provisional). */
  export const LIFT: number = 0.03;

  /** The pivoting heel's lift through the turn, degrees about the ball. */
  export const PIVOT: number = 10;

  /**
   * The line dance's course.
   *
   * @param body The member's body.
   * @param entry The member's entry state.
   * @param beats The member's beat clock, its offset already in.
   * @param repeats How many eight-count patterns.
   * @returns The course.
   */
  export function course(
    body: IAutoMovieMotionHumanBody,
    entry: IAutoMovieMotionHumanEntryState,
    beats: IAutoMovieMotionHumanDanceBeats,
    repeats: number,
  ): IAutoMovieMotionHumanDanceCourse {
    const posture: IAutoMovieMotionHumanPosture = entry.posture;
    const half: number =
      Math.hypot(
        entry.feet.left.ankle.x - entry.feet.right.ankle.x,
        entry.feet.left.ankle.z - entry.feet.right.ankle.z,
      ) / 2;
    const d: number = 2 * half * STEP;
    const behind: number = -CROSS * body.measure.footLength;
    const floor: number =
      (entry.feet.left.ankle.y + entry.feet.right.ankle.y) / 2;
    const lift: number = LIFT * body.measure.stature;
    const travel: number = TRAVEL * beats.period;
    const end: number = beats.at(beats.count) + beats.period;
    const keys: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanDanceFootKey[]
    > = {
      left: [stood(entry, "left")],
      right: [stood(entry, "right")],
    };
    let frame: IAutoMovieMotionHumanFrame = {
      origin: {
        x: (entry.feet.left.ankle.x + entry.feet.right.ankle.x) / 2,
        y: floor,
        z: (entry.feet.left.ankle.z + entry.feet.right.ankle.z) / 2,
      },
      yaw: posture.yaw,
    };
    const turns: ITurn[] = [];
    const at: (
      f: IAutoMovieMotionHumanFrame,
      x: number,
      z: number,
    ) => IAutoMovieMotionHumanFoot.IPlacement = (
      f: IAutoMovieMotionHumanFrame,
      x: number,
      z: number,
    ): IAutoMovieMotionHumanFoot.IPlacement => ({
      ankle: HumanFrame.point(f, { x, y: 0, z }),
      rotation: HumanFoot.rotation(f.yaw, 0),
    });
    function step(
      side: AutoMovieHumanSide,
      count: number,
      place: IAutoMovieMotionHumanFoot.IPlacement,
      hold?: (t: number) => IAutoMovieMotionHumanFoot.IPlacement,
    ): void {
      const list: IAutoMovieMotionHumanDanceFootKey[] = keys[side];
      const t: number = beats.at(count);
      const last: IAutoMovieMotionHumanDanceFootKey = list[list.length - 1]!;
      last.leave = Math.max(last.at, Math.min(last.leave, t - travel));
      list.push({
        at: t,
        leave: Infinity,
        place,
        bears: true,
        clearance: lift,
        ...(hold === undefined ? {} : { hold }),
      });
    }
    for (let r: number = 0; r < repeats; r++) {
      const c: number = 8 * r;
      const f: IAutoMovieMotionHumanFrame = frame;
      step("right", c + 1, at(f, -half - d, 0));
      step("left", c + 2, at(f, -half - 1.25 * d, behind));
      step("right", c + 3, at(f, -half - 2 * d, 0));
      step("left", c + 4, at(f, half - 2 * d, 0));
      step("left", c + 5, at(f, half - d, 0));
      step("right", c + 6, at(f, half - 0.75 * d, behind));
      // The left foot comes home and turns a quarter on its ball through the
      // last count, the right closing beside it in the turned frame.
      const home: IAutoMovieMotionHumanFoot.IPlacement = at(f, half, 0);
      const from: number = beats.at(c + 7);
      const to: number = beats.at(c + 8);
      turns.push({ from, to, yaw: f.yaw });
      const ball: IAutoMovieVector3 = HumanFoot.point(
        body,
        "left",
        "ball",
        home,
      );
      step(
        "left",
        c + 7,
        home,
        (t: number): IAutoMovieMotionHumanFoot.IPlacement => {
          const s: number = AutoMovieEngineMotionSampling.minimumJerkShare(
            Math.max(0, Math.min(1, (t - from) / (to - from))),
          );
          return s <= 0
            ? home
            : HumanFoot.pivot(
                body,
                "left",
                "ball",
                ball,
                f.yaw + 90 * s,
                -PIVOT * Math.sin(Math.PI * s),
                PIVOT * Math.sin(Math.PI * s),
              );
        },
      );
      const next: IAutoMovieMotionHumanFrame = {
        origin: frame.origin,
        yaw: f.yaw + 90,
      };
      // The turned frame keeps the member's own centre, so every member
      // turns about its place and the rows keep their spacing whatever the
      // bodies; the pivoting left foot meets its turned place at its next step.
      step("right", c + 8, at(next, -half, 0));
      frame = next;
    }
    for (const side of ["left", "right"] as const) {
      const list: IAutoMovieMotionHumanDanceFootKey[] = keys[side];
      list[list.length - 1]!.leave = end;
    }
    const arms: IAutoMovieMotionHumanPosture["joints"] = ExerciseKey.from(
      body,
      {},
      { shoulder: 10, raise: 15, elbow: 40 },
    ).joints;
    return {
      duration: end,
      left: keys.left,
      right: keys.right,
      // The hips ride over the feet; the caller sets them (`DanceFootwork.over`).
      hips: (): IAutoMovieVector3 => frame.origin,
      yaw: (t: number): number => {
        let yaw: number = posture.yaw;
        for (const turn of turns)
          if (t >= turn.to) yaw = turn.yaw + 90;
          else if (t > turn.from)
            yaw =
              turn.yaw +
              90 * AutoMovieEngineMotionSampling.minimumJerkShare((t - turn.from) / (turn.to - turn.from));
        return yaw;
      },
      joints: (): IAutoMovieMotionHumanPosture["joints"] => arms,
      instants: [],
    };
  }

  /** One repeat's quarter turn. */
  interface ITurn {
    /** When it starts, action seconds. */
    from: number;

    /** When it ends. */
    to: number;

    /** The heading before it, degrees. */
    yaw: number;
  }

  /** The entry stance's key. */
  function stood(
    entry: IAutoMovieMotionHumanEntryState,
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanDanceFootKey {
    return {
      at: 0,
      leave: Infinity,
      place: {
        ankle: entry.feet[side].ankle,
        rotation: entry.feet[side].rotation,
      },
      bears: true,
      clearance: 0,
    };
  }
}
