import {
  AutoMoviePhysicalSimulation as Simulation,
  physicalSupportPoint,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegmentState,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieStepPlanner,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalPerformanceFixtures } from "../internal/PhysicalPerformanceFixtures";

/**
 * An independently built primitive body tracks an authored slow walk with
 * bounded effort and planted support, and recovers from a test push.
 *
 * Scenarios:
 * 1. The engine stickman walks 0.12 m/s for two seconds from planner-placed
 *    footfalls. Every displayed segment origin stays within the drawn limb
 *    radius of its authored target, and every planted support point drifts
 *    less than one percent of the 0.35 m stride.
 * 2. No joint motor's demand exceeds its declared torque cap in the
 *    unperturbed walk, and every joint stays within two degrees of its
 *    authored rotation, the bound the Human elbow tracking case uses.
 * 3. A horizontal push on the hips displaces the body in proportion to the
 *    impulse, and the pushed run returns within one millimetre of the
 *    unperturbed run before the walk ends.
 *
 * Visible-geometry tolerances are the segment-origin and support-point
 * bounds, measured on displayed cache frames. The joint error is a simulation
 * tolerance on native relative rotations. The Human provider's locomotion
 * baseline needs actual quiet support and stays with #3092.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation.compute` on the maintained slow-walk fixture over the stickman profile, reads displayed cache frames, `trackingAt` joint errors and saturation forecasts, and repeats the run with two explicit impulses against the unperturbed cache.
 * @evidence contracts/development/testing.md#independent-expectations The pose bound is the stickman's declared 0.04 m limb radius, the drift bound one percent of the fixture's declared 0.35 m stride, the joint bound the two degrees of test_physical_human_profile, and saturation is read against each joint's own declared torque cap. Proportional response compares two impulses whose only difference is a factor of two; recovery compares against the same run without the push.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates swing from planted samples through the planner's own phase, the unperturbed run from two pushed runs, and the near-linear peak response from the settled tail.
 * @evidence contracts/development/testing.md#execution-ownership The portable unit test test_physical_authored_locomotion builds its bodies in memory and runs the public native Engine entry three times with no viewer or file host.
 * @evidence contracts/development/common.md#meaningful-documentation Documents the walk, the visible and simulation tolerances, the push and its recovery, and the Human baseline that remains with #3092.
 */
export async function test_physical_authored_locomotion(): Promise<void> {
  const profile: IAutoMoviePhysicalProfile =
    PhysicalModelFixtures.stickman().profile;
  const limbRadius: number = 0.04;
  const stride: number = 0.35;
  const duration: number = 2;
  const walk: ReturnType<typeof PhysicalPerformanceFixtures.walk> =
    PhysicalPerformanceFixtures.walk(profile, duration);
  const body: IAutoMoviePhysicalSimulationInput.IBody = walk.body;
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    PhysicalFixtures.input([body], duration);
  const result: IAutoMoviePhysicalSimulation = await Simulation.compute(input);

  let pose: number = 0;
  let joint: number = 0;
  for (const [step, target] of body.targets.entries()) {
    const seconds: number = step / input.rate;
    const frame: Record<string, IAutoMoviePhysicalSegmentState> =
      result.cache.at(seconds).bodies[body.id]!;
    for (const [bone, authored] of Object.entries(target.segments))
      pose = Math.max(pose, distance(frame[bone]!.position, authored.position));
    for (const entry of result.trackingAt(seconds))
      if (entry.body === body.id) joint = Math.max(joint, entry.error);
  }
  let drift: number = 0;
  let planted: number = 0;
  for (const limb of walk.pattern.limbs) {
    let anchor: IAutoMovieVector3 | null = null;
    for (let step: number = 0; step < body.targets.length; step++) {
      const seconds: number = step / input.rate;
      const state: IAutoMovieStepPlanner.IState = walk.planner.at(
        limb.bone,
        seconds,
      );
      if (state.phase !== "planted") {
        anchor = null;
        continue;
      }
      const point: IAutoMovieVector3 = physicalSupportPoint(
        result.cache.at(seconds).bodies[body.id]![limb.bone]!,
        limb.localPoint,
      );
      planted++;
      if (anchor === null) anchor = point;
      else drift = Math.max(drift, distance(anchor, point));
    }
  }
  TestValidator.predicate(
    `joints stay within two degrees of their authored rotations (${joint} rad)`,
    joint < (2 * Math.PI) / 180,
  );
  TestValidator.predicate(
    `segment origins stay inside the drawn limb (${pose} m)`,
    pose < limbRadius,
  );
  TestValidator.predicate(
    `planted supports hold (${drift} m over ${planted} samples)`,
    planted > 0 && drift < 0.01 * stride,
  );
  TestValidator.equals(
    "no motor demand exceeds its torque cap",
    result.tracking.filter(
      (entry: IAutoMoviePhysicalSimulationInput.IDiagnostic): boolean =>
        entry.body === body.id,
    ),
    [],
  );

  const at: number = 1;
  const peaks: number[] = [];
  const tails: number[] = [];
  for (const scale of [1, 2]) {
    const pushed: IAutoMoviePhysicalSimulationInput.IInput =
      structuredClone(input);
    pushed.impulses = [
      {
        step: Math.round(at * input.rate),
        body: body.id,
        bone: "hips",
        impulse: { x: 0, y: 0, z: 0.15 * scale * profile.mass },
        point: result.cache.at(at).bodies[body.id]!.hips!.position,
      },
    ];
    const disturbed: IAutoMoviePhysicalSimulation =
      await Simulation.compute(pushed);
    let peak: number = 0;
    for (
      let step: number = Math.round(at * input.rate);
      step < body.targets.length;
      step++
    ) {
      const seconds: number = step / input.rate;
      peak = Math.max(
        peak,
        distance(
          disturbed.cache.at(seconds).bodies[body.id]!.hips!.position,
          result.cache.at(seconds).bodies[body.id]!.hips!.position,
        ),
      );
    }
    peaks.push(peak);
    tails.push(
      distance(
        disturbed.cache.at(duration).bodies[body.id]!.hips!.position,
        result.cache.at(duration).bodies[body.id]!.hips!.position,
      ),
    );
  }
  TestValidator.predicate(
    `the push displaces the hips in proportion (${peaks.join(", ")} m)`,
    peaks[0]! > 0 && Math.abs(peaks[1]! / peaks[0]! - 2) < 0.2,
  );
  TestValidator.predicate(
    `both pushed walks return to the unperturbed walk (${tails.join(", ")} m)`,
    tails.every((tail: number): boolean => tail < 0.001),
  );
}

function distance(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
