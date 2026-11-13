import {
  DEFAULT_HUMANOID_ROM,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  Vector3,
  jointToQuaternion,
  swingConeAngle,
  swingTwistRange,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeRng, randomUnitQuaternion } from "../internal/random";

/**
 * A ball joint's range read by swing and twist holds what it states: the
 * twist's sign is the clinical one, the swing region is a star about the
 * rest direction and holds every direction the flexion and abduction ranges
 * reach, and the way back into the range leaves a rotation inside it as it
 * is and moves continuously with a rotation outside.
 *
 * The joints are the shoulders and the hips of the default humanoid table,
 * each given a swing-twist twist interval (the shoulders [-70, 90], the hips
 * [-45, 45]), with the humanoid's axes and rest frames.
 *
 * Scenarios:
 * 1. Sign: on the T-pose arm, the turn about the arm's own axis that carries
 *    the forward direction up (an elbow bent forward at a right angle, its
 *    forearm raised) reads as +90 degrees of twist on both sides: positive
 *    is external rotation, as the constraint's twist states.
 * 2. The region holds the ranges: for 4000 seeded pairs inside a joint's
 *    flexion and abduction intervals (and its swing cone), with no twist,
 *    the limb's direction lies within the region's radius on its circle, to
 *    two degrees (the radius is read on rays a degree apart by a half-degree
 *    scan, which can step over a sliver of reach narrower than its step).
 * 3. Inside is kept: a rotation made of a reached direction and a twist
 *    inside its interval comes back from the projection unchanged.
 * 4. Continuity: along 40 seeded paths between two rotations, cut into 1000
 *    steps, wherever the swing stays under 150 degrees (the decomposition is
 *    singular at 180, and at a swing s the azimuth turns up to
 *    1 / sin s times the step, twice at 150), the twist less than 60 degrees past its
 *    interval (a clamp of a turn onto an arc breaks at the turn farthest
 *    from it, 80 degrees past a shoulder's interval) and the swing less than
 *    30 degrees past the region, a step of under 0.4 degrees moves the
 *    projected rotation no more than six times the step plus 0.05 degrees
 *    (the region's radius turns at most three degrees per degree of
 *    azimuth, and the azimuth moves up to twice the step there), and the
 *    projected rotation is inside the range (its overshoot under a millionth
 *    of a degree).
 * 5. The default shoulder's interval, provisional (one interval of the turn
 *    measured from the T-pose for every swing, where the anatomical limit
 *    depends on the swing): a hand behind the head, clasped behind the back
 *    and on the hip (the three-angle readings the engine's own reaches gave,
 *    turns of 128.4, -103.8 and -80.2 from rest) lie inside it, and each with
 *    the forearm wound a further 60 degrees about the arm, away from rest's
 *    turn, lies outside.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public reading, measure and projection on the humanoid's own axes and frames; a reversed twist sign, a region with a hole along a ray, a range the region misses, a projection that moves a rotation inside or steps between two near rotations fails with the joint and the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The sign comes from what external rotation does to a forearm; the region's content from the clinical intervals through the forward conversion; continuity from the steps' sizes; nothing is read back from the radius table.
 * @evidence contracts/development/testing.md#distinguishing-cases Both shoulders and both hips, both readings of a direction by the seeded triples, rotations inside and outside, and paths across the region's edge.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic on engine tables; it runs in the CI test job.
 * @evidence contracts/development/common.md#meaningful-documentation States the joints, their intervals and the 5 scenarios with their bounds.
 */
