import {
  type IAutoMovieResolvedBone,
  fitChainToTarget,
  indexSkeletonTopology,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointConstraint,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A bend hint chooses which side a two-bone chain's middle joint folds to,
 * and an effector rotation turns the end bone, without losing the target.
 *
 * The chain is abstract geometry, not a body: a root at (0, 1, 0), a first
 * segment of 0.45 m and a second of 0.42 m hanging along -Y from a joint at
 * (0.1, 1, 0), with unbounded joint ranges so only the hint decides the side.
 *
 * Scenarios:
 * 1. The end sent to (0.1, 0.5, 0.35) with the hint at +X lands on the target
 *    with the middle joint displaced toward +X from the root-to-target line;
 *    with the hint at -X, toward -X; with the hint ahead, ahead.
 * 2. Metamorphic: mirroring the target and the hint through x = 0.1 mirrors
 *    the middle joint.
 * 3. An effector rotation of 30° about +Y is met by the end bone's world
 *    rotation within 1e-6.
 * 4. Without a hint the existing bend search still reaches the target.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public fit and reads joint positions by forward kinematics; a hint ignored, turned into the wrong side, or an effector rotation not applied fails.
 * @evidence contracts/development/testing.md#independent-expectations Reach is a distance below 1 mm; the side is the sign of the middle joint's offset from the root-to-target line along the hint, the meaning of a pole vector in two-bone IK; mirroring is a metamorphic relation of the geometry.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers three hint directions, a mirrored case, an effector rotation and the hint-free path.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on plain chain geometry; it runs in CI. Human limbs (knees forward, elbows back within their range of motion) are covered locally by test_human_motion_measure_surfaces.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 scenarios and what each pins.
 */
export function test_motion_fit_chain_bend(): void {
  const free: IAutoMovieJointConstraint = {
    flexion: { min: -180, max: 180 },
    abduction: { min: -180, max: 180 },
    twist: { min: -180, max: 180 },
  };
  const bone = (
    b: AutoMovieHumanoidBone,
    parent: AutoMovieHumanoidBone | null,
    t: IAutoMovieVector3,
  ): IAutoMovieBone => ({
    bone: b,
    parent,
    rest: {
      translation: t,
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    constraint: free,
  });
  const skeleton: IAutoMovieSkeleton = {
    id: "chain",
    bones: [
      bone("hips", null, { x: 0, y: 1, z: 0 }),
      bone("leftUpperLeg", "hips", { x: 0.1, y: 0, z: 0 }),
      bone("leftLowerLeg", "leftUpperLeg", { x: 0, y: -0.45, z: 0 }),
      bone("leftFoot", "leftLowerLeg", { x: 0, y: -0.42, z: 0 }),
    ],
  };
  const topology = indexSkeletonTopology(skeleton);
  const pose: IAutoMoviePose = { skeleton: "chain", root: null, joints: [] };
  const fk = (
    p: IAutoMoviePose,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    new Map(resolvePose(p, skeleton, {}, {}).map((r) => [r.bone, r]));
  const fit = (
    target: IAutoMovieVector3,
    bend?: IAutoMovieVector3,
    effectorRotation?: IAutoMovieQuaternion,
  ) =>
    fk(
      fitChainToTarget({
        skeleton,
        pose,
        chain: {
          upper: "leftUpperLeg",
          lower: "leftLowerLeg",
          effector: "leftFoot",
        },
        target,
        topology,
        jointAxes: {},
        restFrames: {},
        ...(bend === undefined ? {} : { bend }),
        ...(effectorRotation === undefined ? {} : { effectorRotation }),
      }),
    );
  const root: IAutoMovieVector3 = { x: 0.1, y: 1, z: 0 };
  const dist = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const side = (
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    target: IAutoMovieVector3,
  ): IAutoMovieVector3 => {
    const m: IAutoMovieVector3 = bones.get("leftLowerLeg")!.worldPosition;
    const d: IAutoMovieVector3 = {
      x: target.x - root.x,
      y: target.y - root.y,
      z: target.z - root.z,
    };
    const n: number = Math.hypot(d.x, d.y, d.z);
    const r: IAutoMovieVector3 = {
      x: m.x - root.x,
      y: m.y - root.y,
      z: m.z - root.z,
    };
    const k: number = (r.x * d.x + r.y * d.y + r.z * d.z) / (n * n);
    return { x: r.x - k * d.x, y: r.y - k * d.y, z: r.z - k * d.z };
  };
  const target: IAutoMovieVector3 = { x: 0.1, y: 0.5, z: 0.35 };
  for (const [label, hint, axis, sign] of [
    ["+X", { x: 1.1, y: 0.75, z: 0.2 }, "x", 1],
    ["-X", { x: -0.9, y: 0.75, z: 0.2 }, "x", -1],
    ["ahead", { x: 0.1, y: 0.75, z: 1.2 }, "z", 1],
  ] as const) {
    const bones = fit(target, hint);
    TestValidator.predicate(
      `${label} hint reaches`,
      dist(bones.get("leftFoot")!.worldPosition, target) < 1e-3,
    );
    TestValidator.predicate(
      `${label} hint decides the side`,
      sign * side(bones, target)[axis] > 0.05,
    );
  }
  const mirrored = fit(
    { x: 0.1, y: 0.5, z: 0.35 },
    { x: 0.1 - 1, y: 0.75, z: 0.2 },
  );
  const direct = fit(target, { x: 0.1 + 1, y: 0.75, z: 0.2 });
  const a: IAutoMovieVector3 = direct.get("leftLowerLeg")!.worldPosition;
  const b: IAutoMovieVector3 = mirrored.get("leftLowerLeg")!.worldPosition;
  TestValidator.predicate(
    "mirrored hint mirrors the middle joint",
    Math.abs(a.x - 0.1 + (b.x - 0.1)) < 1e-6 &&
      Math.abs(a.y - b.y) < 1e-6 &&
      Math.abs(a.z - b.z) < 1e-6,
  );
  const turn: IAutoMovieQuaternion = {
    x: 0,
    y: Math.sin(Math.PI / 12),
    z: 0,
    w: Math.cos(Math.PI / 12),
  };
  const q: IAutoMovieQuaternion = fit(
    target,
    { x: 0.1, y: 0.75, z: 1.2 },
    turn,
  ).get("leftFoot")!.worldRotation;
  TestValidator.predicate(
    `effector rotation met (${JSON.stringify(q)})`,
    Math.abs(
      Math.abs(q.x * turn.x + q.y * turn.y + q.z * turn.z + q.w * turn.w) - 1,
    ) < 1e-6,
  );
  TestValidator.predicate(
    "hint-free search reaches",
    dist(fit(target).get("leftFoot")!.worldPosition, target) < 1e-3,
  );
}
