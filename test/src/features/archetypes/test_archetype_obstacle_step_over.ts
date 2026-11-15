import { createObstacle } from "@automovie/archetypes";
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
 * A crosstie and a sandbag placed in the scene are stepped over by their own edge, height and depth, and a concrete barrier and a crowd barrier are refused: `stepOver` reads the obstacle's `edge` and its `top`'s depth.
 *
 * Each obstacle stands with its front toward the performer, its near side 0.3 m ahead, as the kerb's stepping test stands a kerb.
 *
 * Scenarios, on the average man and the small woman:
 * 1. Stepping over the crosstie, then over the sandbag, plans; while either sole is over the obstacle's depth its lowest point stays above the obstacle's top, and at the end both ankles stand beyond its far side.
 * 2. Stepping over the concrete barrier, 0.813 m high, is refused on `obstacle`: it is above the height a standing step crosses.
 * 3. Stepping over the crowd barrier, which declares no edge or top, is refused on `obstacle`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the crossings through the public chain over the real obstacles and reads the displayed soles and ankles; a sole that dips into the obstacle, a foot left short of it, or a barrier crossed fails with the measure.
 * @evidence contracts/development/testing.md#independent-expectations The near side, height and depth are the obstacles' own contacts carried by the placement; the barrier's height is its FHWA band.
 * @evidence contracts/development/testing.md#distinguishing-cases A 6 to 7 in crosstie and a 4 in sandbag, a barrier too high and one with no crossing contacts, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and eight short films; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the stage and the 3 scenarios with their bounds.
 */
export function test_archetype_obstacle_step_over(): void {
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

    // 1. The crosstie and the sandbag are crossed.
    for (const kind of ["crosstie", "sandbag"] as const) {
      const obstacle: ReturnType<typeof createObstacle> = createObstacle({
        kind,
      });
      const height: number = obstacle.dimensions.height!;
      const depth: number = obstacle.dimensions.width!;
      const label: string = `${name} over the ${kind}`;
      let film: HumanPerformance;
      try {
        film = cross(obstacle, depth);
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

    // 2. The concrete barrier is refused as too high, 3. the crowd barrier as no obstacle to step.
    for (const kind of ["jerseyBarrier", "crowdBarrier"] as const) {
      try {
        cross(createObstacle({ kind }), 0.61);
        complaints.push(`${name}: a ${kind} was stepped over`);
      } catch (error) {
        if (!(error instanceof HumanRefusal) || error.axis !== "obstacle")
          complaints.push(
            `${name}: stepping over a ${kind} failed with ${error instanceof Error ? error.message : String(error)}, a refusal on obstacle expected`,
          );
      }
    }
  }
  TestValidator.equals(
    "a placed crosstie and sandbag are stepped over by their own edge",
    complaints,
    [],
  );
}
