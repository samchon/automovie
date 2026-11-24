import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanKneel,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance, HumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** How far a knee may land from its named floor point, metres (provisional: the knee's own radius). */
const KNEE: number = 0.05;

/** How high over the floor a knee down may stand, metres (provisional: a shank's radius and the skin's give). */
const DOWN: number = 0.08;

/** A named knee point, in the performer's frame at the start: +Z ahead, +X left. */
interface ICase {
  /** What the case shows. */
  name: string;

  /** Ahead of the stance, metres. */
  ahead: number;

  /** To the left of the right foot's rest place, metres. */
  left: number;

  /** On one knee or on both. */
  kind: IAutoMovieMotionHumanKneel.Kind;
}

/** The knee points: forward, aside to the right and the default reverse lunge's side of the stance. */
const CASES: readonly ICase[] = [
  { name: "forward on both knees", ahead: 0.35, left: 0, kind: "both" },
  { name: "aside on one knee", ahead: 0.1, left: -0.2, kind: "one" },
  { name: "back on one knee", ahead: -0.3, left: 0, kind: "one" },
];

/**
 * Kneeling at a named knee point (`kneel`'s `at`).
 *
 * Scenarios, on the average man and the small woman:
 * 1. A point ahead, a point aside and a point behind each bring the right
 *    knee down within 50 mm of the point and onto the floor, the take clean.
 * 2. A point beyond the planted foot's leg is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cases and their bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed knee joint at the settled hold against the named point and the floor, and the whole take through the verdicts.
 * @evidence contracts/development/testing.md#independent-expectations The points are typed here in the stance's frame; the bounds are the knee's own size.
 * @evidence contracts/development/testing.md#distinguishing-cases Forward, aside and back, one and both knees, on two bodies, and the reach refusal.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain.
 */
export function test_motion_seat_kneel_at(): void {
  for (const fit of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(fit);
    const right: number = body.rest.get("rightFoot")!.x;
    for (const item of CASES) {
      const point: IAutoMovieVector3 = {
        x: right + item.left,
        y: 0,
        z: item.ahead,
      };
      const film: HumanPerformance = kneel(body, point, item.kind);
      assertTakeClean(`${fit} kneels ${item.name}`, film);
      const segment: IAutoMovieMotionHumanSegment = film.segments("a")[0]!;
      const settled: number =
        segment.start +
        segment.plan.duration *
          segment.plan.events.find(
            (event: IAutoMovieMotionEvent): boolean => event.name === "settled",
          )!.share;
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        film.bones("a", settled);
      const knee: IAutoMovieVector3 = bones.get("rightLowerLeg")!.worldPosition;
      const off: number = Math.hypot(knee.x - point.x, knee.z - point.z);
      TestValidator.predicate(
        `${fit} kneels ${item.name}: the knee is ${(off * 1000).toFixed(1)} mm from its point and ${(knee.y * 1000).toFixed(1)} mm up`,
        off <= KNEE && knee.y <= DOWN,
      );
    }
    TestValidator.predicate(
      `${fit}: a knee point beyond the other leg's reach is refused`,
      ((): boolean => {
        try {
          kneel(body, { x: right, y: 0, z: 1.5 }, "one").bones("a", 1);
          return false;
        } catch (error: unknown) {
          return error instanceof HumanRefusal;
        }
      })(),
    );
  }
}

/** One performer `a` at the origin facing +Z kneels with the right knee at a world point and stays down. */
function kneel(
  body: IAutoMovieMotionHumanBody,
  at: IAutoMovieVector3,
  kind: IAutoMovieMotionHumanKneel.Kind,
): HumanPerformance {
  return new HumanPerformance({
    seed: "kneel-at",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").act("kneel", {
      kind,
      hold: 1,
      rise: false,
      at: { kind: "point", frame: "world", at },
    }).node,
  });
}
