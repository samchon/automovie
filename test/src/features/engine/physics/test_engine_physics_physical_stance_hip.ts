import {
  AutoMovieXpbdBody,
  Quaternion,
  AutoMovieEnginePhysicalStanceHip,
} from "@automovie/engine";
import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../internal/PhysicalTolerance";

/**
 * How far the Human's sagittal hip reach may stand from 0.0204 m: that value is
 * stated to the tenth of a millimetre, so half a millimetre bounds it.
 */
const REACH: number = 5e-4;

/**
 * The hip strategy and the step trigger match their closed forms without a
 * simulated body:
 *
 * 1. Reach: a 1 kHz flywheel model, xi' = omega (xi - p - tau(t) / (m g)) with tau
 *    bang-bang over T1 = sqrt(theta I / tau) each way, brings an excess of 0.9
 *    of the closed-form reach back to the support's edge and loses one of 1.1,
 *    its trunk ending at rest at theta (Pratt et al. 2006; derived). The
 *    Human's sagittal numbers, 320 N m, 7.8 kg m^2, 0.25 rad, 78.5 kg and omega
 *    3.21 per second, reach about 2 cm.
 * 2. Trigger: a capture point 1.6 mm past the shrunken edge, inside the support,
 *    holds; 2.5 cm past the support steps against that reach; 1.5 cm past it
 *    holds with the trunk's angle left and steps once it is spent; one whose
 *    spin-free part is coming back holds; and one within the margin holds
 *    (Koolen et al., Corollary 3). With the previous step's excess measured,
 *    whether it shrinks is read from it: a capture point stalled 6.5 cm outside
 *    steps although its spin-free part is inside, and one whose excess fell
 *    holds (design-4017-edge, E3).
 * 3. Capacity: two hips side by side have a strategy against a forward push, with
 *    the torque their aligned axes give and the trunk's inertia about them, and
 *    none against a lateral one; one stance hip has one either way; a trunk
 *    leaning toward the push has that much less angle left.
 */
