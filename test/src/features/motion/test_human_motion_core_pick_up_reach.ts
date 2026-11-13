import { createDrinkware } from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditContinuity,
  HumanChain,
  HumanObject,
  HumanPerformance,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * An arm that reaches for a glass leaves its hanging pose and arrives at the
 * grip on one continuous course: no joint of the body steps on the way.
 *
 * Scenarios, a glass picked up with the right hand as the film's first
 * action: by the small woman from waist height a sixth of her stature ahead,
 * and by the average man from lower and farther, at 0.55 of his stature and
 * a fifth of it ahead, near his arm's straight reach, where an elbow is
 * nearly straight. One film each: the two cells that stepped when all four
 * of bodies by places were measured (651 mm and 810 mm), which is why two
 * are enough.
 * 1. Over the whole pick-up, no joint centre jumps by more than the
 *    continuity audit's 5 mm.
 *
 * A failing row names the joint and the second, and the right wrist's place
 * at the five readings 1/120 s apart around it, so the step's size and
 * direction are read from the complaint.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the pick-up through the public input and reads the displayed joint centres with the package's continuity audit; an arm that changes its solution at one instant fails.
 * @evidence contracts/development/testing.md#independent-expectations The 5 mm is the campaign's bound on a displayed step; nothing is read from the pick-up's plan.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies and two places of the glass, one well inside the reach and one near its limit, where an elbow is nearly straight. The grip, the lift and the prop's ride in the hand are `test_human_motion_object_affordances`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and one archetype and builds four performances of one action in memory; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the two places, the bound and what a failing row carries.
 */
export function test_human_motion_core_pick_up_reach(): void {
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  for (const [name, places] of [
    ["m-average", ["far"]],
    ["f-small", ["near"]],
  ] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;
    for (const [label, at] of (
      [
        ["near", { x: 0.15, y: 0.58 * stature, z: 0.17 * stature }],
        ["far", { x: 0.15, y: 0.55 * stature, z: 0.2 * stature }],
      ] as const
    ).filter(([label]: readonly ["near" | "far", unknown]): boolean =>
      (places as readonly string[]).includes(label),
    )) {
      let film: HumanPerformance;
      try {
        film = new HumanPerformance({
          seed: "reach",
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          props: [
            HumanObject.prop("glass", createDrinkware({ kind: "glass" }), {
              at,
              yaw: 0,
            }),
          ],
          composition: HumanChain.subject("a").pickUp({
            prop: "glass",
            handle: "body",
            hand: "right",
          }).node,
        });
      } catch (error) {
        complaints.push(
          `${name}, the glass ${label}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }
      const jump: ReturnType<
        typeof AutoMovieMotionHumanAuditContinuity.measure
      >["jump"] = AutoMovieMotionHumanAuditContinuity.measure(film, "a").jump;
      if (jump.value <= 0.005) continue;
      const wrist = (seconds: number): IAutoMovieVector3 =>
        film.bones("a", Math.max(0, seconds)).get("rightHand")!.worldPosition;
      complaints.push(
        `${name}, the glass ${label}: a jump of ${mm(jump.value)} mm at ${jump.seconds.toFixed(3)} s (${jump.where}) of a ${film.duration.toFixed(2)} s pick-up, within 5 mm expected; the right wrist 1/120 s apart around it: ${[
          -2, -1, 0, 1, 2,
        ]
          .map((k: number): string => {
            const p: IAutoMovieVector3 = wrist(jump.seconds + k / 120);
            return `(${mm(p.x)}, ${mm(p.y)}, ${mm(p.z)})`;
          })
          .join(" ")}`,
      );
    }
  }
  TestValidator.equals("a reach for a glass has no step", complaints, []);
}
