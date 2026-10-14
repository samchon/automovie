import {
  IAutoMovieJointConstraint,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieResolvedBone } from "@automovie/engine";
import { HUMANOID_JOINT_AXES } from "@automovie/engine";
import { reachPose } from "@automovie/engine";
import { resolvePose } from "@automovie/engine";
import { HUMANOID_REST_FRAME } from "@automovie/engine";
import { validatePoseResult } from "@automovie/engine";
import {
  type IAutoMovieBone,
  type IAutoMovieConstraintViolation,
  type IAutoMovieJointPose,
  type IAutoMoviePose,
  type IAutoMovieValidation,
} from "@automovie/interface";
import { createSkeleton } from "../internal/createSkeleton";
import { namedFacts } from "../internal/namedFacts";
import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";
import { violationCount } from "../internal/violationCount";

const SHOULDER: IAutoMovieVector3 = { x: 0.2, y: 1.4, z: 0 };

/** Where the left hand lands, read back through the frame the pose is in. */
const handAt: (
  skeleton: IAutoMovieSkeleton,
  pose: NonNullable<ReturnType<typeof reachPose>>,
) => IAutoMovieVector3 = (
  skeleton: IAutoMovieSkeleton,
  pose: NonNullable<ReturnType<typeof reachPose>>,
): IAutoMovieVector3 =>
  resolvePose(pose, skeleton, HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME).find(
    (b: IAutoMovieResolvedBone): boolean => b.bone === "leftHand",
  )!.worldPosition;

/**
 * The five targets #1345 established a ROM-valid witness for by grid search,
 * plus the two whose existence the search could NOT establish (it plateaued at
 * ~98% of full extension with residuals of 2.5 mm and 1.7 mm). All seven are
 * inside the 0.55 m shell and all seven used to come back ROM-violating.
 */
const WITNESSED: IAutoMovieVector3[] = [
  { x: 0.4, y: 1.2, z: 0.35 },
  { x: 0.3, y: 0.9, z: 0.1 },
  { x: -0.1, y: 1.3, z: 0.2 },
  { x: 0.35, y: 1.7, z: 0.05 },
  { x: 0.25, y: 1.6, z: 0.3 },
];
const UNESTABLISHED: IAutoMovieVector3[] = [
  { x: 0.4, y: 1.0, z: 0.3 },
  { x: 0.3, y: 1.05, z: 0.4 },
];

/**
 * A fused elbow: the hinge exists but is pinned shut, so the chain has one
 * span.
 */
const FUSED: IAutoMovieJointConstraint = {
  flexion: { min: 0, max: 0 },
  abduction: null,
  twist: null,
};

const withElbow: (
  constraint: IAutoMovieJointConstraint,
) => IAutoMovieSkeleton = (
  constraint: IAutoMovieJointConstraint,
): IAutoMovieSkeleton => {
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  return {
    ...skeleton,
    bones: skeleton.bones.map(
      (bone: IAutoMovieBone): IAutoMovieBone =>
        bone.bone === "leftLowerArm" ? { ...bone, constraint } : bone,
    ),
  };
};

