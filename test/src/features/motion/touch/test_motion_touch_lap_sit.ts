import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieComposition,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSeat,
  AutoMovieMotionHumanTouch,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

const { sitOnLap } = AutoMovieMotionHumanTouch;

/**
 * How near the sitter's seat comes to the top of the lap, metres: the seat
 * socket's own depth under the buttocks and a skin contact (provisional).
 */
const LAP: number = 0.03;

/** How near the partner's seat stays to the chair, metres: the same contact. */

/**
 * How far ahead of the lap's front edge the sitter waits, facing away, metres
 * (staging: clear of the partner leaning forward to sit).
 */
const APPROACH: number = 0.32;
const CHAIR: number = 0.03;

/** One lap sit: who sits on whose lap. */
interface IPair {
  /** The sitter. */
  sitter: motionHumanBody.Name;

  /** The seated partner. */
  partner: motionHumanBody.Name;
}

/**
 * Sitting on a seated partner's lap and getting off (#4012).
 *
 * Scenarios, the small woman and the average man each on an average man's lap,
 * each take clean:
 *
 * 1. Once seated, the sitter's seat lies on the top of the partner's thighs, and
 *    the partner's own seat still on the chair.
 * 2. The sitter's seat bears on the partner's two thighs, half each.
 * 3. The sitter gets off by rising, back on the feet.
 * 4. A lap sit on a standing partner is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the scene, the cases, the bounds and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Reads both displayed seats against the lap and the chair and the plan's windows; a sitter off the lap, a partner lifted off the chair, a seat window on anything but the thighs or an admitted standing lap fails.
 * @evidence contracts/development/testing.md#independent-expectations A seat contact within the socket's depth; the two thighs share the seat's load equally.
 * @evidence contracts/development/testing.md#distinguishing-cases A light and a heavy sitter, and a standing partner refused.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain.
 */
export function test_motion_touch_lap_sit(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const pairs: readonly IPair[] = [
    { sitter: "f-small", partner: "m-average" },
    { sitter: "m-average", partner: "m-average" },
  ];
  for (const pair of pairs) {
    try {
      const label: string = `${pair.sitter} sits on ${pair.partner}'s lap`;
      const a: IAutoMovieMotionHumanBody = motionHumanBody(pair.sitter);
      const b: IAutoMovieMotionHumanBody = motionHumanBody(pair.partner);
      const { film, chair }: IScene = scene(a, b, true);
      verdict(checks, label, film);
      const sat: IAutoMovieMotionHumanSegment = film
        .segments("a")
        .find(
          (s: IAutoMovieMotionHumanSegment): boolean => s.name === "sitOnLap",
        )!;
      const at: number = sat.end;
      const lap: IAutoMovieVector3 = Vector3.lerp(
        region(film, "b", b, "thighFrontLeft", at),
        region(film, "b", b, "thighFrontRight", at),
        0.5,
      );
      const seat: IAutoMovieVector3 = socket(film, "a", a, at);
      checks.check(
        `${label}: the sitter's seat lies on the lap (${((seat.y - lap.y) * 1000).toFixed(0)} mm above it)`,
        Math.abs(seat.y - lap.y) <= LAP,
      );
      const own: IAutoMovieVector3 = socket(film, "b", b, at);
      checks.check(
        `${label}: the partner's seat still bears on the chair (${((own.y - chair.y) * 1000).toFixed(0)} mm)`,
        Math.abs(own.y - chair.y) <= CHAIR,
      );
      const windows: readonly IAutoMovieMotionHumanContactWindow[] =
        sat.plan.contacts.filter(
          (w: IAutoMovieMotionHumanContactWindow): boolean => w.part === "seat",
        );
      checks.check(
        `${label}: the seat bears on the partner's two thighs`,
        windows.length === 2 &&
          windows.every(
            (w: IAutoMovieMotionHumanContactWindow): boolean =>
              w.support.kind === "person" && w.support.subject === "b",
          ),
      );
      const end: number = film.duration;
      checks.check(
        `${label}: the sitter is back on the feet`,
        socket(film, "a", a, end).y > lap.y + a.measure.thigh / 2,
      );
    } catch (error: unknown) {
      checks.check(`${String(pair)}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.check(
    "sitting on a standing partner's lap is refused",
    (() => {
      try {
        scene(
          motionHumanBody("f-small"),
          motionHumanBody("m-average"),
          false,
        ).film.bones("a", 1);
        return false;
      } catch (error: unknown) {
        return error instanceof HumanRefusal && error.axis === "partner";
      }
    })(),
  );
  checks.assert("touch lap sit");
}

/** One staged lap sit and the partner's chair. */
interface IScene {
  /** The performance. */
  film: HumanPerformance;

  /** The chair's front edge, world metres. */
  chair: IAutoMovieVector3;
}

/** `b` sits on a chair (or stands), `a` sits on `b`'s lap, then `a` rises. */
function scene(
  a: IAutoMovieMotionHumanBody,
  b: IAutoMovieMotionHumanBody,
  sitting: boolean,
): IScene {
  const chair: IAutoMovieMotionHumanSeated.ISeat = {
    at: {
      x: 0,
      y: AutoMovieMotionHumanSeat.seated.popliteal(b),
      z: b.rest.get("leftFoot")!.z - 0.1,
    },
    yaw: 0,
    depth: 0.45,
  };
  // The lap's front edge, as the law sets it: the knees 5 cm ahead of the
  // chair's edge, the lap's middle half a thigh behind them, the sitter's
  // thigh less the seat's clearance ahead of that; the sitter stands a
  // little ahead of it.
  const knees: number = chair.at.z + 0.05;
  const edge: number = knees - b.measure.thigh / 2 + a.measure.thigh - 0.05;
  const partner: IAutoMovieComposition = (
    sitting
      ? HumanChain.subject("b").sit({ seat: chair, hold: 0.5 })
      : HumanChain.subject("b").stand({ hold: 3 })
  ).node;
  // The sitter waits, facing away, while the partner sits.
  const sitter: IAutoMovieComposition = HumanChain.subject("a")
    .stand({ hold: 3 })
    .registered(sitOnLap.name, { partner: "b", hold: 0.5 }).node;

  const off: IAutoMovieComposition = HumanChain.subject("a").rise({}).node;
  return {
    chair: chair.at,
    film: new HumanPerformance({
      seed: "lap-sit",
      laws: [sitOnLap],
      performers: [
        {
          subject: "a",
          body: a,
          at: { x: 0, y: 0, z: edge + APPROACH },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body: b,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      // The partner sits first, the sitter reads the lap, then gets off.
      composition: {
        kind: "sequence",
        parts: [{ kind: "parallel", parts: [partner, sitter] }, off],
      },
    }),
  };
}

/** A performer's displayed seat socket. */
function socket(
  film: HumanPerformance,
  subject: string,
  body: IAutoMovieMotionHumanBody,
  t: number,
): IAutoMovieVector3 {
  return resolveAutoMovieHumanoidSurfaces.place(
    body.surfaces.sockets.seat,
    film.bones(subject, t).get(body.surfaces.sockets.seat.bone)!,
  ).point;
}

/** A body region's displayed point. */
function region(
  film: HumanPerformance,
  subject: string,
  body: IAutoMovieMotionHumanBody,
  name: AutoMovieHumanoidRegion,
  t: number,
): IAutoMovieVector3 {
  return resolveAutoMovieHumanoidSurfaces.place(
    body.surfaces.regions[name],
    film.bones(subject, t).get(body.surfaces.regions[name].bone)!,
  ).point;
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
