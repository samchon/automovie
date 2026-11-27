import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieMotionHumanChain, AutoMovieMotionHumanPerformance } from "@automovie/motions";
import { FamilyCaseKit } from "@automovie/motions/executable/internal";
import { HumanFrame } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

const ACTOR = "a";
const CLEARANCE = 0.02;

/**
 * Surface backstroke and floating keep the mouth above the water across a
 * cycle.
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
        const lips: IAutoMovieVector3 = Vector3.add(
          head.worldPosition,
          Quaternion.rotateVector(head.worldRotation, mouth.point),
        );
        clearance = Math.min(clearance, lips.y - water);
        const moved: IAutoMovieVector3 = display.get("hips")!.worldPosition;
        hipDepth = Math.min(hipDepth, water - moved.y);
        const expected: IAutoMovieVector3 = Vector3.add(
          hip,
          Vector3.scale(direction, -speed * t),
        );
        drift = Math.max(drift, Vector3.distance(moved, expected));
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
