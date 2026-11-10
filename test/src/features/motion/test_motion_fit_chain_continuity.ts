import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  fitChainToTarget,
  indexSkeletonTopology,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A hinged limb following a moving target moves continuously from the
 * continuous swivel cost alone, while the bend hint lies close to the reach
 * axis and its side turns; and a reference pose breaks an exact tie toward
 * its own side.
 *
 * The rig is a kinematic chain fixture (a trunk and a T-posed left arm,
 * upper arm 0.3 m and forearm 0.25 m), read with HUMANOID_JOINT_AXES and
 * HUMANOID_REST_FRAME.
 *
 * Scenarios:
 * 1. The target sweeps 0.4 m across, from the body side to the outside,
 *    0.42 m ahead of the shoulder and 0.1 m below it, in 5 mm steps, with the
 *    hint 1 m ahead of the shoulder, so it lies within about 12 degrees of
 *    the reach axis and the side it gives turns across the sweep. Each frame
 *    is solved on its own with no reference. The elbow moves at most 25 mm
 *    between consecutive frames (five times the target's step, the elbow's
 *    lever over the wrist's) and the wrist lands within 1 mm at every frame;
 *    the sweep is bit-identical when repeated. Two paths are left out because
 *    they jump for reasons no cost weighting removes: one passing under the
 *    shoulder, where the hint's side reaches the upper arm's twist limit and
 *    the legal swivels split; and one with the hint within a degree of the
 *    axis, where its side turns half a turn over a few millimetres.
 * 2. With the target directly below the shoulder and the hint below it, the
 *    hint gives no side at all. Two references are legal solutions at that
 *    target, fitted with hints behind the shoulder toward the outside and
 *    toward the body (the legal arc, as an elbow ahead would need the upper
 *    arm turned past its twist limit), their elbows at least 5 cm apart;
 *    each pulls the tied fit to its own side, the elbow nearer its
 *    reference's elbow than the other reference's.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public fit along a target path and at a tie, reading elbows and wrists through forward kinematics; a branch flip shows as an elbow jump, a missed target as a wrist miss, an ignored reference as an elbow on the other side.
 * @evidence contracts/development/testing.md#independent-expectations The bound follows from the chain's geometry (an elbow 0.3 m out moving with a wrist that moves 5 mm a frame needs no more than a few times that without a branch change); positions come from forward kinematics; the references are the fit's own solutions under hints on either flank, so a reference is a legal pose and not a pose the solver must be trusted to reproduce.
 * @evidence contracts/development/testing.md#distinguishing-cases Frames with the hint's side on either flank of the reach axis and turning between them, a repeat, and an exact tie with references on either flank; branch choice by the hint and range is owned by test_motion_fit_chain_reach.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory engine unit with no body or render; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 scenarios and what each pins.
 */
export function test_motion_fit_chain_continuity(): void {
  const skeleton: IAutoMovieSkeleton = arm();
  const topology = indexSkeletonTopology(skeleton);
  const shoulder: IAutoMovieVector3 = { x: 0.18, y: 1.5, z: 0 };
  const fit = (
    target: IAutoMovieVector3,
    bend: IAutoMovieVector3,
    reference?: IAutoMoviePose,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
    const pose: IAutoMoviePose = fitChainToTarget({
      skeleton,
      pose: { skeleton: skeleton.id, root: null, joints: [] },
      chain: {
        upper: "leftUpperArm",
        lower: "leftLowerArm",
        effector: "leftHand",
      },
      target,
      bend,
      topology,
      jointAxes: HUMANOID_JOINT_AXES,
      restFrames: HUMANOID_REST_FRAME,
      ...(reference === undefined ? {} : { referencePose: reference }),
    });
    return new Map(
      resolvePose(pose, skeleton, HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME).map(
        (
          r: IAutoMovieResolvedBone,
        ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r],
      ),
    );
  };

  // 1. Continuity from the cost alone.
  const sweep = (): { elbows: IAutoMovieVector3[]; misses: number[] } => {
    const elbows: IAutoMovieVector3[] = [];
    const misses: number[] = [];
    for (let k: number = 0; k <= 80; k++) {
      const target: IAutoMovieVector3 = {
        x: shoulder.x - 0.2 + 0.005 * k,
        y: shoulder.y - 0.1,
        z: 0.42,
      };
      const bones = fit(target, { x: shoulder.x, y: shoulder.y - 0.02, z: 1 });
      elbows.push(bones.get("leftLowerArm")!.worldPosition);
      misses.push(
        Vector3.length(
          Vector3.subtract(bones.get("leftHand")!.worldPosition, target),
        ),
      );
    }
    return { elbows, misses };
  };
  const first = sweep();
  let jump: number = 0;
  let at: number = 0;
  for (let k: number = 1; k < first.elbows.length; k++) {
    const step: number = Vector3.length(
      Vector3.subtract(first.elbows[k]!, first.elbows[k - 1]!),
    );
    if (step > jump) {
      jump = step;
      at = k;
    }
  }
  TestValidator.predicate(
    `the elbow moves continuously (largest step ${(jump * 1000).toFixed(2)} mm at frame ${at})`,
    jump <= 0.025,
  );
  TestValidator.predicate(
    `the wrist lands every frame (worst ${(Math.max(...first.misses) * 1000).toFixed(3)} mm)`,
    Math.max(...first.misses) <= 0.001,
  );
  TestValidator.predicate(
    "bit-identical sweep",
    JSON.stringify(first) === JSON.stringify(sweep()),
  );

  // 2. A reference breaks an exact tie.
  const below: IAutoMovieVector3 = {
    x: shoulder.x,
    y: shoulder.y - 0.45,
    z: 0,
  };
  const down: IAutoMovieVector3 = { x: shoulder.x, y: shoulder.y - 1, z: 0 };
  const reference = (
    side: number,
  ): { pose: IAutoMoviePose; elbow: IAutoMovieVector3 } => {
    const pose: IAutoMoviePose = fitChainToTarget({
      skeleton,
      pose: { skeleton: skeleton.id, root: null, joints: [] },
      chain: {
        upper: "leftUpperArm",
        lower: "leftLowerArm",
        effector: "leftHand",
      },
      target: below,
      bend: { x: shoulder.x + side, y: below.y, z: -1 },
      topology,
      jointAxes: HUMANOID_JOINT_AXES,
      restFrames: HUMANOID_REST_FRAME,
    });
    const elbow: IAutoMovieVector3 = resolvePose(
      pose,
      skeleton,
      HUMANOID_JOINT_AXES,
      HUMANOID_REST_FRAME,
    ).find(
      (r: IAutoMovieResolvedBone): boolean => r.bone === "leftLowerArm",
    )!.worldPosition;
    return { pose, elbow };
  };
  const outward = reference(1);
  const inward = reference(-1);
  TestValidator.predicate(
    "the references are distinct",
    Vector3.length(Vector3.subtract(outward.elbow, inward.elbow)) >= 0.05,
  );
  const toOut: IAutoMovieVector3 = fit(below, down, outward.pose).get(
    "leftLowerArm",
  )!.worldPosition;
  const toIn: IAutoMovieVector3 = fit(below, down, inward.pose).get(
    "leftLowerArm",
  )!.worldPosition;
  const near = (
    p: IAutoMovieVector3,
    mine: IAutoMovieVector3,
    other: IAutoMovieVector3,
  ): boolean =>
    Vector3.length(Vector3.subtract(p, mine)) <
    Vector3.length(Vector3.subtract(p, other));
  TestValidator.predicate(
    "the outward reference pulls the elbow outward",
    near(toOut, outward.elbow, inward.elbow),
  );
  TestValidator.predicate(
    "the inward reference pulls the elbow inward",
    near(toIn, inward.elbow, outward.elbow),
  );
}

/** A trunk with a T-posed left arm. */
function arm(): IAutoMovieSkeleton {
  const bone = (
    name: AutoMovieHumanoidBone,
    parent: AutoMovieHumanoidBone | null,
    x: number,
    y: number,
  ): IAutoMovieBone => ({
    bone: name,
    parent,
    rest: {
      translation: { x, y, z: 0 },
      rotation: Quaternion.identity(),
      scale: { x: 1, y: 1, z: 1 },
    },
    constraint: null,
  });
  return {
    id: "arm",
    bones: [
      bone("hips", null, 0, 1),
      bone("spine", "hips", 0, 0.15),
      bone("chest", "spine", 0, 0.2),
      bone("leftUpperArm", "chest", 0.18, 0.15),
      bone("leftLowerArm", "leftUpperArm", 0.3, 0),
      bone("leftHand", "leftLowerArm", 0.25, 0),
    ],
  };
}
