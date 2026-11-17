import { AutoMovieAir, AutoMovieComposition } from "@automovie/engine";
import type {
  IAutoMovieInteractionEvent,
  IAutoMovieMotionHumanBlast,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
} from "@automovie/interface";
import {
  HumanBlast,
  HumanChain,
  HumanPerformance,
  HumanReaction,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The one hit record (#3480): blasts reach who is inside their radius, the
 * nearer harder, and a report reaches a listener at the speed of sound.
 *
 * Scenarios:
 * 1. A blast of 6 m radius with three standing average men at 2, 5 and
 *    12 m gives exactly two hits, on the first two, each of kind `hit` from
 *    `impactOutput`, at the blast's second.
 * 2. The nearer's impulse is the larger, and each points away from the
 *    blast (a positive dot product with the line from the blast to the
 *    struck point).
 * 3. Each hit names the struck bone and region and has a unit normal.
 * 4. `HumanBlast.impulse` falls monotonically with distance beyond the
 *    reference metre and is the reference impulse within it.
 * 5. A listener 34.3 m from a shot hears it 34.3 m over the engine's speed
 *    of sound later, within one 60 Hz frame of 0.1 s.
 * 6. Two performances of one input give the same hits, field for field.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the performance's hit record and the report function; a blast reaching beyond its radius, a farther hit struck harder, an impulse toward the blast or a late report fails.
 * @evidence contracts/development/testing.md#independent-expectations Distances and radius are the scene's; the report's delay is distance over the speed of sound, written here.
 * @evidence contracts/development/testing.md#distinguishing-cases Inside, inside and outside the radius; the falloff inside and beyond the reference metre; a replay.
 * @evidence contracts/development/testing.md#execution-ownership Builds two performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the six numbered scenarios.
 */
export function test_human_motion_hit_record(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const blast: IAutoMovieMotionHumanBlast.IBlast = {
    id: "shell",
    point: { x: 0, y: 0.2, z: 0 },
    at: 1,
    radius: 6,
    impulse: 400,
  };
  const make = (): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "blast",
      blasts: [blast],
      performers: [2, 5, 12].map((d: number, k: number) => ({
        subject: `p${k}`,
        body,
        at: { x: d, y: 0, z: 0 },
        yaw: -90,
        proficiency: { level: "trained" as const },
      })),
      composition: AutoMovieComposition.parallel(
        ...[0, 1, 2].map(
          (k: number) => HumanChain.subject(`p${k}`).stand({ seconds: 2 }).node,
        ),
      ),
    });
  const performance: IAutoMovieMotionHumanPerformance = make();
  const hits: readonly IAutoMovieInteractionEvent[] = performance.hits();

  // 1. Two hits.
  TestValidator.predicate(
    `two people inside the radius are hit (${hits.map((h) => h.target).join(", ")})`,
    hits.length === 2 &&
      hits.every(
        (h) =>
          h.kind === "hit" &&
          h.source === "impactOutput" &&
          Math.abs(h.time - 1) <= 1e-12,
      ) &&
      hits.some((h) => h.target === "p0") &&
      hits.some((h) => h.target === "p1"),
  );

  // 2. Nearer harder, away from the blast.
  const size = (h: IAutoMovieInteractionEvent): number =>
    Math.hypot(h.impulse?.x ?? 0, h.impulse?.y ?? 0, h.impulse?.z ?? 0);
  const near = hits.find((h) => h.target === "p0");
  const far = hits.find((h) => h.target === "p1");
  TestValidator.predicate(
    "the nearer is struck harder",
    near !== undefined && far !== undefined && size(near) > size(far),
  );
  TestValidator.predicate(
    "each impulse points away from the blast",
    hits.every(
      (h) =>
        h.point !== null &&
        h.impulse !== undefined &&
        h.impulse.x * (h.point.x - blast.point.x) +
          h.impulse.y * (h.point.y - blast.point.y) +
          h.impulse.z * (h.point.z - blast.point.z) >
          0,
    ),
  );

  // 3. Bone, region and normal.
  TestValidator.predicate(
    "each hit names its bone and region and has a unit normal",
    hits.every(
      (h) =>
        h.bone !== undefined &&
        h.region !== undefined &&
        h.normal !== undefined &&
        Math.abs(Math.hypot(h.normal.x, h.normal.y, h.normal.z) - 1) <= 1e-6,
    ),
  );

  // 4. The falloff.
  let falling: boolean = true;
  for (let d: number = 1; d < 6; d += 0.5)
    falling &&=
      HumanBlast.impulse(blast, d + 0.5) < HumanBlast.impulse(blast, d);
  TestValidator.predicate(
    "the impulse falls with distance and is the reference within a metre",
    falling && HumanBlast.impulse(blast, 0.5) === blast.impulse,
  );

  // 5. The report.
  const heard: number = HumanReaction.report(
    { point: { x: 0, y: 1, z: 0 }, seconds: 2 },
    { x: 34.3, y: 1, z: 0 },
  );
  TestValidator.predicate(
    `the report arrives at the speed of sound (${(heard - 2).toFixed(4)} s)`,
    Math.abs(heard - 2 - 34.3 / AutoMovieAir.SOUND) <= 1e-12 &&
      Math.abs(heard - 2 - 0.1) <= 1 / 60,
  );

  // 6. Replay.
  TestValidator.equals("a replay gives the same hits", make().hits(), hits);
}
