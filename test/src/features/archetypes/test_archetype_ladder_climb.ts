import { createLadder } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A ladder placed in the scene is climbed by its own rungs and stays where it was placed: the hands that grip its rungs bear on it as a fixture and never carry it off.
 *
 * A fixed ladder (`createLadder`, 0.3 m rungs) stands 0.35 m ahead of the climber, its rungs facing them, placed as a fixture. The climber climbs three rungs with `climbLadder`, which reads the ladder's `rung1` upward.
 *
 * Scenarios, on the average man and the small woman:
 * 1. The climb plans.
 * 2. Through the whole film, read every tenth of a second, the ladder keeps its placed frame within 1 mm (the campaign's grip bound): no grip moves it.
 * 3. At the climb's end both ankles stand three rungs' spacing higher than at its start, within 50 mm (provisional: a foot's place on a rung's top).
 * 4. The same ladder placed without `fixed` is refused, its hands never left to carry it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the climb through the public chain on the real ladder and reads the displayed ladder and joints; a ladder a grip carries off, a climb that does not rise or a loose ladder climbed fails with the measure.
 * @evidence contracts/development/testing.md#independent-expectations The rise is the ladder's own spacing; the 1 mm is the campaign's grip bound and the 50 mm is stated provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases A fixture and a loose ladder, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and four films; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the stage and the 4 scenarios with their bounds.
 */
export function test_archetype_ladder_climb(): void {
  const ladder: ReturnType<typeof createLadder> = createLadder({
    kind: "fixed",
    spacing: 0.3,
  });
  const placement: HumanObject.Placement = {
    at: { x: 0, y: 0, z: 0.35 },
    yaw: 180,
  };
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const perform = (fixed: boolean): HumanPerformance =>
      new HumanPerformance({
        seed: "ladder",
        laws: [],
        props: [HumanObject.prop("ladder", ladder, { ...placement, fixed })],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a").climbLadder({
          ladder: "ladder",
          rungs: 3,
        }).node,
      });

    // 1. It plans.
    let film: HumanPerformance;
    try {
      film = perform(true);
    } catch (error) {
      complaints.push(
        `${name}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }

    // 2. The ladder stays where it was placed.
    const placed: IHumanProp.IFrame = HumanObject.frame(placement);
    let moved: number = 0;
    for (let s: number = 0; s <= film.duration; s += 0.1)
      moved = Math.max(
        moved,
        Vector3.length(
          Vector3.subtract(film.prop("ladder", s).position, placed.position),
        ),
      );
    if (!(moved <= 0.001))
      complaints.push(
        `${name}: the ladder moves ${mm(moved)} mm from its placement during the climb, within 1 mm expected`,
      );

    // 3. The climber rises three rungs.
    const reader: HumanSignature.IReader = HumanSignature.of(film, "a", body, 0);
    for (const bone of ["leftFoot", "rightFoot"] as const) {
      const start: IAutoMovieVector3 = HumanSignature.joint(reader, 0, bone);
      const end: IAutoMovieVector3 = HumanSignature.joint(
        reader,
        film.duration,
        bone,
      );
      const rise: number = end.y - start.y;
      if (!(Math.abs(rise - 3 * 0.3) <= 0.05))
        complaints.push(
          `${name}: the ${bone} rises ${mm(rise)} mm over the climb, 900 mm within 50 mm expected`,
        );
    }

    // 4. A loose ladder is refused.
    try {
      perform(false);
      complaints.push(`${name}: a ladder that is no fixture was climbed`);
    } catch (error) {
      if (!(error instanceof HumanRefusal))
        complaints.push(
          `${name}: a loose ladder failed with ${error instanceof Error ? error.message : String(error)}, a refusal expected`,
        );
    }
  }
  TestValidator.equals(
    "a placed ladder is climbed and never carried",
    complaints,
    [],
  );
}
