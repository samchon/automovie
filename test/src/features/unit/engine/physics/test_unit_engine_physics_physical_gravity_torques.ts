import {
  AutoMovieXpbdBody,
  AutoMovieXpbdWorld,
  physicalGravityTorques,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalSegment,
  IAutoMovieRigidTransform,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../../internal/PhysicalTolerance";

/**
 * How far a gravity torque may stand from its closed form, N m: the solver's
 * micrometre convergence on a lever of order 10 N m per metre.
 */
const TORQUE: number = 1e-5;

import { PhysicalFixtures } from "../../../internal/PhysicalFixtures";

/**
 * Actual posed subtree mass supplies gravitational feed-forward in the motor's
 * frame.
 *
 * Scenarios:
 *
 * 1. A one-kilogram link COM at half a metre plus a two-kilogram payload at one
 *    metre require 24.525 Nm.
 * 2. A 90 degree frame rotation maps that moment onto the declared local z axis.
 * 3. The fixed distal attachment contributes to its ancestor without a separate
 *    actuator.
 */
export async function test_unit_engine_physics_physical_gravity_torques(): Promise<void> {
  const profile: P = PhysicalFixtures.sphere();
  const root: IAutoMoviePhysicalSegment = profile.segments[0]!;
  root.neutral.position = { x: 0, y: 0, z: 0 };
  const link: IAutoMoviePhysicalSegment = structuredClone(root);
  link.bone = "link";
  link.neutral.rotation = { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 };
  link.centerOfMass = { x: 0.5, y: 0, z: 0 };
  const payload: IAutoMoviePhysicalSegment = structuredClone(root);
  payload.bone = "payload";
  payload.mass = 2;
  payload.neutral.position.z = -1;
  profile.segments.push(link, payload);
  profile.mass = 4;
  profile.centerOfMass = { x: 0, y: 0, z: -0.625 };
  const identity: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const hinge: IAutoMoviePhysicalJoint = {
    id: "hinge",
    parent: "root",
    child: "link",
    parentFrame: { ...identity, rotation: link.neutral.rotation },
    childFrame: identity,
    axes: [],
  };
  const attachment: IAutoMoviePhysicalJoint = {
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
  const world: AutoMovieXpbdWorld = new AutoMovieXpbdWorld({
    x: 0,
    y: 0,
    z: 0,
  });
  const segments: Map<string, AutoMovieXpbdBody> = new Map(
    profile.segments.map(
      (segment: IAutoMoviePhysicalSegment): [string, AutoMovieXpbdBody] => {
        const body: AutoMovieXpbdBody = world.createBody(true, segment.neutral);
        body.setMass(
          segment.mass,
          segment.centerOfMass,
          segment.inertia,
          segment.inertiaRotation,
        );
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
    Math.abs(actual.z - 24.525) < TORQUE && Math.hypot(actual.x, actual.y) < TORQUE,
  );
  TestValidator.predicate(
    "root counter-moment uses its actual force application point",
    Math.abs(torques.root.x - 24.525) < TORQUE &&
      Math.hypot(torques.root.y, torques.root.z) < TORQUE,
  );
  const distal: NonNullable<ReturnType<typeof torques.joints.get>> =
    torques.joints.get("attachment")!;
  TestValidator.predicate(
    "payload lies at its own attachment pivot",
    Math.hypot(distal.x, distal.y, distal.z) < PhysicalTolerance.CONVERGED,
  );
}
