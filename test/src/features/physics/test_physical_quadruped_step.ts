import { physicalQuadrupedStep } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/**
 * The quadruped vocabulary follows IHMC's `RobotQuadrant` and support frame:
 * the regular gait swings front left, hind right, front right, hind left, the
 * across-body leg shares the end, and the support frame sits at the soles'
 * mean, as high as the mean of the lowest front and hind soles, headed from the
 * hind to the front feet.
 *
 * Scenarios:
 *
 * 1. `next` cycles the four legs in the regular gait order and `previous` undoes
 *    it.
 * 2. `across` swaps left and right within an end; `front` and `left` name the end
 *    and side.
 * 3. A 0.5 x 0.2 m stance turned 30 degrees about (1, 2) with uneven soles gives
 *    the frame at (1, 2), height (0 + 0.01) / 2, headed 30 degrees.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the order, the pairing and the frame's expected pose.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the quadrant functions and the support frame and reads their results.
 * @evidence contracts/development/testing.md#independent-expectations The order is the reference's gait cycle; the frame's pose follows from the turned rectangle's geometry by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases A crawl order or an inverse that is not one fails 1; a diagonal partner fails 2; a mean height or a left-right heading fails 3.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation on in-memory points.
 */
export function test_physical_quadruped_step(): void {
  // 1. The regular gait's cycle and its inverse.
  const order: physicalQuadrupedStep.Quadrant[] = [];
  let quadrant: physicalQuadrupedStep.Quadrant = "frontLeft";
  for (let i: number = 0; i < 4; i++) {
    order.push(quadrant);
    quadrant = physicalQuadrupedStep.next(quadrant);
  }
  TestValidator.equals("cycle", order, [
    "frontLeft",
    "hindRight",
    "frontRight",
    "hindLeft",
  ]);
  TestValidator.predicate(
    "inverse",
    physicalQuadrupedStep.QUADRANTS.every(
      (leg: physicalQuadrupedStep.Quadrant): boolean =>
        physicalQuadrupedStep.previous(physicalQuadrupedStep.next(leg)) === leg,
    ),
  );

  // 2. Ends and sides.
  TestValidator.equals(
    "across",
    physicalQuadrupedStep.QUADRANTS.map(physicalQuadrupedStep.across),
    ["frontRight", "frontLeft", "hindLeft", "hindRight"],
  );
  TestValidator.equals(
    "end and side",
    physicalQuadrupedStep.QUADRANTS.map(
      (leg: physicalQuadrupedStep.Quadrant): [boolean, boolean] => [
        physicalQuadrupedStep.front(leg),
        physicalQuadrupedStep.left(leg),
      ],
    ),
    [
      [true, true],
      [true, false],
      [false, false],
      [false, true],
    ],
  );

  // 3. The support frame of a turned stance.
  const yaw: number = Math.PI / 6;
  const place: (
    x: number,
    y: number,
    z: number,
  ) => physicalQuadrupedStep.IPoint = (
    x: number,
    y: number,
    z: number,
  ): physicalQuadrupedStep.IPoint => ({
    x: 1 + Math.cos(yaw) * x - Math.sin(yaw) * y,
    y: 2 + Math.sin(yaw) * x + Math.cos(yaw) * y,
    z,
  });
  const frame: physicalQuadrupedStep.IPose = physicalQuadrupedStep.support({
    frontLeft: place(0.25, 0.1, 0.02),
    frontRight: place(0.25, -0.1, 0),
    hindRight: place(-0.25, -0.1, 0.01),
    hindLeft: place(-0.25, 0.1, 0.03),
  });
  TestValidator.predicate(
    "support",
    vclose(frame.position, { x: 1, y: 2, z: 0.005 }, 1e-12) &&
      nclose(frame.yaw, yaw, 1e-12),
  );
}
