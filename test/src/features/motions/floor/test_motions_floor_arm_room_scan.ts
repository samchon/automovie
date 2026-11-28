import type {
  IAutoMovieMotionHumanPosture,
  IAutoMoviePhysicalJointAxis,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  floorArmRoom
} from "../../../../../packages/motions/src/floor/internal/floorArmRoom";
import { TestValidator } from "@nestia/e2e";

/**
 * Check how floor arm clearance chooses its sample count from relative
 * collider travel.
 *
 * Scenarios:
 *
 * 1. Translate and turn the entire pose with the arm and collider
 *    relationship fixed. The scan stays at its 16-sample floor.
 * 2. Apply lower-arm axis turns of 20, -40 and 60 degrees. The 120-degree
 *    travel bound requires 46 samples in either endpoint order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios give the relative motion, angular bound and required count.
 * @evidence contracts/development/testing.md#behavioral-verification The scan responds to local arm travel, and its count is stable under reversed endpoints.
 * @evidence contracts/development/testing.md#independent-expectations The cube's quarter-metre half extents give radius `sqrt(3) / 4`, and the bounded arc divided by the 20 mm spacing rounds up to 46.
 */
export function test_motions_floor_arm_room_scan(): void {
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const frame: IAutoMovieRigidTransform = {
    position: zero,
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const arm: IAutoMoviePhysicalSegment = {
    bone: "leftLowerArm",
    neutral: frame,
    mass: 1,
    centerOfMass: zero,
    inertia: { x: 1, y: 1, z: 1 },
    inertiaRotation: frame.rotation,
    shapes: [
      {
        id: "segment",
        material: "rigid",
        transform: frame,
        kind: "box",
        halfExtents: { x: 0.25, y: 0.25, z: 0.25 },
      },
    ],
  };
  const axes: IAutoMoviePhysicalJointAxis["axis"][] = ["x", "y", "z"];
  const profile: IAutoMoviePhysicalProfile = {
    id: "clearance-scan",
    mass: 2,
    centerOfMass: zero,
    segments: [{ ...arm, bone: "hips" }, arm],
    joints: [
      {
        id: "elbow",
        parent: "hips",
        child: "leftLowerArm",
        parentFrame: frame,
        childFrame: frame,
        axes: axes.map(
          (axis): IAutoMoviePhysicalJointAxis => ({
            axis,
            minimum: -Math.PI,
            maximum: Math.PI,
            stiffness: 1,
            damping: 0,
            maximumTorque: 1,
            channel: axis,
          }),
        ),
      },
    ],
    materials: [
      { id: "rigid", friction: 0.5, restitution: 0, compliance: 0, damping: 0 },
    ],
    provenance: "Analytic staged cube",
  };
  const start: IAutoMovieMotionHumanPosture = {
    root: zero,
    yaw: 0,
    pitch: 0,
    roll: 0,
    limbs: {},
    joints: {},
  };
  const placed: IAutoMovieMotionHumanPosture = {
    ...start,
    root: { x: 3, y: 2, z: 1 },
    yaw: 90,
  };
  const bent: IAutoMovieMotionHumanPosture = {
    ...placed,
    joints: { leftLowerArm: [20, -40, 60] },
  };
  TestValidator.equals(
    "round up the relative-travel bound",
    [
      floorArmRoom.count({ profile }, start, placed),
      floorArmRoom.count({ profile }, start, bent),
      floorArmRoom.count({ profile }, bent, start),
    ],
    [16, 46, 46],
  );
}
