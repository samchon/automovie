import {
  Quaternion,
  AutoMoviePhysicalSimulation as Simulation,
  validatePhysicalProfile,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalSupportFixtures } from "../internal/PhysicalSupportFixtures";
import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";
import { MOTION_HUMAN_PEOPLE } from "../internal/people/MOTION_HUMAN_PEOPLE";
import { preparePhysicalHumanArmSwing } from "../internal/preparePhysicalHumanArmSwing";

/**
 * A canonical polygon profile supplies anatomically anchored native tracking.
 *
 * Scenarios:
 *
 * 1. The measured subject mass reaches the solver profile and its upper arms and
 *    thighs carry their reference mass shares. Reflection keeps the neutral
 *    center of mass on the sagittal plane.
 * 2. A negative thigh mass, a hand inertia that breaks the triangle inequality, a
 *    malformed joint frame and an out-of-domain axis each report their own
 *    admission path on the same Human profile.
 * 3. A gravity-free shoulder ramp brings the elbow within two degrees of its
 *    eight-degree target by the end of the hold, preserving arm length and
 *    leading the target by no more than the peak lead of a critically damped
 *    second-order drive on the arm's moment of inertia. No motor demand exceeds
 *    its torque cap, and the native shoulder ends within two degrees of its
 *    authored rotation.
 * 4. The same native body and clock retain the neutral elbow when they receive a
 *    held neutral target.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the canonical provider, checks admission of its actual profile, and executes matched native tracking and neutral simulations. It reads the native elbow in the chest frame, rejects a missed deadline or overshoot, preserves upper-arm length, and reads torque-cap forecasts and the native shoulder error through `tracking` and `trackingAt`.
 * @evidence contracts/development/testing.md#independent-expectations The ANSUR case supplies body mass. Winter Table 4.1 gives Dempster mass shares. Neutral symmetry fixes the sagittal center. Planar trigonometry from the neutral elbow chord gives the target position and angular distance bounds without invoking the pose generator.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers the valid body, independent invalid mass, inertia, frame and range paths, and an active ramp versus a held neutral target on the same clock. Collider fidelity belongs to test_human_canonical_solids_surface. Ground support and recovery have their own fixtures.
 * @evidence contracts/development/testing.md#execution-ownership The portable unit test test_physical_human_profile prepares the installed canonical body and exercises the public native Engine entry with in-memory input and no viewer or file host.
 * @evidence contracts/development/common.md#meaningful-documentation Documents measured mass, reference shares, neutral symmetry, invalid mass, inertia, frame and limit paths, native tracking bounds and the matched control.
 */
