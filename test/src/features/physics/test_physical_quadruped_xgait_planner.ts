import {
  physicalQuadrupedStep,
  physicalQuadrupedXGaitPlanner,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/**
 * At zero velocity the xGait stream plans IHMC's step order and timing
 * (`QuadrupedXGaitPlanner`, `QuadrupedXGaitTools`): with the generic
 * quadruped's 0.33 s swings and 0.1 s end double support, lift-offs one phase
 * share of 0.43 s apart, the first one 0.5 s after entry, on the corners of the
 * stance rectangle.
 *
 * Scenarios, entry at 0 s on a support frame at the origin, 0.5 x 0.2 m:
 *
 * 1. Amble, 90 degrees: hind right then front left are current, lifting at 0.715
 *    and 0.5 s; the preview goes front right, hind left, front left, hind right
 *    at 0.93, 1.145, 1.36 and 1.575 s, every swing 0.33 s, and each goal is its
 *    leg's corner at the ground's height.
 * 2. Trot, 180 degrees: diagonal pairs lift together, front left with hind right
 *    at 0.5 s and hind left with front right at 0.93 s.
 * 3. An update at 1 s makes the front right step current and keeps the plan's
 *    timing.
 * 4. A plan resumed at 3 s after its steps ended delays late lift-offs to now,
 *    stretches a swing to its 0.495 s cap and keeps a short one at its 0.33 s
 *    floor.
 * 5. The body's stance is kept, 0.3 m long, and only a width below the 0.075 m
 *    minimum clearance is raised to it, the reference's 0.4 x 0.1 m size clamp
 *    not applying; a support frame turned a quarter turn turns the rectangle
 *    with it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the settings, the expected order, times and goals of each scenario.
 * @evidence contracts/development/testing.md#behavioral-verification Enters and updates the stream and reads the steps it hands the controller.
 * @evidence contracts/development/testing.md#independent-expectations The times follow the reference's rules by hand: the shift (0.33 + 0.1) phase / 180, the interval's start one double support after the same end lands and its landing clamped to [0.33, 0.495] s; the goals are the rectangle's corners.
 * @evidence contracts/development/testing.md#distinguishing-cases A wrong gait order or across-body leg fails 1; a phase applied to the wrong end fails 2; a current step not taken at lift-off fails 3; a missing delay or swing clamp fails 4; a stance clamped to the reference robot's size, one not raised to the clearance or an unrotated rectangle fails 5.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation on in-memory plans.
 */
export function test_physical_quadruped_xgait_planner(): void {
  // Whether the steps open with the expected legs and intervals.
  const matches: (
    steps: readonly physicalQuadrupedStep.IStep[],
    expected: readonly [physicalQuadrupedStep.Quadrant, number, number][],
  ) => boolean = (
    steps: readonly physicalQuadrupedStep.IStep[],
    expected: readonly [physicalQuadrupedStep.Quadrant, number, number][],
  ): boolean =>
    expected.every(
      (
        [quadrant, start, end]: [
          physicalQuadrupedStep.Quadrant,
          number,
          number,
        ],
        i: number,
      ): boolean =>
        steps[i]?.quadrant === quadrant &&
        nclose(steps[i]!.start, start, 1e-9) &&
        nclose(steps[i]!.end, end, 1e-9),
    );
  const support: physicalQuadrupedStep.IPose = {
    position: { x: 0, y: 0, z: 0 },
    yaw: 0,
  };
  const stance: Pick<
    physicalQuadrupedXGaitPlanner.ISettings,
    "stanceLength" | "stanceWidth"
  > = { stanceLength: 0.5, stanceWidth: 0.2 };

  // 1. The amble's order, timing and goals.
  const amble: physicalQuadrupedXGaitPlanner.IState =
    physicalQuadrupedXGaitPlanner.entry({
      time: 0,
      settings: stance,
      support,
      height: 0.02,
    });
  const ambled: physicalQuadrupedStep.IStep[] =
    physicalQuadrupedXGaitPlanner.steps(amble, 0);
  TestValidator.equals("amble count", ambled.length, 2 + 16);
  TestValidator.predicate(
    "amble",
    matches(ambled, [
      ["hindRight", 0.715, 1.045],
      ["frontLeft", 0.5, 0.83],
      ["frontRight", 0.93, 1.26],
      ["hindLeft", 1.145, 1.475],
      ["frontLeft", 1.36, 1.69],
      ["hindRight", 1.575, 1.905],
    ]),
  );
  const corners: Record<
    physicalQuadrupedStep.Quadrant,
    physicalQuadrupedStep.IPoint
  > = {
    frontLeft: { x: 0.25, y: 0.1, z: 0.02 },
    frontRight: { x: 0.25, y: -0.1, z: 0.02 },
    hindRight: { x: -0.25, y: -0.1, z: 0.02 },
    hindLeft: { x: -0.25, y: 0.1, z: 0.02 },
  };
  TestValidator.predicate(
    "amble goals",
    ambled.every(
      (step: physicalQuadrupedStep.IStep): boolean =>
        vclose(step.goal, corners[step.quadrant], 1e-12) &&
        step.groundClearance === 0.1,
    ),
  );

  // 2. The trot's diagonal pairs.
  TestValidator.predicate(
    "trot",
    matches(
      physicalQuadrupedXGaitPlanner.steps(
        physicalQuadrupedXGaitPlanner.entry({
          time: 0,
          settings: { ...stance, endPhaseShift: 180 },
          support,
          height: 0,
        }),
        0,
      ),
      [
        ["hindRight", 0.5, 0.83],
        ["frontLeft", 0.5, 0.83],
        ["hindLeft", 0.93, 1.26],
        ["frontRight", 0.93, 1.26],
        ["hindRight", 1.36, 1.69],
        ["frontLeft", 1.36, 1.69],
      ],
    ),
  );

  // 3. An update after the front right lift-off.
  TestValidator.predicate(
    "update",
    matches(
      physicalQuadrupedXGaitPlanner.steps(
        physicalQuadrupedXGaitPlanner({
          state: amble,
          time: 1.0,
          height: 0.02,
        }),
        1.0,
      ),
      [
        ["hindRight", 0.715, 1.045],
        ["frontRight", 0.93, 1.26],
        ["hindLeft", 1.145, 1.475],
        ["frontLeft", 1.36, 1.69],
        ["hindRight", 1.575, 1.905],
      ],
    ),
  );

  // 4. Resumed late: delayed lift-offs, the swing cap and floor.
  TestValidator.predicate(
    "delayed",
    matches(
      physicalQuadrupedXGaitPlanner({
        state: { ...amble, planned: [] },
        time: 3,
        height: 0,
      }).planned,
      [
        ["frontRight", 3, 3.33],
        ["hindLeft", 3, 3.495],
        ["frontLeft", 3.43, 3.76],
      ],
    ),
  );

  // 5. The stance limits and a turned support frame.
  const turned: physicalQuadrupedStep.IStep | undefined =
    physicalQuadrupedXGaitPlanner
      .steps(
        physicalQuadrupedXGaitPlanner.entry({
          time: 0,
          settings: { stanceLength: 0.3, stanceWidth: 0.05 },
          support: { position: { x: 1, y: 2, z: 0 }, yaw: Math.PI / 2 },
          height: 0,
        }),
        0,
      )
      .find(
        (step: physicalQuadrupedStep.IStep): boolean =>
          step.quadrant === "frontLeft",
      );
  TestValidator.predicate(
    "stance and heading",
    turned !== undefined &&
      vclose(turned.goal, { x: 1 - 0.0375, y: 2 + 0.15, z: 0 }, 1e-12),
  );
}
