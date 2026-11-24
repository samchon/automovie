import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance, HumanRefusal } from "@automovie/motions";
import { HUMAN_LEXICON, HumanHand } from "@automovie/motions/internal";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** A palm over the face lies within this of the head's centre, in head radii: the face's reach. */
const FACE: number = 2.2;
/** The rolled body's hips stay this low, in statures: a lying body, never risen. */
const LOW: number = 0.2;

/**
 * Stop, drop and roll on two bodies.
 *
 * Scenarios:
 * 1. The body drops from standing to lying and rolls: the hips come down to
 *    a lying height and stay there through the rolls.
 * 2. Both palms stay over the face from the drop's end through every roll.
 * 3. The rolls turn the body onto each side: the chest's side-to-side axis
 *    tips past vertical one way and then the other.
 * 4. A non-positive roll count is refused.
 * 5. The take passes the shipped verdict report: no floor penetration, no
 *    pop.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the drill's phases and what each check pins.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the registered stopDropRoll row through HumanPerformance and reads palms, the head, the hips, the chest and the verdict report.
 * @evidence contracts/development/testing.md#independent-expectations The face bound is a head's reach in head radii; the lying bound a fifth of a stature.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, both roll sides, a refused count.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_fall_stop_drop_roll(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const label of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(label);
    try {
      const film: HumanPerformance = perform(body, 2);
      const drill: IAutoMovieMotionHumanSegment = film
        .segments("s")
        .find(
          (s: IAutoMovieMotionHumanSegment): boolean =>
            s.name === "stopDropRoll",
        )!;
      const down: number =
        drill.start +
        drill.plan.duration *
          drill.plan.events.find((e): boolean => e.name === "down")!.share;
      const end: number = drill.start + drill.plan.duration;
      let leftmost: number = 0;
      let rightmost: number = 0;
      for (let i: number = 0; i <= 24; ++i) {
        const t: number = down + ((end - down) * i) / 24;
        const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          film.bones("s", t);
        const head: IAutoMovieVector3 = bones.get("head")!.worldPosition;
        for (const side of ["left", "right"] as const) {
          const palm: IAutoMovieVector3 = HumanHand.frame(
            body,
            bones,
            side,
            "palm",
            "flat",
          ).point;
          const gap: number =
            Vector3.distance(palm, head) / body.measure.headRadius;
          checks.check(
            `${label}: the ${side} palm covers the face at ${t.toFixed(2)} (${gap.toFixed(2)} head radii)`,
            gap <= FACE,
          );
        }
        checks.check(
          `${label}: the body lies at ${t.toFixed(2)}`,
          bones.get("hips")!.worldPosition.y <= LOW * body.measure.stature,
        );
        const across: IAutoMovieVector3 = Vector3.normalize(
          Vector3.subtract(
            bones.get("leftUpperArm")!.worldPosition,
            bones.get("rightUpperArm")!.worldPosition,
          ),
        );
        leftmost = Math.max(leftmost, across.y);
        rightmost = Math.min(rightmost, across.y);
      }
      checks.check(
        `${label}: the rolls turn onto each side (${leftmost.toFixed(2)}, ${rightmost.toFixed(2)})`,
        leftmost >= 0.7 && rightmost <= -0.7,
      );
      assertTakeClean(`${label} stop, drop and roll`, film);
    } catch (error: unknown) {
      checks.check(`${label} refused: ${String(error)}`, false);
    }
    let refusal: unknown = undefined;
    try {
      perform(body, 0);
    } catch (error: unknown) {
      refusal = error;
    }
    checks.check(
      `${label}: zero rolls are refused: ${String(refusal)}`,
      refusal instanceof HumanRefusal && refusal.axis === "rolls",
    );
  }
  checks.assert("stop, drop and roll");
}

/** A standing body that stops, drops and rolls. */
function perform(
  body: IAutoMovieMotionHumanBody,
  rolls: number,
): HumanPerformance {
  return new HumanPerformance({
    seed: "stop-drop-roll",
    laws: Object.values(HUMAN_LEXICON).flat(),
    performers: [
      {
        subject: "s",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("s")
      .stand({ hold: 0.3, sway: 0 })
      .registered("stopDropRoll", { rolls }).node,
  });
}
