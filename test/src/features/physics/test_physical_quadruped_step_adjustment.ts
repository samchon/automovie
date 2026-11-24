import {
  physicalQuadrupedStep,
  physicalQuadrupedStepAdjustment,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../internal/vclose";

/**
 * The quadruped step adjustment moves a swinging step's goal as IHMC's
 * `QuadrupedStepAdjustmentController` does: toward the DCM's error, delta =
 * -gain exp(omega T) (xi_d - xi) horizontally, at most 5 m/s, and the crossover
 * projection keeps the goal on its own side of the other leg of its end
 * (`QuadrupedStepCrossoverProjection`, 0.075 m clearance, 1 m stride).
 *
 * Scenarios, omega = 3.5 per second and a 1 ms update:
 *
 * 1. Magnitude and sign: a DCM ahead of its plan by e = (0.05, -0.02, -0.01) m
 *    with 0.2 s to touchdown targets exp(0.7) (0.05, -0.02, 0); the goal moves
 *    5 mm along it per update, 105 mm after 21 updates, and reaches the target
 *    on the 22nd.
 * 2. At touchdown, T = 0, the target is the error itself.
 * 3. No error and no earlier adjustment move nothing and report none.
 * 4. Adjustment switched off targets zero, so the applied adjustment returns at
 *    the same rate.
 * 5. `completed` clears the leg, so its next step starts from zero.
 * 6. Crossover: a front left goal crossed to the right of the front right sole is
 *    pushed back to 0.075 m left of it, and the front right likewise to 0.075 m
 *    right of the front left; a 1.55 m forward or a 1.6 m lateral stride is cut
 *    to 1 m; a goal on its own side within the limits is kept; the same
 *    crossing in a body turned a quarter turn is projected in that body's
 *    frame; the goal's height is kept.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law, its parameters and every scenario's expected goal.
 * @evidence contracts/development/testing.md#behavioral-verification Advances the adjustment update by update and reads the goals and flag it returns, and calls the projection directly.
 * @evidence contracts/development/testing.md#independent-expectations The targets follow the reference's law by hand, the per-update motion from its 5 m/s limit times the period, and the projected goals from its stride and clearance clamps.
 * @evidence contracts/development/testing.md#distinguishing-cases A flipped sign or a missing exp(omega T) fails 1 and 2; a missing rate limit reaches the target at once in 1; an adjustment without error fails 3; a limit that does not apply when returning fails 4; a leg not cleared fails 5; a projection on the wrong side, in the world frame or dropping the height fails 6.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation on in-memory states.
 */
export function test_physical_quadruped_step_adjustment(): void {
  const soles: Record<
    physicalQuadrupedStep.Quadrant,
    physicalQuadrupedStep.IPoint
  > = {
    frontLeft: { x: 0.25, y: 0.1, z: 0 },
    frontRight: { x: 0.25, y: -0.1, z: 0 },
    hindRight: { x: -0.25, y: -0.1, z: 0 },
    hindLeft: { x: -0.25, y: 0.1, z: 0 },
  };
  const body: physicalQuadrupedStep.IPose = {
    position: { x: 0, y: 0, z: 0.3 },
    yaw: 0,
  };
  const goal: physicalQuadrupedStep.IPoint = { x: 0.3, y: 0.1, z: 0 };
  const step: physicalQuadrupedStep.IStep = {
    quadrant: "frontLeft",
    goal,
    groundClearance: 0.1,
    start: -0.1,
    end: 0.2,
  };
  const estimate: physicalQuadrupedStep.IPoint = { x: 0.05, y: -0.02, z: 0.29 };
  const desired: physicalQuadrupedStep.IPoint = { x: 0, y: 0, z: 0.3 };

  // Runs updates at a fixed time and returns the last result.
  const run: (
    state: physicalQuadrupedStepAdjustment.IState,
    updates: number,
    overrides?: {
      time?: number;
      estimate?: physicalQuadrupedStep.IPoint;
      use?: boolean;
    },
  ) => physicalQuadrupedStepAdjustment.IResult = (
    state: physicalQuadrupedStepAdjustment.IState,
    updates: number,
    overrides: {
      time?: number;
      estimate?: physicalQuadrupedStep.IPoint;
      use?: boolean;
    } = {},
  ): physicalQuadrupedStepAdjustment.IResult => {
    let result: physicalQuadrupedStepAdjustment.IResult = {
      state,
      steps: [],
      adjusted: false,
    };
    for (let i: number = 0; i < updates; i++)
      result = physicalQuadrupedStepAdjustment({
        state: result.state,
        steps: [step],
        desired,
        estimate: overrides.estimate ?? estimate,
        time: overrides.time ?? 0,
        omega: 3.5,
        dt: 0.001,
        soles,
        body,
        parameters: { useStepAdjustment: overrides.use ?? true },
      });
    return result;
  };
  // How far the step's goal moved.
  const moved: (
    result: physicalQuadrupedStepAdjustment.IResult,
  ) => physicalQuadrupedStep.IPoint = (
    result: physicalQuadrupedStepAdjustment.IResult,
  ): physicalQuadrupedStep.IPoint => ({
    x: result.steps[0]!.goal.x - goal.x,
    y: result.steps[0]!.goal.y - goal.y,
    z: result.steps[0]!.goal.z - goal.z,
  });

  // 1. The target, its direction and the rate limit.
  const growth: number = Math.exp(3.5 * 0.2);
  const target: physicalQuadrupedStep.IPoint = {
    x: 0.05 * growth,
    y: -0.02 * growth,
    z: 0,
  };
  const size: number = Math.hypot(target.x, target.y);
  // A distance along the target.
  const along: (distance: number) => physicalQuadrupedStep.IPoint = (
    distance: number,
  ): physicalQuadrupedStep.IPoint => ({
    x: (target.x / size) * distance,
    y: (target.y / size) * distance,
    z: 0,
  });
  const initial: physicalQuadrupedStepAdjustment.IState =
    physicalQuadrupedStepAdjustment.initial();
  const first: physicalQuadrupedStepAdjustment.IResult = run(initial, 1);
  TestValidator.predicate(
    "first update",
    vclose(moved(first), along(0.005), 1e-12),
  );
  TestValidator.equals("adjusted", first.adjusted, true);
  TestValidator.predicate(
    "rate limited",
    vclose(moved(run(initial, 21)), along(0.105), 1e-9),
  );
  const reached: physicalQuadrupedStepAdjustment.IResult = run(initial, 22);
  TestValidator.predicate("reached", vclose(moved(reached), target, 1e-12));

  // 2. At touchdown the multiplier is one.
  TestValidator.predicate(
    "touchdown",
    vclose(
      moved(run(initial, 100, { time: 0.2 })),
      { x: 0.05, y: -0.02, z: 0 },
      1e-12,
    ),
  );

  // 3. No error, no earlier adjustment: nothing moves.
  const still: physicalQuadrupedStepAdjustment.IResult = run(initial, 1, {
    estimate: desired,
  });
  TestValidator.predicate(
    "still",
    vclose(moved(still), { x: 0, y: 0, z: 0 }, 0),
  );
  TestValidator.equals("not adjusted", still.adjusted, false);

  // 4. Switched off, the applied adjustment returns at the rate limit.
  TestValidator.predicate(
    "returning",
    vclose(
      moved(run(reached.state, 1, { use: false })),
      along(size - 0.005),
      1e-9,
    ),
  );

  // 5. A completed leg starts again from zero.
  TestValidator.predicate(
    "completed",
    vclose(
      moved(
        run(
          physicalQuadrupedStepAdjustment.completed(reached.state, "frontLeft"),
          1,
        ),
      ),
      along(0.005),
      1e-12,
    ),
  );

  // 6. The crossover projection.
  const project: (
    quadrant: physicalQuadrupedStep.Quadrant,
    point: physicalQuadrupedStep.IPoint,
    frame?: physicalQuadrupedStep.IPose,
    feet?: Record<physicalQuadrupedStep.Quadrant, physicalQuadrupedStep.IPoint>,
  ) => physicalQuadrupedStep.IPoint = (
    quadrant: physicalQuadrupedStep.Quadrant,
    point: physicalQuadrupedStep.IPoint,
    frame: physicalQuadrupedStep.IPose = body,
    feet: Record<
      physicalQuadrupedStep.Quadrant,
      physicalQuadrupedStep.IPoint
    > = soles,
  ): physicalQuadrupedStep.IPoint =>
    physicalQuadrupedStepAdjustment.project({
      goal: point,
      quadrant,
      soles: feet,
      body: frame,
    });
  TestValidator.predicate(
    "left crossing",
    vclose(
      project("frontLeft", { x: 0.25, y: -0.2, z: 0.03 }),
      {
        x: 0.25,
        y: -0.025,
        z: 0.03,
      },
      1e-12,
    ),
  );
  TestValidator.predicate(
    "right crossing",
    vclose(
      project("frontRight", { x: 0.25, y: 0.15, z: 0 }),
      {
        x: 0.25,
        y: 0.025,
        z: 0,
      },
      1e-12,
    ),
  );
  TestValidator.predicate(
    "forward stride",
    vclose(
      project("frontLeft", { x: 1.8, y: 0.3, z: 0 }),
      { x: 1.25, y: 0.3, z: 0 },
      1e-12,
    ),
  );
  TestValidator.predicate(
    "lateral stride",
    vclose(
      project("frontLeft", { x: 0.25, y: 1.5, z: 0 }),
      { x: 0.25, y: 0.9, z: 0 },
      1e-12,
    ),
  );
  TestValidator.predicate(
    "own side",
    vclose(
      project("hindLeft", { x: -0.2, y: 0.12, z: 0 }),
      { x: -0.2, y: 0.12, z: 0 },
      1e-12,
    ),
  );
  TestValidator.predicate(
    "turned body",
    vclose(
      project(
        "frontLeft",
        { x: 1.2, y: 1.25, z: 0 },
        { position: { x: 1, y: 1, z: 0 }, yaw: Math.PI / 2 },
        { ...soles, frontRight: { x: 1.1, y: 1.25, z: 0 } },
      ),
      { x: 1.025, y: 1.25, z: 0 },
      1e-12,
    ),
  );
}
