import {
  Quaternion,
  AutoMoviePhysicalSimulation as Simulation,
  Vector3,
} from "@automovie/engine";
import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";

/** Internal actuators cannot hold an unsupported assembly in midair or manufacture free-body momentum.
 *
 * Scenarios:
 * 1. Active translation and rotation demands change relative limb poses in zero gravity.
 * 2. Total linear and angular momentum remain conserved despite those motor demands.
 * 3. With gravity compensation enabled, the complete free-flight COM still accelerates gravitationally.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `Quaternion`, `Vector3`, `AutoMoviePhysicalSimulation` on in-memory inputs and asserts the returned observations through 1x TestValidator.equals; 3 numbered scenarios (first: Active translation and rotation demands change relative limb poses in zero gravity.; last: With gravity compensation enabled, the complete free-flight COM still accelerates gravitationally.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: Active translation and rotation demands change relative limb poses in zero gravity.; last: With gravity compensation enabled, the complete free-flight COM still accelerates gravitationally.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_internal_actuation`, which owns the cases delegated to `PhysicalFixtures`, `PhysicalModelFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Active translation and rotation demands change relative limb poses in zero gravity.).
 */
export async function test_physical_internal_actuation(): Promise<void> {
  const findings: string[] = [];
  const profile: P = PhysicalModelFixtures.quadrupod();
  // Momentum conservation and free-fall acceleration hold at every native
  // step, so six steps exercise them as well as a longer flight; the
  // semi-implicit COM lag g dt t / 2 stays far under the 2 mm bound.
  const duration: number = 0.05;
  for (const gravity of [0, -9.81]) {
    const body: Simulation.IBody = PhysicalFixtures.body(
      "assembly",
      profile,
      duration,
    );
    const pattern: NonNullable<Simulation.IBody["supportTracking"]>["pattern"] =
      {
        id: "four-internal-carriers",
        minimumSupports: 1,
        limbs: [0, 1, 2, 3].map(
          (
            index: number,
          ): NonNullable<
            Simulation.IBody["supportTracking"]
          >["pattern"]["limbs"][number] => ({
            bone: "support-" + index,
            chain: ["upper-" + index, "lower-" + index, "support-" + index],
            phase: index / 4,
            duty: 0.5,
            offset: { forward: 0, left: 0 },
            stride: [{ speed: 0, length: 0.5 }],
          }),
        ),
      };
    Object.assign(body, {
      actuation: "internal",
      compensateGravity: true,
      rootStiffness: 1000,
      rootDamping: 100,
      maximumRootForce: 1000,
      rootTorque: { stiffness: 100, damping: 10, maximumTorque: 100 },
      supportTracking: {
        pattern,
        stiffness: 100,
        damping: 10,
        maximumForce: 100,
        iterations: 0,
      },
    });
    for (const [step, target] of body.targets.entries()) {
      target.strength = 1;
      target.supportStrength = Object.fromEntries(
        pattern.limbs.map(
          (limb: (typeof pattern.limbs)[number]): [string, number] => [
            limb.bone,
            1,
          ],
        ),
      );
      const rotation: P.ITransform["rotation"] = Quaternion.fromAxisAngle(
        { x: 0, y: 0, z: 1 },
        (15 * step) / 60,
      );
      for (const pose of Object.values(target.segments)) {
        pose.position = Vector3.add(
          profile.centerOfMass,
          Quaternion.rotateVector(
            rotation,
            Vector3.subtract(pose.position, profile.centerOfMass),
          ),
        );
        pose.position.x += (0.2 * step) / 60;
        pose.rotation = Quaternion.multiply(rotation, pose.rotation);
      }
    }
    const input: Simulation.IInput = PhysicalFixtures.input([body], duration);
    input.gravity.y = gravity;
    input.substeps = 4;
    const run: Simulation = await Simulation.compute(input);
    const states: (typeof run.cache.frames)[number]["bodies"][string] =
      run.cache.at(duration).bodies.assembly!;
    let center: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    let linear: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    let angular: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const segment of profile.segments) {
      const state: (typeof states)[string] = states[segment.bone]!;
      const offset: IAutoMovieVector3 = Quaternion.rotateVector(
        state.rotation,
        segment.centerOfMass,
      );
      const position: IAutoMovieVector3 = Vector3.add(state.position, offset);
      const momentum: IAutoMovieVector3 = Vector3.scale(
        Vector3.add(
          state.velocity,
          Vector3.cross(state.angularVelocity, offset),
        ),
        segment.mass,
      );
      center = Vector3.add(
        center,
        Vector3.scale(position, segment.mass / profile.mass),
      );
      linear = Vector3.add(linear, momentum);
      const axes: P.ITransform["rotation"] = Quaternion.multiply(
        state.rotation,
        segment.inertiaRotation,
      );
      const omega: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(axes),
        state.angularVelocity,
      );
      angular = Vector3.add(
        angular,
        Vector3.add(
          Vector3.cross(position, momentum),
          Quaternion.rotateVector(axes, {
            x: omega.x * segment.inertia.x,
            y: omega.y * segment.inertia.y,
            z: omega.z * segment.inertia.z,
          }),
        ),
      );
    }
    const expected: IAutoMovieVector3 = Vector3.add(profile.centerOfMass, {
      x: 0,
      y: (gravity * duration ** 2) / 2,
      z: 0,
    });
    if (Vector3.length(Vector3.subtract(center, expected)) > 0.002)
      findings.push(
        "internal demands changed free-flight COM: " +
          JSON.stringify({ gravity, center, expected }),
      );
    if (gravity === 0) {
      if (Vector3.length(linear) > 0.002 || Vector3.length(angular) > 0.002)
        findings.push(
          "unbalanced internal momentum: " +
            JSON.stringify({ linear, angular }),
        );
      if (
        Math.abs(states["upper-0"]!.rotation.x) +
          Math.abs(states["upper-0"]!.rotation.z) <
        0.001
      )
        findings.push("free-flight actuator demands were not exercised");
    }
  }
  TestValidator.equals(
    "all internal actuator conservation observations",
    findings,
    [],
  );
}
