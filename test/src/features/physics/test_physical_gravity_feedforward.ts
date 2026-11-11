import { physicalGravityTorques } from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import RAPIER, { type RigidBody, type World } from "@dimforge/rapier3d-compat";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/** Actual posed subtree mass supplies gravitational feed-forward in the motor's frame.
 *
 * Scenarios:
 * 1. A one-kilogram link COM at half a metre plus a two-kilogram payload at one metre require 24.525 Nm.
 * 2. A 90 degree frame rotation maps that moment onto the declared local z axis.
 * 3. The fixed distal attachment contributes to its ancestor without a separate actuator.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `physicalGravityTorques` on in-memory inputs and asserts the returned observations through 3x TestValidator.predicate; 3 numbered scenarios (first: A one-kilogram link COM at half a metre plus a two-kilogram payload at one metre require 24.525 Nm.; last: The fixed distal attachment contributes to its ancestor without a separate actuator.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (3 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: A one-kilogram link COM at half a metre plus a two-kilogram payload at one metre require 24.525 Nm.; last: The fixed distal attachment contributes to its ancestor without a separate actuator.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_gravity_feedforward`, which owns the cases delegated to `PhysicalFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A one-kilogram link COM at half a metre plus a two-kilogram payload at one metre require 24.525 Nm.).
 */
export async function test_physical_gravity_feedforward(): Promise<void> {
  await RAPIER.init();
  const profile: P = PhysicalFixtures.sphere();
  const root: P.ISegment = profile.segments[0]!;
  root.neutral.position = { x: 0, y: 0, z: 0 };
  const link: P.ISegment = structuredClone(root);
  link.bone = "link";
  link.neutral.rotation = { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 };
  link.centerOfMass = { x: 0.5, y: 0, z: 0 };
  const payload: P.ISegment = structuredClone(root);
  payload.bone = "payload";
  payload.mass = 2;
  payload.neutral.position.z = -1;
  profile.segments.push(link, payload);
  profile.mass = 4;
  profile.centerOfMass = { x: 0, y: 0, z: -0.625 };
  const identity: P.ITransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const hinge: P.IJoint = {
    id: "hinge",
    parent: "root",
    child: "link",
    parentFrame: { ...identity, rotation: link.neutral.rotation },
    childFrame: identity,
    axes: [],
  };
  const attachment: P.IJoint = {
    id: "attachment",
    parent: "link",
    child: "payload",
    parentFrame: {
      position: { x: 1, y: 0, z: 0 },
      rotation: { x: 0, y: -Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
    },
    childFrame: identity,
    axes: [],
  };
  profile.joints = [hinge, attachment];
  const world: World = new RAPIER.World({ x: 0, y: 0, z: 0 });
  try {
    const segments: Map<string, RigidBody> = new Map(
      profile.segments.map(
        (segment: (typeof profile.segments)[number]): [string, RigidBody] => {
          const body: RigidBody = world.createRigidBody(
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
          );
          body.recomputeMassPropertiesFromColliders();
          return [segment.bone, body];
        },
      ),
    );
    const torques: ReturnType<typeof physicalGravityTorques> =
      physicalGravityTorques(profile, [attachment, hinge], segments, {
        x: 0,
        y: -9.81,
        z: 0,
      });
    const actual: NonNullable<ReturnType<typeof torques.joints.get>> =
      torques.joints.get("hinge")!;
    TestValidator.predicate(
      "rotated downstream mass moment",
      Math.abs(actual.z - 24.525) < 1e-5 &&
        Math.hypot(actual.x, actual.y) < 1e-5,
    );
    TestValidator.predicate(
      "root counter-moment uses its actual force application point",
      Math.abs(torques.root.x - 24.525) < 1e-5 &&
        Math.hypot(torques.root.y, torques.root.z) < 1e-5,
    );
    const distal: NonNullable<ReturnType<typeof torques.joints.get>> =
      torques.joints.get("attachment")!;
    TestValidator.predicate(
      "payload lies at its own attachment pivot",
      Math.hypot(distal.x, distal.y, distal.z) < 1e-6,
    );
  } finally {
    world.free();
  }
}
