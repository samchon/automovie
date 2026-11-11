import { derivePhysicalActuators } from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/** Joint gains include an attached payload through a tiny intermediate carrier.
 *
 * Scenarios:
 * 1. Analytic z inertia is sum(Icom + m r²) about the actual hinge.
 * 2. Torque budget includes the downstream payload's mass.
 * 3. Active axial gains retain the transverse load bound for later bent poses.
 * 4. Passive damping is independent from active tracking gains.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `derivePhysicalActuators` on in-memory inputs and asserts the returned observations through 4x TestValidator.predicate; 4 numbered scenarios (first: Analytic z inertia is sum(Icom + m r²) about the actual hinge.; last: Passive damping is independent from active tracking gains.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (4 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 4 numbered scenarios (first: Analytic z inertia is sum(Icom + m r²) about the actual hinge.; last: Passive damping is independent from active tracking gains.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_actuator_load`, which owns the cases delegated to `PhysicalFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Analytic z inertia is sum(Icom + m r²) about the actual hinge.).
 */
export function test_physical_actuator_load(): void {
  const profile: P = PhysicalFixtures.sphere();
  const carrier: P.ISegment = structuredClone(profile.segments[0]!);
  carrier.bone = "carrier";
  carrier.neutral.position = { x: 0, y: 0, z: 0 };
  carrier.mass = 0.01;
  carrier.centerOfMass = { x: 0, y: 0, z: 0 };
  carrier.inertia = { x: 0.001, y: 0.001, z: 0.001 };
  const payload: P.ISegment = structuredClone(carrier);
  payload.bone = "payload";
  payload.mass = 2;
  payload.neutral.position = { x: 1, y: 0, z: 0 };
  payload.inertia = { x: 0.2, y: 0.2, z: 0.2 };
  const identity: P.ITransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const hinge: P.IJoint = {
    id: "hinge",
    parent: "root",
    child: "carrier",
    parentFrame: identity,
    childFrame: identity,
    axes: (["x", "z"] as const).map(
      (axis: "x" | "z"): P.IAxis => ({
        axis,
        minimum: -1,
        maximum: 1,
        stiffness: 0,
        damping: 0,
        maximumTorque: 1,
        channel: axis,
      }),
    ),
  };
  const fixed: P.IJoint = {
    id: "attachment",
    parent: "carrier",
    child: "payload",
    parentFrame: identity,
    childFrame: identity,
    axes: [],
  };
  const joints: P.IJoint[] = derivePhysicalActuators(
    [...profile.segments, carrier, payload],
    [hinge, fixed],
    { frequency: 10, dampingRatio: 1, torquePerKg: 3, passiveRate: 5 },
  );
  TestValidator.predicate(
    "downstream transverse inertia",
    Math.abs(joints[0]!.axes[1]!.stiffness - 220.1) < 1e-10,
  );
  TestValidator.predicate(
    "active axial gain retains the transverse load bound",
    Math.abs(joints[0]!.axes[0]!.stiffness - 220.1) < 1e-10,
  );
  TestValidator.predicate(
    "downstream torque mass",
    Math.abs(joints[0]!.axes[1]!.maximumTorque - 6.03) < 1e-10,
  );
  TestValidator.predicate(
    "declared passive friction",
    Math.abs(joints[0]!.axes[1]!.passiveDamping! - 11.005) < 1e-10,
  );
}
