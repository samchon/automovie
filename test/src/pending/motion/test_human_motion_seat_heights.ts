import {
  createBicycle,
  createHorse,
  createMotorcycle,
  createSeat,
} from "@automovie/archetypes";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../features/internal/motionHumanBody";

/**
 * People sit on the seats rooms have: every adult sits on a standard dining
 * chair, with the feet short of the floor if she is small, and on a bar
 * stool, with the feet on its footrest.
 *
 * Pending: `sit` accepts a seat only between 0.8 and 1.2 of the body's
 * popliteal height, with both feet on the floor. On the mid-band archetypes
 * the dining chair (seat 0.444 m) is refused for the small woman at 1.23 of
 * her popliteal height (she is offered 0.290 to 0.434 m), and the bar stool
 * (0.787 m) for everyone: 1.86 for the average man and 2.18 for the small
 * woman. A high seat needs a base the law lacks: the feet on a footrest or
 * hanging, and a mount by a step or a hop instead of a descent.
 *
 * The same blocks every saddle: for the average man a motorcycle's seat
 * (0.795 m) is 1.88 of the popliteal height, a bicycle's saddle (0.954 m)
 * 2.26 and a horse's (1.645 m) 3.89, so no one can mount what `HumanRide`
 * would then carry.
 *
 * Scenarios, on the small woman, the average man and the large man:
 * 1. Each sits on a mid-band dining chair.
 * 2. Each sits on a mid-band bar stool.
 * 3. Each sits on a motorcycle's seat, a bicycle's saddle and a horse's
 *    saddle.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places real archetypes and builds the sitting through the public chain; a refused sitting fails.
 * @evidence contracts/development/testing.md#independent-expectations That adults sit on dining chairs and bar stools is what those seats are made for; their heights are the archetypes' cited bands.
 * @evidence contracts/development/testing.md#distinguishing-cases Five seat heights by three statures.
 * @evidence contracts/development/testing.md#execution-ownership Prepares polygon men; a pending specification until the base axis gives high seats their supports.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, why the file is pending with its numbers, and the 3 scenarios.
 */
export function test_human_motion_seat_heights(): void {
  const complaints: string[] = [];
  for (const name of ["f-small", "m-average", "m-large"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    for (const [kind, model] of [
      ["dining chair", createSeat({ kind: "dining" })],
      ["bar stool", createSeat({ kind: "barStool" })],
      ["motorcycle", createMotorcycle({ kind: "motorcycle" })],
      ["bicycle", createBicycle({})],
      ["horse", createHorse({})],
    ] as const) {
      const seat = HumanObject.seat(model, {
        at: { x: 0, y: 0, z: -0.6 },
        yaw: 0,
      });
      try {
        new HumanPerformance({
          seed: "seats",
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: seat.at.z + 0.2 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          composition: HumanChain.subject("a").sit({ seat }).node,
        });
      } catch (error) {
        complaints.push(
          `${name} on a ${kind}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
  TestValidator.equals("people sit on the seats rooms have", complaints, []);
}
