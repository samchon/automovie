import { createBall, createHurdle, createKerb } from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanFoot,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A kerb and a step placed in the scene are stepped over by their own edge, height and depth, and a hurdle is refused as too high to step over: `stepOver` reads the obstacle's `edge` and its `top`'s depth, or a hurdle's `top` and its `bar`.
 *
 * A road kerb and a free-standing step (`createKerb`) each stand with their front face toward the performer, their near side 0.3 m ahead; a women's 400 m hurdle (`createHurdle`) stands the same way.
 *
 * Scenarios, on the average man and the small woman:
 * 1. Stepping over the kerb, then over the step, plans; while either sole is over the obstacle's depth its lowest point stays above the obstacle's top (the obstacle is cleared), and at the end both ankles stand beyond its far side.
 * 2. Stepping over the hurdle, 0.762 m high, is refused on `obstacle`: it is above the height a standing step crosses.
 * 3. Stepping over a ball, which declares no edge, is refused on `obstacle`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the crossings through the public chain over the real kerb and step and reads the displayed soles and ankles; a sole that dips into the obstacle, a foot left short of it, or a hurdle or a ball crossed fails with the measure.
 * @evidence contracts/development/testing.md#independent-expectations The near side, height and depth are the archetypes' own contacts and dimensions carried by the placement; the hurdle's height is its read band.
 * @evidence contracts/development/testing.md#distinguishing-cases A kerb's upstand and a step's riser, a hurdle too high and a prop with no edge, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and eight short films; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the stage and the 3 scenarios with their bounds.
 */
export function test_archetype_kerb_step_over(): void {
  const near: number = 0.3;
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const cross = (
      model: Parameters<typeof HumanObject.prop>[1],
      depth: number,
    ): HumanPerformance =>
      new HumanPerformance({
        seed: "step-over",
        laws: [],
        props: [
          HumanObject.prop("obstacle", model, {
            at: { x: 0, y: 0, z: near + depth },
            yaw: 180,
          }),
        ],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a").stepOver({ obstacle: "obstacle" })
          .node,
      });

    // 1. The kerb and the step are crossed.
    for (const kind of createKerb.KINDS) {
      const kerb: ReturnType<typeof createKerb> = createKerb({ kind });
      const height: number = kerb.dimensions.height!;
      const depth: number = kerb.dimensions.depth!;
      const label: string = `${name} over the ${kind}`;
      let film: HumanPerformance;
      try {
        film = cross(kerb, depth);
      } catch (error) {
        complaints.push(
          `${label}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }
      let lowest: number = Infinity;
      for (let s: number = 0; s <= film.duration; s += 1 / 60)
        for (const p of HumanFoot.base(body, film.bones("a", s)))
          if (p.z > near && p.z < near + depth) lowest = Math.min(lowest, p.y);
      if (!(lowest > height))
        complaints.push(
          `${label}: a sole passes ${mm(lowest - height)} mm over the ${mm(height)} mm top, above it expected`,
        );
      for (const bone of ["leftFoot", "rightFoot"] as const) {
        const ankle: IAutoMovieVector3 = film
          .bones("a", film.duration)
          .get(bone)!.worldPosition;
        if (!(ankle.z > near + depth))
          complaints.push(
            `${label}: the ${bone} ends ${mm(ankle.z - near - depth)} mm from the far side, beyond it expected`,
          );
      }
    }

    // 2. The hurdle is refused as too high, 3. the ball as no obstacle.
    for (const [what, model, depth] of [
      ["hurdle", createHurdle({ kind: "women400" }), 0],
      ["ball", createBall({ kind: "football" }), 0],
    ] as const) {
      try {
        cross(model, depth);
        complaints.push(`${name}: a ${what} was stepped over`);
      } catch (error) {
        if (!(error instanceof HumanRefusal) || error.axis !== "obstacle")
          complaints.push(
            `${name}: stepping over a ${what} failed with ${error instanceof Error ? error.message : String(error)}, a refusal on obstacle expected`,
          );
      }
    }
  }
  TestValidator.equals(
    "a placed kerb and step are stepped over by their own edge",
    complaints,
    [],
  );
}
