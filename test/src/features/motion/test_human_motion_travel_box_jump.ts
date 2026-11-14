import {
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A jump lands at the height of what it lands on: onto a box, the feet come
 * to rest on its top and the body stands that much higher; down from it,
 * back on the floor; and a flight too low to clear the box is refused.
 *
 * Scenarios, the average man and the small woman, each standing on the
 * floor 0.6 m before the middle of a 0.4 m box (a plyometric box's common
 * height; the gym rows set their own):
 * 1. A jump onto the box's top, then a jump down to the floor 0.6 m beyond
 *    it, plan.
 * 2. When the first jump has absorbed and risen to standing, the soles of
 *    both feet are within 15 mm of the box's top (the campaign's bound for
 *    a contact at its event) and the hip joints stand 0.4 m higher than at
 *    the start, within 20 mm (a provisional reading of "standing on it").
 * 3. When the second jump has risen to standing, the soles are within 15 mm
 *    of the floor and the hips at their starting height within 20 mm.
 * 4. The jump onto the box with an apex of 0.2 m, below what the body's
 *    centre must rise to land on it, is refused as a `reach` refusal on
 *    `apex`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the jumps through the public chain and reads the displayed soles and hips; feet that land at the floor's height inside the box, a body left low, or a flight that could not clear the box accepted fails.
 * @evidence contracts/development/testing.md#independent-expectations The box's height is the scene's own and the hips' rise is that height, by what standing on a surface means; the 15 mm is the campaign's bound. Limitation: the flight's path over the box's edge is not read.
 * @evidence contracts/development/testing.md#distinguishing-cases Up onto a surface, down from it, and a flight too low, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds two performances and two refused plans in memory, reading three instants of each.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 4 scenarios with their bounds.
 */
export function test_human_motion_travel_box_jump(): void {
  const complaints: string[] = [];
  const BOX: number = 0.4;
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const perform = (apex?: number): HumanPerformance =>
      new HumanPerformance({
        seed: "box-jump",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .jump({
            to: { x: 0, y: BOX, z: 0.6 },
            ...(apex === undefined ? {} : { apex }),
          })
          .jump({ to: { x: 0, y: 0, z: 1.2 } }).node,
      });

    // 4. Too low to clear the box.
    let thrown: unknown = null;
    try {
      perform(0.2);
    } catch (error) {
      thrown = error;
    }
    if (
      !(
        thrown instanceof HumanRefusal &&
        thrown.kind === "reach" &&
        thrown.axis === "apex"
      )
    )
      complaints.push(
        `${name}: a jump onto the box with a 0.2 m apex, expected a reach refusal on apex, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
      );

    // 1 to 3. Up and down.
    let performance: HumanPerformance;
    try {
      performance = perform();
    } catch (error) {
      complaints.push(
        `${name}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const reader: HumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      body,
      0,
    );
    const [, up, down]: readonly HumanSegment.ISegment[] =
      performance.segments("a");
    const hips = (t: number): number =>
      (HumanSignature.joint(reader, t, "leftUpperLeg").y +
        HumanSignature.joint(reader, t, "rightUpperLeg").y) /
      2;

    for (const [what, segment, height] of [
      ["on the box", up!, BOX],
      ["back on the floor", down!, 0],
    ] as const) {
      // The jump's last instant: absorbed and risen to standing.
      const t: number = segment.end - 1e-3;
      for (const side of ["left", "right"] as const) {
        const sole: number = HumanSignature.sole(reader, t, side).y;
        if (Math.abs(sole - height) > 0.015)
          complaints.push(
            `${name} ${what}: the ${side} sole is at ${sole.toFixed(3)} m, within 15 mm of ${height} m expected`,
          );
      }
      const raised: number = hips(t) - hips(0);
      if (Math.abs(raised - height) > 0.02)
        complaints.push(
          `${name} ${what}: the hips stand ${raised.toFixed(3)} m above where they started, ${height} m within 20 mm expected`,
        );
    }
  }
  TestValidator.equals("a jump lands at its surface's height", complaints, []);
}
