import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieMotionHumanChain, AutoMovieMotionHumanPerformance } from "@automovie/motions";
import {
  FamilyCaseKit
} from "../../../../../packages/motions/src/executable/cases/FamilyCaseKit";
import {
  HumanFrame
} from "../../../../../packages/motions/src/posture/internal/HumanFrame";
import { TestValidator } from "@nestia/e2e";

const ACTOR = "a";
const CLEARANCE = 0.02;

/**
 * Surface backstroke and floating keep the mouth above the water across a
 * cycle.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines open-water contact absence, mouth clearance and root travel during backstroke and float across body fixtures.
 * @evidence contracts/development/testing.md#behavioral-verification Plays two complete cycles of each mode on six stored rigs at two water levels and samples resolved mouth and hips at a 240 Hz grid.
 * @evidence contracts/development/testing.md#independent-expectations Authored timing gives stroke two at one period. The minimum measured clearance equals 20 mm, hips remain more than 30 mm submerged, and the full root path follows the specified backward speed for backstroke and stays fixed for float.
 */
export function test_motions_sport_swim_supine_clearance(): void {
  for (const [id, yaw, water] of [
    ["m-average", 0, 0.8],
    ["m-short", -25, 1.2],
    ["m-large", 30, 0.8],
    ["f-average", 95, 1.2],
    ["f-small", -80, 0.8],
    ["f-tall", 0, 1.2],
  ] as const) {
    const { body }: FamilyCaseKit.IBody = FamilyCaseKit.body(id);
    const mouth = body.surfaces.regions.mouth;
    for (const [kind, period, speed] of [
      ["backstroke", 1.4, 1],
      ["float", 2, 0],
    ] as const) {
      const take: AutoMovieMotionHumanPerformance = new AutoMovieMotionHumanPerformance({
        seed: "supine clearance",
        performers: [
          {
            subject: ACTOR,
            body,
            yaw,
            at: { x: 0.5, y: 0, z: -0.2 },
            proficiency: { level: "trained" },
          },
        ],
        composition: AutoMovieMotionHumanChain.subject(ACTOR).swim({ kind, water, count: 2 })
          .node,
      });
      const segment = take.segments(ACTOR)[0]!;
      TestValidator.predicate(
        `${id} ${kind} clock and open water`,
        () =>
          Math.abs(take.duration - 2 * period) < 1e-9 &&
          Math.abs(FamilyCaseKit.event(take, "stroke2") - period) < 1e-9 &&
          segment.plan.contacts.length === 0,
      );

      const frames = (t: number) => take.bones(ACTOR, t);
      const start = frames(0);
      const direction = HumanFrame.forward(yaw);
      const hip = start.get("hips")!.worldPosition;
      const steps: number = Math.ceil(take.duration * 240);
      let clearance: number = Infinity;
      let hipDepth: number = Infinity;
      let drift: number = 0;
      for (let i: number = 0; i <= steps; ++i) {
        const t: number = (take.duration * i) / steps;
        const display = frames(t);
        const head = display.get(mouth.bone)!;
        const lips: IAutoMovieVector3 = AutoMovieEngineVector3.add(
          head.worldPosition,
          AutoMovieEngineQuaternion.rotateVector(head.worldRotation, mouth.point),
        );
        clearance = Math.min(clearance, lips.y - water);
        const moved: IAutoMovieVector3 = display.get("hips")!.worldPosition;
        hipDepth = Math.min(hipDepth, water - moved.y);
        const expected: IAutoMovieVector3 = AutoMovieEngineVector3.add(
          hip,
          AutoMovieEngineVector3.scale(direction, -speed * t),
        );
        drift = Math.max(drift, AutoMovieEngineVector3.distance(moved, expected));
      }
      TestValidator.predicate(
        `${id} ${kind} breathes throughout both cycles`,
        () =>
          Math.abs(clearance - CLEARANCE) < 1e-6 &&
          hipDepth > 0.03 &&
          drift < 1e-6,
      );
    }
  }
}
