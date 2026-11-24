import {
  physicalQuadrupedContactSequence,
  physicalQuadrupedCopTrajectory,
  physicalQuadrupedDcmPlanner,
  physicalQuadrupedReverseDcmTrajectory,
  physicalQuadrupedStep,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/**
 * The quadruped DCM planner gives the DCM setpoint IHMC's `DCMPlanner` does: at
 * rest over the support frame when standing, and when stepping the
 * backward-integrated DCM over the steps' piecewise-constant centre of
 * pressure, entered through a cubic from the last setpoint.
 *
 * Scenarios, soles 0.5 x 0.25 m about the origin, a 0.3 m centre of mass, g =
 * 9.81 m/s^2:
 *
 * 1. Contact sequence: a trot pair lifting at 0.3 s and landing at 0.63 s gives
 *    three phases, all four legs, the other diagonal, then all four with the
 *    pair's soles at their goals, the last lasting 1 s.
 * 2. Centre of pressure: each end carries half when both stand, split within the
 *    end, so a phase on the front right and both hind legs weighs them 0.5,
 *    0.25 and 0.25; a phase without contact lies at the origin.
 * 3. Reverse DCM: one interval from rest over the origin reaching 0.1 m at 1 s is
 *    the pendulum's solution 0.1 exp(omega (t - 1)), with rate omega times the
 *    offset, and holds its ends outside its span; more intervals than the
 *    buffer's 50 throw.
 * 4. Standing: xi_d is the soles' mean, its height the mean of the lowest front
 *    and hind soles plus 0.3 m, at rest.
 * 5. Stepping: the setpoint starts at the entry's setpoint, the transition ends at
 *    the plan's second interval, 0.3 s, or 0.5 s after entry, whichever is
 *    first, it hands over to the plan without a jump, and the plan ends at rest
 *    over the last centre of pressure.
 * 6. Stepping with every step landed keeps the plan untouched, and with no step
 *    throws.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the setup and every scenario's expected phases, points and handover.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the sequence, the centre of pressure, the reverse trajectory and the planner through standing and stepping updates and reads their outputs.
 * @evidence contracts/development/testing.md#independent-expectations Phases and pressures follow the reference's rules by hand, the reverse trajectory is checked against the pendulum's closed-form solution and dynamics, and the handover against continuity of the setpoint.
 * @evidence contracts/development/testing.md#distinguishing-cases Unsorted or ungrouped transitions fail 1; even per-leg pressure fails the three-leg case of 2; a forward-integrated or wrongly signed exponential fails 3; a centroid without the lowest-height rule fails 4; a transition ending at 0.5 s or not reaching the plan fails 5; a replanned invalid entry fails 6.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation on in-memory plans.
 */
export function test_physical_quadruped_dcm_planner(): void {
  const soles: Record<
    physicalQuadrupedStep.Quadrant,
    physicalQuadrupedStep.IPoint
  > = {
    frontLeft: { x: 0.25, y: 0.1, z: 0 },
    frontRight: { x: 0.25, y: -0.15, z: 0 },
    hindRight: { x: -0.25, y: -0.1, z: 0 },
    hindLeft: { x: -0.25, y: 0.1, z: 0 },
  };
  const all: Record<physicalQuadrupedStep.Quadrant, boolean> = {
    frontLeft: true,
    frontRight: true,
    hindRight: true,
    hindLeft: true,
  };
  const steps: physicalQuadrupedStep.IStep[] = [
    {
      quadrant: "frontLeft",
      goal: { x: 0.35, y: 0.1, z: 0 },
      groundClearance: 0.1,
      start: 0.3,
      end: 0.63,
    },
    {
      quadrant: "hindRight",
      goal: { x: -0.15, y: -0.1, z: 0 },
      groundClearance: 0.1,
      start: 0.3,
      end: 0.63,
    },
  ];
  const height: number = 0.3;
  const gravity: number = 9.81;
  const omega: number = Math.sqrt(gravity / height);

  // 1. The trot pair's phases.
  const phases: physicalQuadrupedContactSequence.IPhase[] =
    physicalQuadrupedContactSequence({
      phases: [],
      steps,
      soles,
      contact: all,
      time: 0,
    });
  TestValidator.equals(
    "phase contacts",
    phases.map(
      (
        phase: physicalQuadrupedContactSequence.IPhase,
      ): [number, Record<physicalQuadrupedStep.Quadrant, boolean>] => [
        phase.start,
        phase.contact,
      ],
    ),
    [
      [0, all],
      [0.3, { ...all, frontLeft: false, hindRight: false }],
      [0.63, all],
    ],
  );
  TestValidator.predicate(
    "phase ends",
    nclose(phases[0]!.end, 0.3, 1e-12) &&
      nclose(phases[1]!.end, 0.63, 1e-12) &&
      nclose(phases[2]!.end, 1.63, 1e-12),
  );
  TestValidator.equals("landed soles", phases[2]!.soles, {
    ...soles,
    frontLeft: steps[0]!.goal,
    hindRight: steps[1]!.goal,
  });

  // 2. Pressure by end: a three-leg phase and a phase without contact.
  const [three, none]: physicalQuadrupedCopTrajectory.IInterval[] =
    physicalQuadrupedCopTrajectory([
      { start: 0, end: 1, contact: { ...all, frontLeft: false }, soles },
      {
        start: 1,
        end: 2,
        contact: {
          frontLeft: false,
          frontRight: false,
          hindRight: false,
          hindLeft: false,
        },
        soles,
      },
    ]);
  TestValidator.predicate(
    "three-leg pressure centre",
    vclose(three!.cop, { x: 0, y: -0.075, z: 0 }, 1e-6),
  );
  TestValidator.predicate(
    "no contact",
    vclose(none!.cop, { x: 0, y: 0, z: 0 }, 0),
  );

  // 3. The reverse trajectory against the pendulum's solution.
  const reverse: physicalQuadrupedReverseDcmTrajectory.ITrajectory =
    physicalQuadrupedReverseDcmTrajectory({
      times: [0],
      cops: [{ x: 0, y: 0, z: 0 }],
      finalTime: 1,
      finalDcm: { x: 0.1, y: 0, z: height },
      comHeight: height,
      gravity,
    });
  const middle: physicalQuadrupedReverseDcmTrajectory.ISample =
    physicalQuadrupedReverseDcmTrajectory.evaluate(reverse, 0.5);
  TestValidator.predicate(
    "pendulum",
    nclose(middle.position.x, 0.1 * Math.exp(-omega * 0.5), 1e-12) &&
      nclose(middle.velocity.x, omega * middle.position.x, 1e-12) &&
      nclose(middle.position.z, height, 1e-12),
  );
  TestValidator.predicate(
    "clamped span",
    nclose(
      physicalQuadrupedReverseDcmTrajectory.evaluate(reverse, 2).position.x,
      0.1,
      1e-12,
    ) &&
      nclose(
        physicalQuadrupedReverseDcmTrajectory.evaluate(reverse, -1).position.x,
        0.1 * Math.exp(-omega),
        1e-12,
      ),
  );
  TestValidator.error("buffer", () =>
    physicalQuadrupedReverseDcmTrajectory({
      times: Array.from({ length: 51 }, (_: unknown, i: number): number => i),
      cops: Array.from(
        { length: 51 },
        (): physicalQuadrupedStep.IPoint => ({ x: 0, y: 0, z: 0 }),
      ),
      finalTime: 51,
      finalDcm: { x: 0, y: 0, z: height },
      comHeight: height,
      gravity,
    }),
  );

  // 4. Standing over the support frame's origin.
  const uneven: Record<
    physicalQuadrupedStep.Quadrant,
    physicalQuadrupedStep.IPoint
  > = {
    frontLeft: { ...soles.frontLeft, z: 0.02 },
    frontRight: { ...soles.frontRight, z: 0 },
    hindRight: { ...soles.hindRight, z: 0.01 },
    hindLeft: { ...soles.hindLeft, z: 0.03 },
  };
  const standing: physicalQuadrupedDcmPlanner.IState =
    physicalQuadrupedDcmPlanner.standing();
  const stood: physicalQuadrupedDcmPlanner.IResult =
    physicalQuadrupedDcmPlanner({
      state: standing,
      steps: [],
      soles: uneven,
      contact: all,
      time: 0,
      comHeight: height,
      gravity,
    });
  TestValidator.predicate(
    "standing",
    vclose(stood.position, { x: 0, y: -0.0125, z: 0.005 + height }, 1e-12) &&
      vclose(stood.velocity, { x: 0, y: 0, z: 0 }, 0),
  );

  // 5. Stepping: entry, transition and handover.
  const update: (
    state: physicalQuadrupedDcmPlanner.IState,
    time: number,
    contact: Record<physicalQuadrupedStep.Quadrant, boolean>,
    feet?: Record<physicalQuadrupedStep.Quadrant, physicalQuadrupedStep.IPoint>,
  ) => physicalQuadrupedDcmPlanner.IResult = (
    state: physicalQuadrupedDcmPlanner.IState,
    time: number,
    contact: Record<physicalQuadrupedStep.Quadrant, boolean>,
    feet: Record<
      physicalQuadrupedStep.Quadrant,
      physicalQuadrupedStep.IPoint
    > = soles,
  ): physicalQuadrupedDcmPlanner.IResult =>
    physicalQuadrupedDcmPlanner({
      state,
      steps,
      soles: feet,
      contact,
      time,
      comHeight: height,
      gravity,
    });
  const entry: physicalQuadrupedStep.IPoint = { x: 0.01, y: -0.02, z: height };
  const entered: physicalQuadrupedDcmPlanner.IState =
    physicalQuadrupedDcmPlanner.stepping({
      state: standing,
      steps,
      soles,
      contact: all,
      time: 0,
      comHeight: height,
      gravity,
      position: entry,
      velocity: { x: 0, y: 0, z: 0 },
    });
  TestValidator.equals("transition end", entered.transition?.end, 0.3);
  const start: physicalQuadrupedDcmPlanner.IResult = update(entered, 0, all);
  TestValidator.predicate(
    "transition start",
    vclose(start.position, entry, 1e-12) &&
      vclose(start.velocity, { x: 0, y: 0, z: 0 }, 1e-12),
  );
  const handed: physicalQuadrupedDcmPlanner.IResult = update(
    start.state,
    0.3,
    all,
  );
  const after: physicalQuadrupedDcmPlanner.IResult = update(
    handed.state,
    0.3 + 1e-6,
    {
      ...all,
      frontLeft: false,
      hindRight: false,
    },
  );
  TestValidator.predicate(
    "handover",
    vclose(handed.position, after.position, 1e-5) &&
      vclose(handed.velocity, after.velocity, 1e-3),
  );
  const rest: physicalQuadrupedDcmPlanner.IResult = update(
    after.state,
    0.7,
    all,
    {
      ...soles,
      frontLeft: steps[0]!.goal,
      hindRight: steps[1]!.goal,
    },
  );
  TestValidator.predicate(
    "at rest",
    vclose(rest.position, { x: 0.05, y: -0.0125, z: height }, 1e-6) &&
      vclose(rest.velocity, { x: 0, y: 0, z: 0 }, 1e-9),
  );
  TestValidator.equals(
    "later transition end",
    physicalQuadrupedDcmPlanner.stepping({
      state: standing,
      steps: steps.map(
        (step: physicalQuadrupedStep.IStep): physicalQuadrupedStep.IStep => ({
          ...step,
          start: 0.8,
          end: 1.13,
        }),
      ),
      soles,
      contact: all,
      time: 0,
      comHeight: height,
      gravity,
      position: entry,
      velocity: { x: 0, y: 0, z: 0 },
    }).transition?.end,
    0.5,
  );

  // 6. An entry after every step landed, and one with no step.
  const stale: physicalQuadrupedDcmPlanner.IState =
    physicalQuadrupedDcmPlanner.stepping({
      state: standing,
      steps,
      soles,
      contact: all,
      time: 1,
      comHeight: height,
      gravity,
      position: entry,
      velocity: { x: 0, y: 0, z: 0 },
    });
  TestValidator.equals("stale entry", stale, { ...standing, standing: false });
  TestValidator.error("no step", () =>
    physicalQuadrupedDcmPlanner.stepping({
      state: standing,
      steps: [],
      soles,
      contact: all,
      time: 0,
      comHeight: height,
      gravity,
      position: entry,
      velocity: { x: 0, y: 0, z: 0 },
    }),
  );
}
