import {
  physicalBalanceHandoff,
  physicalBalanceRamp,
  physicalBalanceSense,
  physicalBalanceStance,
  physicalGlitchFilter,
  physicalQuadFrame,
  physicalQuadPlan,
  physicalQuadTouchdown,
  physicalQuadrupedXGaitPlanner,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalRecoveryState,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalBalanceReplay } from "../internal/PhysicalBalanceReplay";

/**
 * The quadruped controller's wiring holds IHMC 201903's step controller's
 * rules on a recorded quadruped:
 *
 * 1. Frame: a world point (x, y, z) is IHMC's (z, x, y) and back.
 * 2. Quadrants: the authored stance names its legs, +z ahead and +x left, one
 *    leg per quadrant.
 * 3. Pivot: the DCM controller's virtual repellent point is the estimate
 *    itself at a setpoint on the estimate at rest, and xi - K_p (xi_d - xi) /
 *    omega with the generic quadruped's K_p = 2 at a setpoint off it.
 * 4. Trigger: at the fall case's push the plan enters stepping, its first
 *    step 0.5 s later (`FIRST_STEP_DELAY`), no leg lifted, the setpoint still
 *    the authored one, and omega sqrt(g / h) over the authored centre's height
 *    above the authored soles' support frame.
 * 5. Lift: when the first step begins its leg lifts, its seat given up, its
 *    swing timed by the step and rising by its 0.1 m clearance, its foot's
 *    first trigger spent.
 * 6. Touchdown: a loaded foot does not land before 0.8 of its swing and lands
 *    after it once its trigger has held for the reference's 1 ms, fully
 *    seated, its adjustment cleared; an unloaded foot lands only once its
 *    step's time has run out.
 * 7. Done: a gait halted at its entry prunes every step, ends, and resets the
 *    push recovery's fall.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each rule and its source's value.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the frame, plan and touchdown on recorded readings and reads the states they return.
 * @evidence contracts/development/testing.md#independent-expectations The quadrants come from the fixture's authored layout, the pivot and omega from their closed forms, the times from the reference's 0.5 s delay, 0.33 s step, 0.8 phase and 0.1 m clearance.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates a setpoint on the estimate from one off it, a swing before 0.8 from one after it, a loaded foot from an unloaded one, a running gait from a halted one.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation over the replay fixtures; no native world, viewer or simulation run.
 */
