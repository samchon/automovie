import { createDrinkware } from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "./motionHumanBody";

/**
 * A pick up lifts what it is asked, or refuses: on one body, which the
 * `test_human_motion_pick_up_lift_*` specs read one body each. A pick up
 * whose lift the arm could not raise the hand to lifted less and said
 * nothing (a bat drawn from a back sleeve stopped 65 mm short).
 *
 * The person stands at the origin facing +Z; a glass stands within reach
 * ahead and to the right at 0.9 of the hip height.
 *
 * Scenarios:
 * 1. Lifted 0.1 m, the pick up plans and the glass rises at least 90 mm by
 *    `lifted`, where the lift is defined: what is asked is done.
 * 2. Lifted 1.2 m, above any reach from there, it is refused as a `reach`
 *    refusal on `lift` whose fix names a smaller lift.
 *
 * @param name The body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the stage, the case it comes from and the 2 scenarios with their bounds.
 * @evidence contracts/development/implementation.md#principled-implementation The chain's own pick up of a real glass archetype, read on the displayed glass at the plan's own `lifted` event.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One lift done and one refused, gathered as complaints and asserted once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A pick up that does not plan is a complaint with the refusal's words.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two short performances, two readings.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by each body's spec, so the readings exist once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing past the call.
 */
export function motionPickUpLift(name: motionHumanBody.Name): void {
  const body: IHumanBody = motionHumanBody(name);
  const complaints: string[] = [];
  const glass: ReturnType<typeof createDrinkware> = createDrinkware({
    kind: "glass",
  });
  const at: IAutoMovieVector3 = {
    x: -0.15,
    y: 0.9 * body.measure.hipHeight,
    z: 0.35,
  };
  const perform = (lift: number): HumanPerformance =>
    new HumanPerformance({
      seed: "lift",
      props: [HumanObject.prop("glass", glass, { at, yaw: 0 })],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").pickUp({
        prop: "glass",
        handle: "body",
        lift,
      }).node,
    });
  const said = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

  // 1. What is asked is done.
  try {
    const film: HumanPerformance = perform(0.1);
    const pick: HumanSegment.ISegment = film.segments("a")[0]!;
    const lifted: number =
      pick.start +
      (pick.plan.events.find((e): boolean => e.name === "lifted")?.share ??
        Number.NaN) *
        pick.plan.duration;
    const raised: number = film.prop("glass", lifted).position.y - at.y;
    if (!(raised >= 0.09))
      complaints.push(
        `${name}: lifted 0.1 m, the glass rises ${(raised * 1000).toFixed(0)} mm by lifted, at least 90 expected`,
      );
  } catch (error) {
    complaints.push(
      `${name}: lifted 0.1 m: expected to plan, got ${said(error)}`,
    );
  }

  // 2. What cannot be done is refused.
  let thrown: unknown = null;
  try {
    perform(1.2);
  } catch (error) {
    thrown = error;
  }
  if (
    !(
      thrown instanceof HumanRefusal &&
      thrown.kind === "reach" &&
      thrown.axis === "lift" &&
      /lift it less/.test(thrown.fix ?? "")
    )
  )
    complaints.push(
      `${name}: lifted 1.2 m: expected a reach refusal on lift that names a smaller lift, got ${said(thrown)}`,
    );

  TestValidator.equals(
    `a pick up lifts what it is asked or refuses (${name})`,
    complaints,
    [],
  );
}
