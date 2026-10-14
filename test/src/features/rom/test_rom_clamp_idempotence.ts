import { clampPose } from "../../../../packages/engine/src/rom/clampPose";
import { AutoMovieHumanoidBone, IAutoMovieJointPose, type IAutoMoviePose, type IAutoMovieSkeleton } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { createSkeleton } from "../internal/createSkeleton";
import { createValidPose } from "../internal/createValidPose";
import { joint } from "../internal/joint";
import { makePose } from "../internal/makePose";
import { makeRng } from "../internal/makeRng";
import { uniform } from "../internal/uniform";
import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

const skeleton: IAutoMovieSkeleton = createSkeleton();
const ARTICULATED: AutoMovieHumanoidBone[] = [
  "spine",
  "chest",
  "neck",
  "head",
  "leftUpperArm",
  "leftLowerArm",
  "leftUpperLeg",
  "leftLowerLeg",
];

/** Existing eight-joint angle triples sampled from [-200,200), including in-range values. */
const wildPose: (rng: () => number) => IAutoMovieJointPose[] = (rng: () => number): IAutoMovieJointPose[] =>
  ARTICULATED.map((bone: AutoMovieHumanoidBone): IAutoMovieJointPose  =>
    joint(bone, {
      flexion: uniform(rng, -200, 200),
      abduction: uniform(rng, -200, 200),
      twist: uniform(rng, -200, 200),
    }),
  );

/**
 * ROM clamping must be **idempotent**: clamping an already-clamped pose changes
 * nothing. If it were not, a second validation/clamp pass could drift a pose
 * that the first pass called settled, the fixed point the "clamp then validate"
 * contract assumes. Two hundred seeded poses cover a fixed population of
 * eight conventional joint names and angles in [-200,200); individual angles
 * can be inside their bounds, and this sweep does not cover every branch or
 * establish population-specific clinical ranges.
 *
 * Scenarios:
 *
 * 1. Over 200 seeded wild poses, `clampPose(clampPose(p)) === clampPose(p)`
 *    exactly: one clamp reaches the fixed point.
 * 2. Non-vacuity: a wild pose is actually changed by the first clamp, so the
 *    idempotence check is exercising the clamp path, not comparing two no-ops.
 * 3. A pose already inside ROM passes through clamping unchanged.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls clampPose once and twice on each existing seeded pose, checks exact fixed-point values and a real first-pass joint change, then checks an authored in-range pose remains unchanged.
 * @evidence contracts/testing.md#independent-expectations Projection is expected to settle after one application and preserve an already-admitted input; replay alone cannot independently establish that the settled values are the correct bounds, which clamp-pose and cone examples address.
 * @evidence contracts/testing.md#distinguishing-cases The fixed seed supplies200 eight-joint angle triples in [-200,200), alongside the in-range neighbor and per-pose non-vacuity; finite sampling is not exhaustive branch, anatomical-population or arbitrary multi-turn cone coverage.
 * @evidence contracts/testing.md#execution-ownership The named test_rom_clamp_idempotence entry synchronously runs the actual numerical clamp with a local seeded generator and existing engine rig; it uses no global random patch, new Human asset, viewer or validation driver.
 */
export function test_rom_clamp_idempotence(): void {
  const rng: () => number = makeRng(0x7c3f0055);
  for (let i: number = 0; i < 200; ++i) {
    const pose: IAutoMoviePose = makePose(wildPose(rng));
    const once: IAutoMoviePose = clampPose(pose, skeleton);
    const twice: IAutoMoviePose = clampPose(once, skeleton);
    TestValidator.predicate(`clamp is idempotent #${i}`, samePose(twice, once));
    TestValidator.predicate(
      `wild pose is actually clamped #${i}`,
      !sameJoints(once.joints, pose.joints),
    );
  }

  const valid: IAutoMoviePose = createValidPose();
  TestValidator.predicate(
    "an in-ROM pose clamps to itself",
    samePose(clampPose(valid, skeleton), valid),
  );
}

/** Preserve null versus finite scalar values, with zero numeric tolerance. */
function sameAxis(actual: number | null, expected: number | null): boolean {
  return actual === null || expected === null ? actual === expected : nclose(actual, expected, 0);
}

/** Compare supported joint fields in their existing order, without an external bound oracle. */
function sameJoints(actual: IAutoMovieJointPose[], expected: IAutoMovieJointPose[]): boolean {
  return actual.length === expected.length && actual.every((entry: IAutoMovieJointPose, index: number): boolean => {
    const other: IAutoMovieJointPose = expected[index]!;
    return entry.bone === other.bone && sameAxis(entry.flexion, other.flexion) && sameAxis(entry.abduction, other.abduction) && sameAxis(entry.twist, other.twist);
  });
}

/** Compare supported pose fields; root quaternion components retain their authored signs. */
function samePose(actual: IAutoMoviePose, expected: IAutoMoviePose): boolean {
  if (actual.skeleton !== expected.skeleton || !sameJoints(actual.joints, expected.joints)) return false;
  if (actual.root === null || expected.root === null) return actual.root === expected.root;
  return vclose(actual.root.translation, expected.root.translation, 0) && vclose(actual.root.scale, expected.root.scale, 0) &&
    nclose(actual.root.rotation.x, expected.root.rotation.x, 0) && nclose(actual.root.rotation.y, expected.root.rotation.y, 0) &&
    nclose(actual.root.rotation.z, expected.root.rotation.z, 0) && nclose(actual.root.rotation.w, expected.root.rotation.w, 0);
}