/**
 * `reachPose` must return a pose the rig can actually hold (#1345).
 *
 * The analytic solve used to articulate the mid joint as a free swing,
 * `aimRotation(localFore, localGoal)`, which generically decomposes into
 * abduction and twist. The default elbow holds abduction immobile, while the
 * hinge-only solve also leaves its allowed twist unused. A free swing can
 * therefore violate the gate even while placing the hand. This CPU regression
 * does not independently measure living-knee or elbow mechanics. On the canonical humanoid
 * under the engine's own `DEFAULT_HUMANOID_ROM`, exactly one of eight targets
 * came back ROM-clean and that one was the rest pose itself, while a grid
 * search proved valid poses exist for five of the seven failures.
 *
 * The expectations here are taken from the CONTRACT, never from what the solver
 * emits: an elbow's immobile abduction must read exactly `0` because that is
 * what a `null` constraint axis means, and a flexion-only hinge also supplies
 * zero twist even though the default elbow ROM allows twist. The hand must
 * land on the target because that is what an IK solve is for, and the verdict is
 * `validatePose`'s own, so the solver cannot grade itself by a kinder rule than
 * its gate.
 *
 * Scenarios:
 *
 * 1. Positive: each of the five witnessed targets returns a pose `validatePose`
 *    accepts with zero violations, and the hand lands within 1e-4 m.
 * 2. The hinge invariant, which is the mechanism rather than the symptom: the
 *    elbow's abduction and twist are EXACTLY zero for every one of those poses,
 *    so neither the held abduction axis nor the unused twist carries rotation.
 * 3. The two targets the existence search could not settle are also clean, so the
 *    fix is not scoped to the rows that had a witness.
 * 4. Boundary, the rest-pose target: the identity articulation, zero violations,
 *    with the shoulder reading its clinical rest of 90 degrees abduction.
 * 5. Boundary, out of shell: a target four times the arm's length lands the hand
 *    on the 0.55 m shell along the shoulder-to-target ray, still ROM-clean.
 * 6. NEGATIVE TWIN: a fused elbow (`flexion` pinned to `[0, 0]`) cannot reach a
 *    target off its one span, so the verdict is still a refusal with the
 *    flexion axis named. The gate did not become permissive.
 *
 * @evidence contracts/testing.md#behavioral-verification Solves authored arm targets then checks actual pose-gate acceptance, hand contact, flexion-only elbow coordinates and fused-elbow refusal; an unconstrained lower-joint swing or a solver that bypasses its ROM gate fails.
 * @evidence contracts/testing.md#independent-expectations Fixture lengths fix the 0.55-metre shell and ray projection, literal targets fix contact, null abduction requires zero and the hinge construction requires unused twist zero. The actual gate supplies integration parity, not an independent physiological oracle; historical search witnesses explain targets but do not certify human clinical capacity or global solver completeness.
 * @evidence contracts/testing.md#distinguishing-cases Keeps five historically witnessed and two previously unsettled targets, exact held-abduction and unused-twist zero, rest identity/neutral, out-of-shell clamping and a fused-elbow negative twin naming flexion; malformed side/topology and isolated chain degeneracies are separate entries.
 * @evidence contracts/testing.md#execution-ownership This discoverable exported CPU entry directly imports reach, FK and pose-result validation source with a code-authored skeleton; no viewer, GPU, primary clinical experiment or Human asset is run.
 */
