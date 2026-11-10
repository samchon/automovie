import {
  Quaternion,
  Vector3,
  accumulatePhysicalMotorTorques,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieVector3 as V,
} from "@automovie/interface";
import RAPIER, { type RigidBody, type World } from "@dimforge/rapier3d-compat";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { PhysicalPointFixtures } from "../internal/PhysicalPointFixtures";
import { vclose } from "../internal/vclose";

/** A contact point only has Jacobian columns on its actual carrier's ancestor path.
 *
 * Scenarios:
 * 1. A point on the first of two hinges is invariant under the distal hinge.
 * 2. A distal point has both independently derived lever arms, with either virtual-work direction.
 * 3. A translated, rotated world and an independent 90-degree joint frame preserve the analytic local moments.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `Quaternion`, `Vector3`, `accumulatePhysicalMotorTorques` on in-memory inputs and asserts the returned observations through 2x TestValidator.predicate; 3 numbered scenarios (first: A point on the first of two hinges is invariant under the distal hinge.; last: A translated, rotated world and an independent 90-degree joint frame preserve the analytic local moments.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: A point on the first of two hinges is invariant under the distal hinge.; last: A translated, rotated world and an independent 90-degree joint frame preserve the analytic local moments.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_contact_carrier`, which owns the cases delegated to `PhysicalPointFixtures`, `vclose`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A point on the first of two hinges is invariant under the distal hinge.).
 */
export async function test_physical_contact_carrier(): Promise<void> {
  await RAPIER.init();
  const profile: P = PhysicalPointFixtures.profile();
  profile.joints[1]!.axes = [
    {
      ...profile.joints[0]!.axes[0]!,
      channel: "source.turn",
      minimum: -Math.PI / 2,
    },
  ];
  const world: World = new RAPIER.World({ x: 0, y: 0, z: 0 });
  try {
    const segments: Map<string, RigidBody> = new Map(
      profile.segments.map((segment: P.ISegment): [string, RigidBody] => [
        segment.bone,
        world.createRigidBody(
          RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(
              segment.neutral.position.x,
              segment.neutral.position.y,
              segment.neutral.position.z,
            )
            .setRotation(segment.neutral.rotation)
            .setAdditionalMassProperties(
              segment.mass,
              segment.centerOfMass,
              segment.inertia,
              segment.inertiaRotation,
            ),
        ),
      ]),
    );
    for (const transformed of [false, true]) {
      const rotation: P.ITransform["rotation"] = transformed
        ? Quaternion.fromAxisAngle(
            { x: Math.sqrt(1 / 3), y: Math.sqrt(1 / 3), z: Math.sqrt(1 / 3) },
            40,
          )
        : { x: 0, y: 0, z: 0, w: 1 };
      const translation: V = transformed
        ? { x: 2, y: -3, z: 1 }
        : { x: 0, y: 0, z: 0 };
      for (const segment of profile.segments) {
        segments
          .get(segment.bone)!
          .setTranslation(
            Vector3.add(
              translation,
              Quaternion.rotateVector(rotation, segment.neutral.position),
            ),
            true,
          );
        segments.get(segment.bone)!.setRotation(rotation, true);
      }
      for (const joint of profile.joints.slice(0, 2)) {
        const frame: P.ITransform["rotation"] = transformed
          ? Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90)
          : { x: 0, y: 0, z: 0, w: 1 };
        joint.parentFrame.rotation = frame;
        joint.childFrame.rotation = frame;
        joint.axes[0]!.axis = transformed ? "y" : "z";
      }
      for (const reverse of [false, true]) {
        const sign: number = reverse ? -1 : 1;
        for (const carrier of ["carrier", "source"]) {
          const torques: Map<string, V> = new Map();
          accumulatePhysicalMotorTorques({
            profile,
            segments,
            chain: ["carrier", "source"],
            carrier,
            point: Vector3.add(
              translation,
              Quaternion.rotateVector(rotation, {
                x: carrier === "carrier" ? 0.5 : 1.5,
                y: 1,
                z: 0,
              }),
            ),
            force: Quaternion.rotateVector(rotation, { x: 0, y: 1, z: 0 }),
            torque: { x: 0, y: 0, z: 0 },
            reverse,
            torques,
          });
          const expected: V = { x: 0, y: 0, z: 0 };
          expected[transformed ? "y" : "z"] =
            sign * (carrier === "carrier" ? 0.5 : 1.5);
          TestValidator.predicate(
            "actual transformed carrier lever and parent joint frame",
            vclose(torques.get("carrier")!, expected),
          );
          if (carrier === "carrier")
            assert.equal(torques.get("source"), undefined);
          else {
            expected[transformed ? "y" : "z"] = sign * 0.5;
            TestValidator.predicate(
              "distal carrier retains both true columns",
              vclose(torques.get("source")!, expected),
            );
          }
        }
      }
    }
  } finally {
    world.free();
  }
}
