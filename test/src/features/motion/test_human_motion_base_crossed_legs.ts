import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanFrame,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
  seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A person seated with the ankles crossed has the left ankle set down
 * across the right one, both feet on the floor, and stands up from it
 * again; a sit too short to cross the legs in is refused.
 *
 * Scenarios, on the average man and the small woman, each on a chair as
 * high as their own popliteal height, 0.1 m behind the heels:
 * 1. `sit` with `legs: "crossed"` and 1.5 s seated plans; at its end, in
 *    the seat's frame, the left ankle lies to the right of the right ankle
 *    and ahead of it: the ankles are crossed.
 * 2. At the end both feet bear on the floor.
 * 3. `rise` after it plans and ends with both feet bearing.
 * 4. The same sit with 0.2 s seated is refused as a `parameter` refusal on
 *    `seconds` with the least time that works: crossing takes longer.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the crossed sit and the rise through the public chain and reads the displayed ankles and soles; ankles left parallel, a foot left in the air, or a too-short sit accepted fails.
 * @evidence contracts/development/testing.md#independent-expectations Which ankle lies where is what crossed ankles are; that a foot set down bears is the floor's. Nothing is read from the sit's own placement constants. Limitation: where exactly the crossing ankle rests is not asserted, since no measured posture was read.
 * @evidence contracts/development/testing.md#distinguishing-cases The crossed posture against the parallel one's order of the ankles, the way back up, and the refusal at the boundary of the time it needs, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds three short performances each in memory, reading two instants: both builds, since the crossing is laid out by the body's own foot spacing.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 4 scenarios.
 */
export function test_human_motion_base_crossed_legs(): void {
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const chair: seated.ISeat = {
      at: { x: 0, y: seated.popliteal(body), z: -0.1 },
      yaw: 0,
      depth: 0.45,
    };
    const perform = (seconds: number, rises: boolean): HumanPerformance => {
      const sitting: HumanChain = HumanChain.subject("a").sit({
        seat: chair,
        legs: "crossed",
        seconds,
      });
      return new HumanPerformance({
        seed: "crossed",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: (rises ? sitting.rise() : sitting).node,
      });
    };

    // 4. Too short to cross in.
    let thrown: unknown = null;
    try {
      perform(0.2, false);
    } catch (error) {
      thrown = error;
    }
    if (
      !(
        thrown instanceof HumanRefusal &&
        thrown.kind === "parameter" &&
        thrown.axis === "seconds"
      )
    )
      complaints.push(
        `${name}: a crossed sit of 0.2 s: expected a parameter refusal on seconds, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
      );

    // 1 to 3. Crossed, on the floor, and up again.
    let performance: HumanPerformance;
    try {
      performance = perform(1.5, true);
    } catch (error) {
      complaints.push(
        `${name}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const sitting: HumanSegment.ISegment = performance.segments("a")[0]!;
    const rising: HumanSegment.ISegment = performance.segments("a")[1]!;
    const reader: HumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      body,
      0,
    );
    const end: number = sitting.end - 0.05;
    const ankle = (side: "left" | "right"): IAutoMovieVector3 =>
      HumanFrame.local(
        { origin: { ...chair.at, y: 0 }, yaw: chair.yaw },
        HumanSignature.joint(reader, end, `${side}Foot`),
      );
    const left: IAutoMovieVector3 = ankle("left");
    const right: IAutoMovieVector3 = ankle("right");
    if (!(left.x < right.x && left.z > right.z))
      complaints.push(
        `${name}: seated, the left ankle lies ${(left.x - right.x).toFixed(3)} m to the left of the right one and ${(left.z - right.z).toFixed(3)} m ahead of it; to its right and ahead expected`,
      );
    for (const side of ["left", "right"] as const) {
      if (!HumanSignature.bears(reader, end, side))
        complaints.push(
          `${name}: seated with the ankles crossed, the ${side} foot does not bear on the floor`,
        );
      if (!HumanSignature.bears(reader, rising.end, side))
        complaints.push(
          `${name}: risen from the crossed sit, the ${side} foot does not bear on the floor`,
        );
    }
  }
  TestValidator.equals("the ankles cross and uncross", complaints, []);
}
