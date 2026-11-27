import { AutoMovieEngineKinematics, AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieBodyMomentum, IAutoMovieJointPose, IAutoMovieMotionHumanBody, IAutoMovieQuaternion, IAutoMovieResolveCenterOfMass, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { throwsError } from "../internal/throwsError";

/**
 * The whole-body inertia tensor and momenta of a posed body (#3422), read
 * from the one mass model of `AutoMovieEngineKinematics.resolveAutoMovieCenterOfMass`.
 *
 * Scenarios:
 * 1. Rigid rotation: the average man and the small woman, in their rest pose
 *    and in a crouch (hips and knees flexed, trunk bent), turned rigidly about
 *    their own centre of mass at 1 rad/s about a tilted axis over 1 ms: the
 *    angular momentum equals `I w` with `I` the tensor of the interval's
 *    middle pose within 1e-6 relative, and the linear momentum is zero within
 *    1e-9 kg m/s (the definition of a rigid motion about a fixed centre; the
 *    central difference's own error for a turn of 1 mrad is 1.7e-7).
 * 2. Two boxes of 3 kg, 0.2 x 0.1 x 0.4 m, their centres 0.3 m either side of
 *    the origin along x, the second turned a quarter about z: the tensor
 *    equals the closed form of the box moments `m (b² + c²) / 12`, the turned
 *    box's x and y moments swapped, plus the parallel-axis term `m a²` on y
 *    and z, within 1e-12.
 * 3. Metamorphic, on both crouches: translating every bone by (3, 0, -2) m
 *    changes no tensor entry beyond 1e-12 of the tensor's largest; turning
 *    every bone about the origin by a rotation R gives `R I Rᵀ` within 1e-9
 *    relative.
 * 4. The symmetric rest pose of the average man has products of inertia
 *    across its sagittal plane (`I_xy`, `I_xz`) within 1e-6 kg m² of zero.
 * 5. A uniform translation at v = (0.4, -0.3, 1.2) m/s gives linear momentum
 *    `m v` within 1e-9 relative, with `m` the profile's mass, and no angular
 *    momentum about the centre beyond 1e-9 kg m²/s.
 * 6. A non-positive interval is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public tensor and momentum readings on real bodies and a two-box model; a segment whose centre or principal frame is carried in the wrong frame, a parallel-axis term with the wrong sign, an angular velocity from the wrong relative rotation, or a translation leaking into the tensor fails.
 * @evidence contracts/development/testing.md#independent-expectations Rigid motion's `L = I w` and zero linear momentum, the box's moments and the parallel-axis theorem written out by hand, a tensor's transformation law `R I Rᵀ`, the mirror symmetry of a symmetric body and `p = m v`; tolerances are the central difference's stated error and double precision.
 * @evidence contracts/development/testing.md#distinguishing-cases Two statures, two poses, a primitive model with a turned part, translation and rotation, still and moving, and a refused interval; the flight that integrates these momenta belongs to `test_engine_airborne_rotation`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test of pure engine functions on in-memory bodies, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios with their bounds and their bases.
 */
export function test_engine_body_momentum(): void {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  const findings: string[] = [];

  // A rigid motion of every bone: turned about `about` by `q`, then moved by `shift`.
  const moved = (
    bones: Bones,
    about: IAutoMovieVector3,
    q: IAutoMovieQuaternion,
    shift: IAutoMovieVector3,
  ): Bones =>
    new Map(
      [...bones].map(
        ([bone, r]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): [
          AutoMovieHumanoidBone,
          IAutoMovieResolvedBone,
        ] => [
          bone,
          {
            ...r,
            worldPosition: AutoMovieEngineVector3.add(
              AutoMovieEngineVector3.add(
                about,
                AutoMovieEngineQuaternion.rotateVector(
                  q,
                  AutoMovieEngineVector3.subtract(r.worldPosition, about),
                ),
              ),
              shift,
            ),
            worldRotation: AutoMovieEngineQuaternion.multiply(q, r.worldRotation),
          },
        ],
      ),
    );
  const posed = (
    body: IAutoMovieMotionHumanBody,
    joints: IAutoMovieJointPose[],
  ): Bones =>
    new Map(
      AutoMovieEngineKinematics.resolvePose(
        { skeleton: body.skeleton.id, root: null, joints },
        body.skeleton,
      ).map(
        (
          r: IAutoMovieResolvedBone,
        ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r],
      ),
    );
  const joint = (
    bone: AutoMovieHumanoidBone,
    flexion: number,
  ): IAutoMovieJointPose => ({ bone, flexion, abduction: 0, twist: 0 });
  const largest = (t: readonly (readonly number[])[]): number =>
    Math.max(...t.flat().map((v: number): number => Math.abs(v)));
  const ZERO: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const STILL: IAutoMovieQuaternion = AutoMovieEngineQuaternion.identity();

  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const model: IAutoMovieResolveCenterOfMass.IModel =
      AutoMovieEngineKinematics.resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
    const poses: Record<"rest" | "crouch", Bones> = {
      rest: posed(body, []),
      crouch: posed(body, [
        joint("spine", 30),
        joint("leftUpperLeg", 90),
        joint("rightUpperLeg", 90),
        joint("leftLowerLeg", 110),
        joint("rightLowerLeg", 110),
      ]),
    };
    for (const [pose, bones] of Object.entries(poses)) {
      // 1. Rigid rotation about the centre: L = I w, no linear momentum.
      const centre: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(
        model,
        bones,
      );
      const axis: IAutoMovieVector3 = AutoMovieEngineVector3.normalize({
        x: 0.3,
        y: 1,
        z: -0.5,
      });
      const rate: number = 1;
      const dt: number = 1e-3;
      const half = (sign: number): Bones =>
        moved(
          bones,
          centre,
          AutoMovieEngineQuaternion.fromAxisAngle(axis, (sign * rate * dt * 90) / Math.PI),
          ZERO,
        );
      const m: IAutoMovieBodyMomentum = AutoMovieEngineKinematics.resolveAutoMovieMomentum(
        model,
        half(-1),
        half(1),
        dt,
      );
      const expected: IAutoMovieVector3 = AutoMovieEngineKinematics.applyAutoMovieMomentumTensor(
        AutoMovieEngineKinematics.resolveAutoMovieMomentumInertia(model, bones),
        AutoMovieEngineVector3.scale(axis, rate),
      );
      const relative: number =
        AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(m.angular, expected)) /
        AutoMovieEngineVector3.length(expected);
      if (!(relative <= 1e-6))
        findings.push(`${name} ${pose}: L differs from I w by ${relative}`);
      if (!(AutoMovieEngineVector3.length(m.linear) <= 1e-9))
        findings.push(
          `${name} ${pose}: linear momentum ${AutoMovieEngineVector3.length(m.linear)} under a rigid turn`,
        );

      // 3. Translation leaves the tensor; a rotation transforms it as R I Rᵀ.
      const tensor: number[][] = AutoMovieEngineKinematics.resolveAutoMovieMomentumInertia(model, bones);
      const shifted: number[][] = AutoMovieEngineKinematics.resolveAutoMovieMomentumInertia(
        model,
        moved(bones, ZERO, STILL, { x: 3, y: 0, z: -2 }),
      );
      const scale: number = largest(tensor);
      const drift: number = largest(
        tensor.map((row: number[], i: number): number[] =>
          row.map((v: number, j: number): number => v - shifted[i]![j]!),
        ),
      );
      if (!(drift <= 1e-12 * scale))
        findings.push(
          `${name} ${pose}: a translation changes the tensor by ${drift}`,
        );
      const r: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
        AutoMovieEngineVector3.normalize({ x: 1, y: -2, z: 0.7 }),
        73,
      );
      const turned: number[][] = AutoMovieEngineKinematics.resolveAutoMovieMomentumInertia(
        model,
        moved(bones, ZERO, r, ZERO),
      );
      let worst: number = 0;
      for (let i: number = 0; i < 3; i++) {
        // Column i of R I Rᵀ is R I (Rᵀ e_i), read against the turned body's tensor.
        const back: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
          AutoMovieEngineQuaternion.inverse(r),
          [
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 0, y: 0, z: 1 },
          ][i]!,
        );
        const want: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
          r,
          AutoMovieEngineKinematics.applyAutoMovieMomentumTensor(tensor, back),
        );
        const got: IAutoMovieVector3 = {
          x: turned[0]![i]!,
          y: turned[1]![i]!,
          z: turned[2]![i]!,
        };
        worst = Math.max(worst, AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(want, got)));
      }
      if (!(worst <= 1e-9 * scale))
        findings.push(
          `${name} ${pose}: a turned body's tensor misses R I Rᵀ by ${worst}`,
        );

      // 5. A uniform translation: p = m v and no angular momentum.
      const v: IAutoMovieVector3 = { x: 0.4, y: -0.3, z: 1.2 };
      const glide: IAutoMovieBodyMomentum = AutoMovieEngineKinematics.resolveAutoMovieMomentum(
        model,
        bones,
        moved(bones, ZERO, STILL, AutoMovieEngineVector3.scale(v, 0.01)),
        0.01,
      );
      const p: IAutoMovieVector3 = AutoMovieEngineVector3.scale(v, body.profile.mass);
      if (
        !(
          AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(glide.linear, p)) <=
          1e-9 * AutoMovieEngineVector3.length(p)
        )
      )
        findings.push(
          `${name} ${pose}: linear momentum ${JSON.stringify(glide.linear)} for m v ${JSON.stringify(p)}`,
        );
      if (!(AutoMovieEngineVector3.length(glide.angular) <= 1e-9))
        findings.push(
          `${name} ${pose}: a translation reads angular momentum ${AutoMovieEngineVector3.length(glide.angular)}`,
        );
    }

    // 4. The symmetric rest pose has no products across the sagittal plane.
    if (name === "m-average") {
      const rest: number[][] = AutoMovieEngineKinematics.resolveAutoMovieMomentumInertia(
        model,
        poses.rest,
      );
      const xy: number = rest[0]![1]!;
      const xz: number = rest[0]![2]!;
      if (!(Math.abs(xy) <= 1e-6 && Math.abs(xz) <= 1e-6))
        findings.push(
          `${name} rest: products across the sagittal plane I_xy ${xy}, I_xz ${xz}`,
        );
    }
  }

  // 2. Two boxes, the second turned a quarter about z, against the closed form.
  const mass: number = 3;
  const [w, h, d] = [0.2, 0.1, 0.4];
  const box: IAutoMovieVector3 = {
    x: (mass * (h * h + d * d)) / 12,
    y: (mass * (w * w + d * d)) / 12,
    z: (mass * (w * w + h * h)) / 12,
  };
  const quarter: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
    { x: 0, y: 0, z: 1 },
    90,
  );
  const twoBox: IAutoMovieResolveCenterOfMass.IModel = {
    mass: 2 * mass,
    segments: [
      {
        bone: "hips",
        mass,
        point: { x: -0.3, y: 0, z: 0 },
        inertia: box,
        axes: STILL,
      },
      {
        bone: "spine",
        mass,
        point: { x: 0.3, y: 0, z: 0 },
        inertia: box,
        axes: quarter,
      },
    ],
  };
  const frame: IAutoMovieResolvedBone = {
    bone: "hips",
    localRotation: STILL,
    worldPosition: ZERO,
    worldRotation: STILL,
  };
  const pair: Bones = new Map([
    ["hips", frame],
    ["spine", { ...frame, bone: "spine" }],
  ]);
  const closed: number[][] = [
    [box.x + box.y, 0, 0],
    [0, box.y + box.x + 2 * mass * 0.09, 0],
    [0, 0, 2 * box.z + 2 * mass * 0.09],
  ];
  const twoTensor: number[][] = AutoMovieEngineKinematics.resolveAutoMovieMomentumInertia(twoBox, pair);
  for (let i: number = 0; i < 3; i++)
    for (let j: number = 0; j < 3; j++)
      if (!(Math.abs(twoTensor[i]![j]! - closed[i]![j]!) <= 1e-12))
        findings.push(
          `two boxes: entry ${i}${j} is ${twoTensor[i]![j]}, closed form ${closed[i]![j]}`,
        );

  // 6. A non-positive interval is refused.
  TestValidator.predicate(
    "a zero interval is refused",
    throwsError((): void => {
      AutoMovieEngineKinematics.resolveAutoMovieMomentum(twoBox, pair, pair, 0);
    }),
  );

  TestValidator.predicate(
    `whole-body inertia and momentum: ${findings.join("; ") || "all hold"}`,
    findings.length === 0,
  );
}