export async function test_physical_human_profile(): Promise<void> {
  const profile: IAutoMoviePhysicalProfile =
    motionHumanBody("m-average").profile;
  const measuredMass: number = MOTION_HUMAN_PEOPLE["m-average"].mass;
  TestValidator.equals(
    "canonical profile admission",
    validatePhysicalProfile(profile),
    [],
  );
  TestValidator.predicate(
    "neutral mass retains the measured subject and sagittal center",
    nclose(profile.mass, measuredMass, 1e-7) &&
      nclose(profile.centerOfMass.x, 0, 1e-6),
  );

  // Dempster segment mass fractions are tabulated by Winter, Table 4.1.
  const shares: readonly (readonly [string, number])[] = [
    ["leftUpperArm", 0.028],
    ["rightUpperArm", 0.028],
    ["leftUpperLeg", 0.1],
    ["rightUpperLeg", 0.1],
  ];
  for (const [bone, share] of shares) {
    const segment: IAutoMoviePhysicalSegment | undefined =
      profile.segments.find(
        (segment: IAutoMoviePhysicalSegment): boolean => segment.bone === bone,
      );
    TestValidator.predicate(
      `${bone} has its reference segment mass`,
      segment !== undefined && nclose(segment.mass, measuredMass * share, 1e-7),
    );
  }

  const invalid: IAutoMoviePhysicalProfile = structuredClone(profile);
  const shoulderIndex: number = invalid.joints.findIndex(
    (joint: IAutoMoviePhysicalJoint): boolean => joint.child === "leftUpperArm",
  );
  const shoulder: IAutoMoviePhysicalJoint = invalid.joints[shoulderIndex]!;
  shoulder.parentFrame.rotation = { x: 0, y: 0, z: 0, w: 0 };
  shoulder.axes[0]!.maximum = 2 * Math.PI;
  const thighIndex: number = invalid.segments.findIndex(
    (segment: IAutoMoviePhysicalSegment): boolean =>
      segment.bone === "leftUpperLeg",
  );
  const handIndex: number = invalid.segments.findIndex(
    (segment: IAutoMoviePhysicalSegment): boolean =>
      segment.bone === "rightHand",
  );
  const thigh: IAutoMoviePhysicalSegment = invalid.segments[thighIndex]!;
  thigh.mass = -thigh.mass;
  const hand: IAutoMoviePhysicalSegment = invalid.segments[handIndex]!;
  // Principal moments must satisfy the triangle inequality of a real solid.
  hand.inertia = {
    x: hand.inertia.y + hand.inertia.z + 1,
    y: hand.inertia.y,
    z: hand.inertia.z,
  };
  const defects: string[] = validatePhysicalProfile(invalid);
  const path: string = `joints[${shoulderIndex}]`;
  TestValidator.predicate(
    "independent mass, inertia, frame and limit paths refuse simultaneously",
    defects.includes(`segments[${thighIndex}].mass`) &&
      defects.includes(`segments[${handIndex}].inertia`) &&
      defects.some((defect: string): boolean =>
        defect.startsWith(`${path}.parentFrame`),
      ) &&
      defects.includes(`${path}.axes[0].limits`),
  );

  const ramp: number = 1 / 8;
  const duration: number = 3 / 8;
  const degrees: number = 8;
  const radian: number = Math.PI / 180;
  const body: IAutoMoviePhysicalSimulationInput.IBody =
    PhysicalSupportFixtures.canonical(profile, duration);
  delete body.balance;
  const neutral: Record<string, IAutoMovieRigidTransform> =
    body.targets[0]!.segments;
  const swing: ReturnType<typeof preparePhysicalHumanArmSwing> =
    preparePhysicalHumanArmSwing(profile, neutral);
  const initial: IAutoMovieVector3 = elbowInChest(neutral);
  const direction: number = Math.sign(initial.x);
  const angle: number = degrees * radian * direction;
  const expected: IAutoMovieVector3 = {
    x: initial.x * Math.cos(angle) - initial.y * Math.sin(angle),
    y: initial.x * Math.sin(angle) + initial.y * Math.cos(angle),
    z: initial.z,
  };
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    PhysicalFixtures.input([body], duration);
  input.substeps = 4;
  body.targets.forEach(
    (target: IAutoMoviePhysicalSimulationInput.ITarget, step: number): void => {
      target.segments = swing(
        degrees * direction * Math.min(1, step / (ramp * input.rate)),
      );
    },
  );
  const matched: IAutoMoviePhysicalSimulationInput.IInput =
    structuredClone(input);
  for (const target of matched.bodies[0]!.targets) target.segments = neutral;
  const still: IAutoMoviePhysicalSimulation = await Simulation.compute(matched);
  const moving: IAutoMoviePhysicalSimulation = await Simulation.compute(input);
  const end: IAutoMovieVector3 = elbowInChest(
    moving.cache.at(duration).bodies[body.id]!,
  );
  const control: IAutoMovieVector3 = elbowInChest(
    still.cache.at(duration).bodies[body.id]!,
  );
  const armLength: number = Math.hypot(initial.x, initial.y, initial.z);
  const arcRadius: number = Math.hypot(initial.x, initial.y);
  const anchorTolerance: number = 0.001;
  TestValidator.predicate(
    "the fixture's neutral elbow gives a distinct target on the lateral arc",
    Math.abs(initial.x) > Math.abs(initial.y) && arcRadius > 0.1,
  );
  const activeError: number = Math.hypot(
    end.x - expected.x,
    end.y - expected.y,
    end.z - expected.z,
  );
  const neutralError: number = Math.hypot(
    control.x - initial.x,
    control.y - initial.y,
    control.z - initial.z,
  );
  let leadingAngle: number = 0;
  let leadingTime: number = 0;
  const frames: readonly IAutoMoviePhysicalFrame[] = moving.cache.frames;
  for (const frame of frames) {
    const elbow: IAutoMovieVector3 = elbowInChest(frame.bodies[body.id]!);
    const swept: number =
      (direction *
        Math.atan2(
          initial.x * elbow.y - initial.y * elbow.x,
          initial.x * elbow.x + initial.y * elbow.y,
        )) /
      radian;
    const lead: number = swept - degrees * Math.min(1, frame.seconds / ramp);
    if (lead > leadingAngle) {
      leadingAngle = lead;
      leadingTime = frame.seconds;
    }
  }
  const lengthError: number = Math.abs(
    Math.hypot(end.x, end.y, end.z) - armLength,
  );
  // The shoulder's drive about the swing's axis is a second-order joint, I
  // e'' + kd e' + kp e = I r'', on the arm's moment of inertia I about that
  // axis through the shoulder. A critically damped one (omega = sqrt(kp /
  // I)) following a ramp of rate W held after T leads the target by at most
  // W (1 - a) / omega exp(-1 - omega T a / (1 - a)), a = e^(-omega T): the
  // ramp's response less the same response delayed by T, at its peak.
  const arm: Set<string> = new Set(["leftUpperArm"]);
  for (const joint of profile.joints)
    if (arm.has(joint.parent)) arm.add(joint.child);
  const pivot: IAutoMovieVector3 = neutral.leftUpperArm!.position;
  let inertia: number = 0;
  for (const segment of profile.segments) {
    if (!arm.has(segment.bone)) continue;
    const pose: IAutoMovieRigidTransform = neutral[segment.bone]!;
    const principal: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(
        Quaternion.multiply(pose.rotation, segment.inertiaRotation),
      ),
      { x: 0, y: 0, z: 1 },
    );
    const centre: IAutoMovieVector3 = Quaternion.rotateVector(
      pose.rotation,
      segment.centerOfMass,
    );
    inertia +=
      segment.inertia.x * principal.x ** 2 +
      segment.inertia.y * principal.y ** 2 +
      segment.inertia.z * principal.z ** 2 +
      segment.mass *
        ((pose.position.x + centre.x - pivot.x) ** 2 +
          (pose.position.y + centre.y - pivot.y) ** 2);
  }
  const drive: IAutoMoviePhysicalJoint = profile.joints.find(
    (joint: IAutoMoviePhysicalJoint): boolean => joint.child === "leftUpperArm",
  )!;
  const omega: number = Math.sqrt(
    drive.axes.find((axis): boolean => axis.axis === "z")!.stiffness / inertia,
  );
  const decay: number = Math.exp(-omega * ramp);
  const leadLimit: number =
    ((degrees / ramp) *
      (1 - decay) *
      Math.exp(-1 - (omega * ramp * decay) / (1 - decay))) /
    omega;
  const findings: string[] = [];
  const targetLimit: number =
    2 * arcRadius * Math.sin(radian) + anchorTolerance;
  const neutralLimit: number =
    2 * arcRadius * Math.sin(radian / 2) + anchorTolerance;
  if (!(activeError <= targetLimit))
    findings.push(
      `active elbow misses its target at ${duration} s by ${activeError} m, limit ${targetLimit} m`,
    );
  if (!(neutralError <= neutralLimit))
    findings.push(
      `matched neutral elbow drifts ${neutralError} m, limit ${neutralLimit} m`,
    );
  if (!(leadingAngle <= leadLimit))
    findings.push(
      `active elbow leads its target by ${leadingAngle} degrees at ${leadingTime} s, limit ${leadLimit} degrees`,
    );
  if (!(lengthError <= anchorTolerance))
    findings.push(`upper-arm length changes by ${lengthError} m`);
  const saturated: string[] = moving.tracking
    .filter(
      (entry: IAutoMoviePhysicalSimulationInput.IDiagnostic): boolean =>
        entry.body === body.id,
    )
    .map(
      (entry: IAutoMoviePhysicalSimulationInput.IDiagnostic): string =>
        `${entry.joint}@${entry.seconds}`,
    );
  if (saturated.length > 0)
    findings.push(
      `${saturated.length} motor demands exceed their torque caps, first ${saturated.slice(0, 4).join(", ")}`,
    );
  const shoulderError: number =
    moving
      .trackingAt(duration)
      .find(
        (entry: IAutoMoviePhysicalSimulationInput.IDiagnostic): boolean =>
          entry.body === body.id && entry.joint === "leftUpperArm",
      )?.error ?? Infinity;
  if (!(shoulderError <= 2 * radian))
    findings.push(
      `shoulder ends ${shoulderError / radian} degrees from its authored rotation`,
    );
  TestValidator.equals(
    "measured Human native tracking and control",
    findings,
    [],
  );
}

/** Measure the shoulder-to-elbow chord in the body's chest frame, metres. */
function elbowInChest(
  pose: Readonly<Record<string, IAutoMovieRigidTransform>>,
): IAutoMovieVector3 {
  const shoulder: IAutoMovieVector3 = pose.leftUpperArm!.position;
  const elbow: IAutoMovieVector3 = pose.leftLowerArm!.position;
  const chest: IAutoMovieRigidTransform["rotation"] = pose.chest!.rotation;
  return Quaternion.rotateVector(Quaternion.inverse(chest), {
    x: elbow.x - shoulder.x,
    y: elbow.y - shoulder.y,
    z: elbow.z - shoulder.z,
  });
}