export function test_kinematics_reach_rom(): void {
  const skeleton: IAutoMovieSkeleton = createSkeleton();

  // 1 + 2. every witnessed target is clean, and clean for the right reason
  for (const target of WITNESSED) {
    const pose: IAutoMoviePose | null = reachPose(skeleton, "left", target);
    TestValidator.predicate(
      `reach ${JSON.stringify(target)} poses`,
      pose !== null,
    );
    if (pose === null) continue;
    TestValidator.equals(
      `reach ${JSON.stringify(target)} satisfies the rig's ROM`,
      violationCount(validatePoseResult(pose, skeleton)),
      0,
    );
    TestValidator.predicate(
      `and the hand lands on ${JSON.stringify(target)}`,
      vclose(handAt(skeleton, pose), target, 1e-4),
    );
    // Zero tolerance, so this is an exact assertion, but written through
    // `nclose` because the decomposition yields a signed zero on the abduction
    // axis and `-0` is numerically the required 0.
    const elbow: IAutoMovieJointPose = pose.joints.find(
      (j: IAutoMovieJointPose): boolean => j.bone === "leftLowerArm",
    )!;
    TestValidator.predicate(
      `the elbow abducts exactly 0 for ${JSON.stringify(target)}`,
      nclose(elbow.abduction!, 0, 0),
    );
    TestValidator.predicate(
      `the elbow twists exactly 0 for ${JSON.stringify(target)}`,
      nclose(elbow.twist!, 0, 0),
    );
  }

  // 3. the rows the existence proof could not reach are not a separate class
  for (const target of UNESTABLISHED) {
    const pose: IAutoMoviePose = reachPose(skeleton, "left", target)!;
    TestValidator.equals(
      `the unwitnessed target ${JSON.stringify(target)} is clean too`,
      violationCount(validatePoseResult(pose, skeleton)),
      0,
    );
    TestValidator.predicate(
      `and its hand lands on ${JSON.stringify(target)}`,
      vclose(handAt(skeleton, pose), target, 1e-4),
    );
  }

  // 4. BOUNDARY: the rest pose target is the identity articulation. The
  // shoulder's clinical rest is 90 degrees of abduction (a T-pose arm is
  // already abducted), which is what HUMANOID_REST_FRAME's neutral states.
  const restTarget: IAutoMovieVector3 = { x: 0.75, y: 1.4, z: 0 };
  const rest: IAutoMoviePose = reachPose(skeleton, "left", restTarget)!;
  const restUpper: IAutoMovieJointPose = rest.joints.find(
    (j: IAutoMovieJointPose): boolean => j.bone === "leftUpperArm",
  )!;
  const restLower: IAutoMovieJointPose = rest.joints.find(
    (j: IAutoMovieJointPose): boolean => j.bone === "leftLowerArm",
  )!;
  TestValidator.equals(
    "the rest-pose target returns the identity articulation",
    namedFacts([
      [
        "ncloseRestUpperFlexion",
        (): boolean => nclose(restUpper.flexion!, 0, 0),
      ],
      [
        "ncloseRestUpperAbduction",
        (): boolean => nclose(restUpper.abduction!, 90, 0),
      ],
      ["ncloseRestUpperTwist", (): boolean => nclose(restUpper.twist!, 0, 0)],
      [
        "ncloseRestLowerFlexion",
        (): boolean => nclose(restLower.flexion!, 0, 0),
      ],
      [
        "ncloseRestLowerAbduction",
        (): boolean => nclose(restLower.abduction!, 0, 0),
      ],
      ["ncloseRestLowerTwist", (): boolean => nclose(restLower.twist!, 0, 0)],
    ]),
    {
      ncloseRestUpperFlexion: true,
      ncloseRestUpperAbduction: true,
      ncloseRestUpperTwist: true,
      ncloseRestLowerFlexion: true,
      ncloseRestLowerAbduction: true,
      ncloseRestLowerTwist: true,
    },
  );
  TestValidator.equals(
    "and it is ROM-clean",
    violationCount(validatePoseResult(rest, skeleton)),
    0,
  );

  // 5. BOUNDARY: past the shell, the arm extends along the ray and stops on it.
  const far: IAutoMovieVector3 = { x: 0.2, y: 3.6, z: 0 };
  const farPose: IAutoMoviePose = reachPose(skeleton, "left", far)!;
  const ray: { x: number; y: number; z: number } = {
    x: far.x - SHOULDER.x,
    y: far.y - SHOULDER.y,
    z: far.z - SHOULDER.z,
  };
  const length: number = Math.hypot(ray.x, ray.y, ray.z);
  TestValidator.predicate(
    "an unreachable target stops the hand on the 0.55 m shell",
    vclose(
      handAt(skeleton, farPose),
      {
        x: SHOULDER.x + (ray.x / length) * 0.55,
        y: SHOULDER.y + (ray.y / length) * 0.55,
        z: SHOULDER.z + (ray.z / length) * 0.55,
      },
      1e-4,
    ),
  );
  TestValidator.equals(
    "and the extended pose is still one the rig can hold",
    violationCount(validatePoseResult(farPose, skeleton)),
    0,
  );

  // 6. NEGATIVE TWIN: a rig that genuinely cannot hold the pose is still
  // refused, and refused at the axis that refuses it.
  const fusedRig: IAutoMovieSkeleton = withElbow(FUSED);
  const fused: IAutoMoviePose = reachPose(fusedRig, "left", WITNESSED[0]!)!;
  const fusedResult: IAutoMovieValidation = validatePoseResult(fused, fusedRig);
  TestValidator.equals(
    "a fused elbow still fails the ROM gate, naming its flexion",
    namedFacts([
      ["refused", (): boolean => fusedResult.success === false],
      [
        "violated",
        (): boolean =>
          fusedResult.success === false &&
          fusedResult.violations.some(
            (v: IAutoMovieConstraintViolation): boolean =>
              v.kind === "rom" && v.path.endsWith(".flexion"),
          ),
      ],
    ]),
    { refused: true, violated: true },
  );
}