export function test_physical_quad_gait(): void {
  const failures: string[] = [];
  const near = (a: number, b: number): boolean => Math.abs(a - b) < 1e-9;

  // 1. The frame.
  const mapped = physicalQuadFrame.ihmc({ x: 1, y: 2, z: 3 });
  if (mapped.x !== 3 || mapped.y !== 1 || mapped.z !== 2)
    failures.push(`frame: (1, 2, 3) maps to ${JSON.stringify(mapped)}`);
  const back = physicalQuadFrame.world(mapped);
  if (back.x !== 1 || back.y !== 2 || back.z !== 3)
    failures.push(`frame: the way back gives ${JSON.stringify(back)}`);

  const fixture: PhysicalBalanceReplay.IFixture = PhysicalBalanceReplay.load(
    PhysicalBalanceReplay.list().find(
      (name: string): boolean =>
        PhysicalBalanceReplay.load(name).case === "quad:fall:z",
    )!,
  );
  const built: IAutoMoviePhysicalProfile = PhysicalBalanceReplay.profile(
    fixture.subject,
  );
  const record: PhysicalBalanceReplay.IRecord = fixture.records.find(
    (candidate: PhysicalBalanceReplay.IRecord): boolean =>
      candidate.kind === "advance" && near(candidate.seconds, 0.25),
  )!;
  const at = (
    seconds: number,
  ): { sense: physicalBalanceSense.ISense; state: IAutoMoviePhysicalRecoveryState } =>
    PhysicalBalanceReplay.sense(
      fixture,
      { ...record, input: { ...record.input, seconds } },
      built,
    );
  const { sense, state: recorded } = at(record.seconds);

  // 2. The quadrants of the authored rectangle.
  const quadrants = physicalQuadFrame.quadrants(sense);
  for (const limb of sense.limbs) {
    const p = sense.authored(limb.bone);
    const expected: string =
      (p.z > 0 ? "front" : "hind") + (p.x > 0 ? "Left" : "Right");
    if (quadrants?.[limb.bone] !== expected)
      failures.push(
        `quadrants: ${limb.bone} at (${p.x}, ${p.z}) is ${quadrants?.[limb.bone]}, not ${expected}`,
      );
  }

  // 3. The pivot.
  const center = { x: 0.1, y: 0.5, z: 0.2 };
  const velocity = { x: 0.3, y: 0, z: -0.4 };
  const omega: number = 4;
  const xi = { x: 0.1 + 0.3 / 4, z: 0.2 - 0.4 / 4 };
  const resting = physicalQuadFrame.pivot({
    desired: { position: xi, velocity: { x: 0, z: 0 } },
    authored: { x: 0, y: 0, z: 0 },
    center,
    velocity,
    omega,
    floor: 0,
  });
  if (!near(resting.x, xi.x) || !near(resting.z, xi.z) || resting.y !== 0)
    failures.push(`pivot: a setpoint on the estimate gives ${JSON.stringify(resting)}`);
  const off = physicalQuadFrame.pivot({
    desired: {
      position: { x: xi.x + 0.08, z: xi.z - 0.04 },
      velocity: { x: 0, z: 0 },
    },
    authored: { x: 0, y: 0, z: 0 },
    center,
    velocity,
    omega,
    floor: 0,
  });
  if (!near(off.x, xi.x - (2 * 0.08) / 4) || !near(off.z, xi.z + (2 * 0.04) / 4))
    failures.push(`pivot: a setpoint off the estimate gives ${JSON.stringify(off)}`);

  // 4. The trigger enters stepping.
  const plan = (
    readings: physicalBalanceSense.ISense,
    state: IAutoMoviePhysicalRecoveryState,
  ): physicalQuadPlan.IResult => {
    const seated: IAutoMoviePhysicalRecoveryState = physicalBalanceRamp({
      state: physicalQuadTouchdown({
        state: physicalBalanceHandoff({ state, seconds: readings.seconds }),
        sense: readings,
      }),
      sense: readings,
    });
    return physicalQuadPlan({
      state: seated,
      sense: readings,
      stance: physicalBalanceStance({ state: seated, sense: readings }),
    });
  };
  const entered: physicalQuadPlan.IResult = plan(sense, recorded);
  const gait = entered.state.gait;
  if (!gait) failures.push("trigger: the fall's push did not enter stepping");
  else {
    const first = physicalQuadrupedXGaitPlanner
      .steps(gait.stream, sense.seconds)
      .sort((a, b) => a.start - b.start)[0]!;
    if (!near(first.start, sense.seconds + 0.5) || first.quadrant !== "frontLeft")
      failures.push(
        `trigger: the first step is ${first.quadrant} at ${first.start}, not frontLeft at ${sense.seconds + 0.5}`,
      );
    if (entered.state.swings)
      failures.push("trigger: a leg lifted at the entry");
    if (!entered.state.push?.fall)
      failures.push("trigger: the push recovery is not recovering a fall");
    const soles = physicalQuadFrame.soles(sense, gait.quadrants, true);
    const ground: number =
      (Math.min(soles.frontLeft.z, soles.frontRight.z) +
        Math.min(soles.hindLeft.z, soles.hindRight.z)) /
      2;
    const authored = built.segments.reduce(
      (sum: number, segment): number => {
        const target = sense.targets[segment.bone]!;
        const q = target.rotation;
        const c = segment.centerOfMass;
        // The y of p + R c, R from the unit quaternion.
        const y: number =
          target.position.y +
          2 * (q.x * q.y + q.w * q.z) * c.x +
          (1 - 2 * (q.x * q.x + q.z * q.z)) * c.y +
          2 * (q.y * q.z - q.w * q.x) * c.z;
        return sum + (segment.mass / built.mass) * y;
      },
      0,
    );
    const expected: number = Math.sqrt(sense.gravity / (authored - ground));
    if (!(Math.abs(entered.state.omega! - expected) < 1e-9))
      failures.push(`trigger: omega ${entered.state.omega} is not ${expected}`);

    // 5. The first step lifts its leg when it begins.
    const start: number = first.start;
    const lifted: physicalQuadPlan.IResult = plan(
      at(start).sense,
      entered.state,
    );
    const bone: string = physicalQuadFrame.bones(gait.quadrants).frontLeft;
    const swing = lifted.state.swings?.[bone];
    if (!swing) failures.push(`lift: ${bone} did not lift at ${start}`);
    else {
      if (!near(swing.start, start) || !near(swing.end, start + 0.33))
        failures.push(`lift: the swing runs ${swing.start} to ${swing.end}`);
      if (swing.to.clearance !== 0.1)
        failures.push(`lift: the swing rises ${swing.to.clearance}`);
      if (lifted.state.seating?.[bone])
        failures.push("lift: the lifted leg keeps its seat");
      if (lifted.state.gait?.feet.frontLeft.first !== false)
        failures.push("lift: the foot's first trigger is not spent");

      // 6. The touchdown, over successive updates from a time on: the
      // trigger's window is the reference's 1 ms in this controller's updates.
      const touch = (
        seconds: number,
        loaded: boolean,
        updates: number = 1,
      ): IAutoMoviePhysicalRecoveryState => {
        let state: IAutoMoviePhysicalRecoveryState = lifted.state;
        for (let k: number = 0; k < updates; k++) {
          const readings: physicalBalanceSense.ISense = at(
            seconds + k * sense.dt,
          ).sense;
          state = physicalQuadTouchdown({
            state,
            sense: loaded
              ? { ...readings, load: (): number => readings.weight }
              : { ...readings, load: (): number => 0 },
          });
        }
        return state;
      };
      const window: number = physicalGlitchFilter.ticks(
        physicalQuadTouchdown.TRIGGER_WINDOW,
        physicalQuadPlan.CONTROL_DT,
        sense.dt,
      );
      if (touch(start + 0.33 * 0.7, true, window).swings?.[bone] === undefined)
        failures.push("touchdown: a loaded foot landed before 0.8 of its swing");
      if (
        window > 1 &&
        touch(start + 0.33 * 0.9, true, window - 1).swings?.[bone] === undefined
      )
        failures.push("touchdown: a loaded foot landed before its trigger's window");
      const early: IAutoMoviePhysicalRecoveryState = touch(
        start + 0.33 * 0.9,
        true,
        window,
      );
      if (early.swings?.[bone] !== undefined)
        failures.push("touchdown: a loaded foot past 0.8 did not land");
      else {
        if (early.seating?.[bone]?.bearing !== 1)
          failures.push("touchdown: the landed foot is not fully seated");
        if (!Number.isNaN(early.gait?.adjustment.frontLeft.instantaneous.x))
          failures.push("touchdown: the landed step's adjustment was kept");
      }
      if (touch(start + 0.33 * 0.9, false).swings?.[bone] === undefined)
        failures.push("touchdown: an unloaded foot landed before its time ran out");
      if (touch(start + 0.34, false).swings?.[bone] !== undefined)
        failures.push("touchdown: an unloaded foot did not time out");
    }

    // 7. A gait halted at its entry ends.
    const halted: physicalQuadPlan.IResult = plan(at(sense.seconds + 0.01).sense, {
      ...entered.state,
      gait: { ...gait, halt: sense.seconds },
    });
    if (halted.state.gait)
      failures.push("done: a gait halted before its first step did not end");
    if (halted.state.push?.fall)
      failures.push("done: the ended gait left the push recovery recovering");
  }
  TestValidator.equals("quad gait", failures, []);
}