export function test_engine_physics_physical_stance_hip(): void {
  const failures: string[] = [];
  const near = (
    name: string,
    actual: number,
    expected: number,
    tolerance: number,
  ): void => {
    if (!(Math.abs(actual - expected) <= tolerance))
      failures.push(`${name}: ${actual} against ${expected}`);
  };

  // 1. The flywheel model against the closed form.
  const torque: number = 320;
  const inertia: number = 7.8;
  const theta: number = AutoMovieEnginePhysicalStanceHip.HIP_RANGE;
  const mass: number = 78.5;
  const gravity: number = 9.81;
  const omega: number = 3.21;
  const reach: number = AutoMovieEnginePhysicalStanceHip.hipReach({
    torque,
    inertia,
    angle: theta,
    mass,
    gravity,
    omega,
  });
  near("Human sagittal reach", reach, 0.0204, REACH);
  const half: number = Math.sqrt((theta * inertia) / torque);
  const steps: number = Math.ceil(half / 0.001);
  const h: number = half / steps;
  const flywheel = (
    excess: number,
  ): { excess: number; angle: number; rate: number } => {
    let e: number = excess;
    let angle: number = 0;
    let rate: number = 0;
    for (let i: number = 0; i < 2 * steps; i++) {
      const sign: number = i < steps ? 1 : -1;
      const offset: number = (sign * torque) / (mass * gravity);
      // The pivot held over the step: the excess's exact exponential update.
      e = offset + (e - offset) * Math.exp(omega * h);
      const before: number = rate;
      rate += (sign * torque * h) / inertia;
      angle += ((before + rate) / 2) * h;
    }
    return { excess: e, angle, rate };
  };
  const inside = flywheel(0.9 * reach);
  const outside = flywheel(1.1 * reach);
  if (!(inside.excess < 0))
    failures.push(`0.9 of the reach ends ${inside.excess} m past the edge`);
  if (!(outside.excess > 0))
    failures.push(`1.1 of the reach ends ${outside.excess} m past the edge`);
  near("trunk angle spent", inside.angle, theta, PhysicalTolerance.ACCUMULATED);
  near("trunk at rest", inside.rate, 0, PhysicalTolerance.ACCUMULATED);

  // 2. The trigger on a wide strip whose support reaches 0.40 forward.
  const support: IAutoMovieVector3[] = [
    { x: -0.5, y: 0, z: -0.12 },
    { x: 0.5, y: 0, z: -0.12 },
    { x: 0.5, y: 0, z: 0.4 },
    { x: -0.5, y: 0, z: 0.4 },
  ];
  const still: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const exceeds = (
    z: number,
    angle: number,
    spin: IAutoMovieVector3 = still,
    margin: number = 0,
    previous?: number,
  ): boolean =>
    AutoMovieEnginePhysicalStanceHip.exceeds({
      support,
      capture: { x: 0, y: 0, z },
      spin,
      margin,
      reach: (): number =>
        AutoMovieEnginePhysicalStanceHip.hipReach({
          torque,
          inertia,
          angle,
          mass,
          gravity,
          omega,
        }),
      ...(previous !== undefined ? { previous } : {}),
    });
  // The quad recover stall: 6.5 cm past the support, its spin-free part 2 cm
  // inside, the excess not shrinking from one step to the next.
  const stall: IAutoMovieVector3 = { x: 0, y: 0, z: 0.085 };
  const trigger: [string, boolean, boolean][] = [
    ["past the shrunken edge only", exceeds(0.38 + 0.0016, theta), false],
    ["2.5 cm past the support", exceeds(0.425, theta), true],
    ["1.5 cm with the angle left", exceeds(0.415, theta), false],
    ["1.5 cm with the angle spent", exceeds(0.415, 0), true],
    ["coming back", exceeds(0.425, theta, { x: 0, y: 0, z: 0.03 }), false],
    ["within the margin", exceeds(0.405, 0, still, 0.01), false],
    ["predicted back but stalled", exceeds(0.465, 0, stall, 0, 0.065), true],
    ["measured shrinking", exceeds(0.465, 0, still, 0, 0.07), false],
    ["measured growing", exceeds(0.465, 0, stall, 0, 0.06), true],
  ];
  for (const [name, actual, expected] of trigger)
    if (actual !== expected) failures.push(`${name}: ${actual}`);

  // 3. The capacity of a pelvis on two hips 0.2 m apart, its mass 0.3 m above
  // them. Only the fields the capacity reads are given.
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  type Rigid = Pick<
    AutoMovieXpbdBody,
    "translation" | "rotation" | "worldCom" | "angvel"
  >;
  const rigid = (
    position: IAutoMovieVector3,
    center: IAutoMovieVector3,
  ): Rigid => ({
    translation: (): IAutoMovieVector3 => position,
    rotation: (): IAutoMovieQuaternion => identity,
    worldCom: (): IAutoMovieVector3 => center,
    angvel: (): IAutoMovieVector3 => zero,
  });
  const segments: ReadonlyMap<string, Rigid> = new Map([
    ["pelvis", rigid({ x: 0, y: 1, z: 0 }, { x: 0, y: 1.3, z: 0 })],
    ["leftUpperLeg", rigid({ x: 0.1, y: 1, z: 0 }, { x: 0.1, y: 0.8, z: 0 })],
    [
      "rightUpperLeg",
      rigid({ x: -0.1, y: 1, z: 0 }, { x: -0.1, y: 0.8, z: 0 }),
    ],
  ]);
  const axis = (
    name: "x" | "z",
    maximumTorque: number,
    reverseTorque: number,
  ): IAutoMoviePhysicalJointAxis => ({
    axis: name,
    minimum: -Math.PI,
    maximum: Math.PI,
    stiffness: 0,
    damping: 0,
    maximumTorque,
    reverseTorque,
    channel: name === "x" ? "flexion" : "abduction",
  });
  const hipJoint = (side: string, x: number): IAutoMoviePhysicalJoint => ({
    id: `${side}Hip`,
    parent: "pelvis",
    child: `${side}UpperLeg`,
    parentFrame: { position: { x, y: 0, z: 0 }, rotation: identity },
    childFrame: { position: zero, rotation: identity },
    axes: [axis("x", 160, 180), axis("z", 100, 85)],
  });
  const segment = (bone: string, mass: number): IAutoMoviePhysicalSegment => ({
    bone,
    neutral: { position: zero, rotation: identity },
    mass,
    centerOfMass: zero,
    inertia: { x: 1, y: 1, z: 1 },
    inertiaRotation: identity,
    shapes: [],
  });
  const profile: Pick<IAutoMoviePhysicalProfile, "joints" | "segments"> = {
    segments: [
      segment("pelvis", 50),
      segment("leftUpperLeg", 8),
      segment("rightUpperLeg", 8),
    ],
    joints: [hipJoint("left", 0.1), hipJoint("right", -0.1)],
  };
  const limb = (bone: string): IAutoMovieFootfallPattern["limbs"][number] => ({
    bone,
    chain: [bone],
    phase: 0,
    duty: 0.5,
    offset: { forward: 0, left: 0 },
    stride: [{ speed: 0, length: 0 }],
  });
  const limbs: IAutoMovieFootfallPattern["limbs"] = [
    limb("leftUpperLeg"),
    limb("rightUpperLeg"),
  ];
  const capacity = (
    stance: IAutoMovieFootfallPattern["limbs"],
    direction: IAutoMovieVector3,
    intended = identity,
  ) =>
    AutoMovieEnginePhysicalStanceHip.hip({
      profile,
      segments,
      limbs,
      stance,
      direction,
      intended,
    });
  const forward = capacity(limbs, { x: 0, y: 0, z: 1 });
  if (!forward) failures.push("two hips side by side have no forward strategy");
  else {
    // About x: each hip's flexion axis, the least of 160 and 180.
    near("forward torque", forward.torque, 320, PhysicalTolerance.ACCUMULATED);
    // The pelvis about the hips' mean: 1 + 50 (0.3)^2.
    near(
      "forward inertia",
      forward.inertia,
      1 + 50 * 0.09,
      PhysicalTolerance.ACCUMULATED,
    );
    near("forward angle", forward.angle, theta, PhysicalTolerance.ACCUMULATED);
  }
  if (capacity(limbs, { x: 1, y: 0, z: 0 }))
    failures.push("two hips side by side have a lateral strategy");
  const single = capacity([limbs[0]!], { x: 1, y: 0, z: 0 });
  if (!single) failures.push("one stance hip has no lateral strategy");
  // About -z: the abduction axis, the least of 100 and 85.
  else
    near(
      "single lateral torque",
      single.torque,
      85,
      PhysicalTolerance.ACCUMULATED,
    );
  // Intended 0.1 rad behind the actual pelvis about x: leaning 0.1 rad forward.
  const leaning = capacity(
    limbs,
    { x: 0, y: 0, z: 1 },
    Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, (-0.1 * 180) / Math.PI),
  );
  if (!leaning) failures.push("a leaning trunk has no forward strategy");
  else
    near(
      "leaning angle left",
      leaning.angle,
      theta - 0.1,
      PhysicalTolerance.ACCUMULATED,
    );

  TestValidator.equals("hip strategy", failures, []);
}