export function test_kinematics_swing_twist_range(): void {
  const complaints: string[] = [];
  const joints: readonly (readonly [
    AutoMovieHumanoidBone,
    IAutoMovieJointConstraint,
  ])[] = (
    [
      ["leftUpperArm", [-70, 90]],
      ["rightUpperArm", [-70, 90]],
      ["leftUpperLeg", [-45, 45]],
      ["rightUpperLeg", [-45, 45]],
    ] as const
  ).map(
    ([bone, [min, max]]): readonly [
      AutoMovieHumanoidBone,
      IAutoMovieJointConstraint,
    ] => [
      bone,
      { ...DEFAULT_HUMANOID_ROM[bone]!, swingTwist: { twist: { min, max } } },
    ],
  );
  const turn = (a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number =>
    (2 *
      Math.acos(
        Math.min(1, Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w)),
      ) *
      180) /
    Math.PI;
  const rng: () => number = makeRng(0x5717c4);

  for (const [bone, constraint] of joints) {
    const joint: swingTwistRange.IJoint = {
      axes: HUMANOID_JOINT_AXES[bone]!,
      frame: HUMANOID_REST_FRAME[bone],
    };
    const axis: IAutoMovieVector3 = Vector3.normalize(joint.axes.twist);

    // 1. The twist's sign, on the arms.
    if (bone.endsWith("UpperArm")) {
      const raising: number[] = [90, -90].filter(
        (degrees: number): boolean =>
          Quaternion.rotateVector(Quaternion.fromAxisAngle(axis, degrees), {
            x: 0,
            y: 0,
            z: 1,
          }).y > 0.999,
      );
      const read: number | undefined =
        raising.length === 1
          ? swingTwistRange.read(
              Quaternion.fromAxisAngle(axis, raising[0]!),
              joint,
            ).twist
          : undefined;
      if (read === undefined || Math.abs(read - 90) > 1e-6)
        complaints.push(
          `${bone}: raising a forward forearm by a turn about the arm reads a twist of ${read?.toFixed(3)}, +90 (external) expected`,
        );
    }

    // 2. The region holds every direction the ranges reach.
    let missed: number = 0;
    let first: string = "";
    for (let k: number = 0; k < 4000; ++k) {
      const flexion: number =
        constraint.flexion!.min +
        (constraint.flexion!.max - constraint.flexion!.min) * rng();
      const abduction: number =
        constraint.abduction!.min +
        (constraint.abduction!.max - constraint.abduction!.min) * rng();
      if (
        typeof constraint.swingDeg === "number" &&
        swingConeAngle(flexion, abduction) > constraint.swingDeg
      )
        continue;
      const reading: swingTwistRange.IReading = swingTwistRange.read(
        jointToQuaternion(
          { flexion, abduction, twist: 0 },
          joint.axes,
          joint.frame,
        ),
        joint,
      );
      const edge: number = swingTwistRange.radius(
        constraint,
        joint,
        reading.azimuth,
      );
      if (reading.swing > edge + 2 && missed++ === 0)
        first = `${flexion.toFixed(1)}/${abduction.toFixed(1)} swings ${reading.swing.toFixed(2)} on the circle at ${reading.azimuth.toFixed(1)}, of radius ${edge.toFixed(2)}`;
    }
    if (missed > 0)
      complaints.push(
        `${bone}: ${missed} directions inside the ranges fall outside the region, first ${first}`,
      );
    // 3 and 4. The projection.
    let worst: { value: number; at: string } = { value: 0, at: "" };
    let outside: { value: number; at: string } = { value: 0, at: "" };
    let moved: number = 0;
    for (let path: number = 0; path < 40; ++path) {
      const a: IAutoMovieQuaternion = randomUnitQuaternion(rng);
      const b: IAutoMovieQuaternion = randomUnitQuaternion(rng);
      let before: IAutoMovieQuaternion | undefined;
      let previous: IAutoMovieQuaternion | undefined;
      for (let k: number = 0; k <= 1000; ++k) {
        const here: IAutoMovieQuaternion = Quaternion.slerp(a, b, k / 1000);
        const reading: swingTwistRange.IReading = swingTwistRange.read(
          here,
          joint,
        );
        const twist: IAutoMovieAngleRange = constraint.swingTwist!.twist;
        const beyondTwist: number = Math.min(
          ...[-360, 0, 360].map((k: number): number =>
            Math.max(0, twist.min - (reading.twist + k), reading.twist + k - twist.max),
          ),
        );
        if (
          reading.swing >= 150 ||
          beyondTwist >= 60 ||
          reading.swing >
            swingTwistRange.radius(constraint, joint, reading.azimuth) + 30
        ) {
          before = undefined;
          previous = undefined;
          continue;
        }
        const projected: IAutoMovieQuaternion = swingTwistRange.project(
          here,
          constraint,
          joint,
        );
        const over: number = swingTwistRange.overshoot(
          projected,
          constraint,
          joint,
        );
        if (over > outside.value)
          outside = { value: over, at: `path ${path} step ${k}` };
        if (
          swingTwistRange.overshoot(here, constraint, joint) === 0 &&
          turn(projected, here) > 1e-3
        )
          moved++;
        if (
          before !== undefined &&
          previous !== undefined &&
          turn(before, here) < 0.4
        ) {
          const value: number =
            turn(previous, projected) - 6 * turn(before, here);
          if (value > worst.value)
            worst = {
              value,
              at: `path ${path} step ${k}: ${[before, here]
                .map((q: IAutoMovieQuaternion): string => {
                  const r: swingTwistRange.IReading = swingTwistRange.read(q, joint);
                  const p: swingTwistRange.IReading = swingTwistRange.read(
                    swingTwistRange.project(q, constraint, joint),
                    joint,
                  );
                  return `in swing ${r.swing.toFixed(2)} azimuth ${r.azimuth.toFixed(2)} twist ${r.twist.toFixed(2)} radius ${swingTwistRange.radius(constraint, joint, r.azimuth).toFixed(2)}, out swing ${p.swing.toFixed(2)} azimuth ${p.azimuth.toFixed(2)} twist ${p.twist.toFixed(2)}`;
                })
                .join(" then ")}`,
            };
        }
        before = here;
        previous = projected;
      }
    }
    if (moved > 0)
      complaints.push(
        `${bone}: ${moved} rotations inside the range are moved by the projection`,
      );
    if (outside.value > 1e-6)
      complaints.push(
        `${bone}: a projected rotation lies ${outside.value.toFixed(6)} degrees outside the range at ${outside.at}`,
      );
    if (worst.value > 0.05)
      complaints.push(
        `${bone}: the projected rotation turns ${worst.value.toFixed(2)} degrees more than six times the step at ${worst.at}, within 0.05 expected`,
      );
  }

  // 5. The default shoulder's provisional interval: daily poses in, the
  // forearm wound a further 60 degrees past each out.
  const shoulder: IAutoMovieJointConstraint = DEFAULT_HUMANOID_ROM.leftUpperArm!;
  const arm: swingTwistRange.IJoint = {
    axes: HUMANOID_JOINT_AXES.leftUpperArm!,
    frame: HUMANOID_REST_FRAME.leftUpperArm,
  };
  const axis: IAutoMovieVector3 = Vector3.normalize(arm.axes.twist);
  for (const [pose, triple] of [
    ["a hand behind the head", [180, -10.2, -51.6]],
    ["a hand clasped behind the back", [-27.2, 11.3, -81.3]],
    ["a hand on the hip", [-10.4, 27.6, -73.9]],
  ] as const) {
    const q: IAutoMovieQuaternion = jointToQuaternion(
      { flexion: triple[0], abduction: triple[1], twist: triple[2] },
      arm.axes,
      arm.frame,
    );
    const inside: number = swingTwistRange.overshoot(q, shoulder, arm);
    if (inside > 0)
      complaints.push(
        `the default shoulder refuses ${pose} by ${inside.toFixed(2)} degrees, inside expected`,
      );
    const turned: number = swingTwistRange.read(q, arm).twist;
    const wound: number[] = [60, -60].map(
      (rig: number): number =>
        swingTwistRange.read(
          Quaternion.multiply(q, Quaternion.fromAxisAngle(axis, rig)),
          arm,
        ).twist,
    );
    // The way past the end the pose is nearer, 60 degrees on: the wound
    // turn whose difference from the pose's, read around the circle, has the
    // pose's sign.
    const change = (w: number): number =>
      ((((w - turned + 180) % 360) + 360) % 360) - 180;
    const which: number = change(wound[0]!) * turned >= 0 ? 0 : 1;
    const away: number = wound[which]!;
    const outside: number = swingTwistRange.overshoot(
      Quaternion.multiply(
        q,
        Quaternion.fromAxisAngle(axis, which === 0 ? 60 : -60),
      ),
      shoulder,
      arm,
    );
    if (!(outside > 0))
      complaints.push(
        `the default shoulder admits ${pose} with the forearm wound 60 degrees further (turn ${turned.toFixed(1)} to ${away.toFixed(1)}), refused expected`,
      );
  }
  TestValidator.equals(
    "a swing-twist range holds what it states",
    complaints,
    [],
  );
}
