import {
  Quaternion,
  curlChainUntilContact as curl,
  prepareSkeletonPoseResolution,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieCurlChainUntilContact,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint } from "../internal/joint";
import { nclose } from "../internal/nclose";

/**
 * Prepared contact closure keeps the original sparse source and each chain's
 * actual first trial, with unchanged physical contact and bisection precision.
 * This is a two-finger planar kernel rig, without an anatomical Human claim.
 *
 * Scenarios:
 * 1. Two unit phalanx capsules of radius0.05m close toward radius0.1m
 *    spheres whose local centres relative to their own hinges are(0.8,0.6)
 *    and(0.6,0.8). Their first contacts are beta-asin(0.15), where beta is
 *    the sphere-centre direction. Both contacts precede the90-degree ROM.
 * 2. Empty clinical input and an initially authored future middle-finger
 *    joint retain their original global map insertion order. Absent future
 *    joints are not manufactured by the first prepared chain. The same
 *    angles/contact survive raw/prepared FK and rigid root rotation37.
 * 3. An issued generated joint edit cannot poison a new closure. A current
 *    unrelated NaN head still refuses even though no requested finger is
 *    below it; the curl's existing last-record unique-map semantics remain.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines kernel metre geometry, radii, explicit positive-Z flexion, sparse/future-joint order, rigid covariance, generated-output ownership and three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Runs public curl with and without its genuine prepared rig, reads generated angles/order and full ordinary FK, and independently computes segment-to-sphere contact. Sparse inputs, a preexisting future joint, changed root, earlier result edits and an unrelated invalid row expose premature source capture, missing required edits or admission, stale outputs and false contact answers.
 * @evidence contracts/development/testing.md#independent-expectations Each centre is exactly1m from its hinge. At first contact the perpendicular distance to the unit segment is the combined0.15m radius and its projection sqrt(1-0.15²) lies strictly inside the segment, so alpha=atan2(cy,cx)-asin(0.15). The original one-degree bracket bisected30 times bounds angle by2^-30 degrees and spatial error by pi/(180*2^30)m; a doubled angular bound and128 machine-epsilon arithmetic allowance cover finite operations without changing the search or any physical bound. Full-FK segment projection supplies the contact oracle independently of the curl's own reported gap.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers two different required chain contacts, empty versus already authored future joint, original insertion order, raw/prepared execution, identity versus nonidentity translated root, generated joint mutation, actual ROM and physical gap, and required unrelated clinical admission. Existing curl units own multi-phalanx proximal-first freezing, boxes/capsules and radius/step refusals.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable engine unit owns finite kernel rig/poses/colliders and generated outputs. It calls public closure/preparation/FK and mathematical APIs, creates no imitation Human body, replaces no foreign function/global, and starts no renderer, host or compiler.
 */
export function test_kinematics_prepared_curl_contacts(): void {
  const axes: IAutoMovieJointAxes = { flexion: { x: 0, y: 0, z: 1 },
    abduction: { x: 1, y: 0, z: 0 }, twist: { x: 0, y: 1, z: 0 } };
  const names: readonly AutoMovieHumanoidBone[] = ["leftIndexProximal", "leftMiddleProximal"];
  const skeleton: IAutoMovieSkeleton = { id: "two-curl-kernel", bones: [
    bone("leftHand", null, 0, axes), bone(names[0]!, "leftHand", -2, axes),
    bone(names[1]!, "leftHand", 2, axes), bone("head", "leftHand", 0, axes),
  ] };
  const rig: ReturnType<typeof prepareSkeletonPoseResolution> = prepareSkeletonPoseResolution(skeleton);
  const chains: readonly IAutoMovieCurlChainUntilContact.IChain[] = names.map((name: AutoMovieHumanoidBone): IAutoMovieCurlChainUntilContact.IChain =>
    ({ bones: [name], tip: { x: 1, y: 0, z: 0 }, radius: 0.05 }));
  const centres: readonly IAutoMovieVector3[] = [{ x: -1.2, y: 0.6, z: 0 }, { x: 2.6, y: 0.8, z: 0 }];
  const angles: readonly number[] = [Math.atan2(0.6, 0.8), Math.atan2(0.8, 0.6)].map(
    (beta: number): number => (beta - Math.asin(0.15)) * 180 / Math.PI);
  for (const heading of [0, 37]) {
    const rotation: ReturnType<typeof Quaternion.fromAxisAngle> = Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, heading);
    const translation: IAutoMovieVector3 = { x: 1, y: 2, z: 3 };
    const colliders: readonly IAutoMovieCurlChainUntilContact.ICollider[] = centres.map((centre: IAutoMovieVector3, index: number): IAutoMovieCurlChainUntilContact.ICollider => ({
      frame: { position: translation, rotation },
      shape: { id: `sphere${index}`, material: "kernel", kind: "sphere", radius: 0.1,
        transform: { position: centre, rotation: Quaternion.identity() } },
    }));
    for (const future of [false, true]) {
      const pose: IAutoMoviePose = { skeleton: skeleton.id,
        root: { translation: { ...translation }, rotation: { ...rotation }, scale: { x: 1, y: 1, z: 1 } },
        joints: future ? [joint(names[1]!, { flexion: 7 })] : [] };
      const order: AutoMovieHumanoidBone[] = future ? [names[1]!, names[0]!] : [...names];
      for (const prepared of [false, true]) {
        const input: IAutoMovieCurlChainUntilContact.IInput = { skeleton, pose, chains, colliders, ...(prepared ? { resolution: rig } : {}) };
        const result: IAutoMovieCurlChainUntilContact.IResult = curl(input);
        verify(skeleton, result, names, angles, colliders);
        TestValidator.equals("closure retains authored map order and appends only encountered absent joints",
          result.pose.joints.map((value: IAutoMovieJointPose): AutoMovieHumanoidBone => value.bone), order);
        result.pose.joints.find((value: IAutoMovieJointPose): boolean => value.bone === names[0])!.flexion = 123;
        verify(skeleton, curl(input), names, angles, colliders);
        TestValidator.predicate("generated closure edits cannot change the supplied sparse source",
          pose.joints.length === (future ? 1 : 0) && (!future || Object.is(pose.joints[0]!.flexion, 7)));
      }
    }
  }
}

/** Explicit metre rest position and a positive-Z flexion hinge bounded at90 degrees. */
function bone(name: AutoMovieHumanoidBone, parent: AutoMovieHumanoidBone | null,
  x: number, axes: IAutoMovieJointAxes): IAutoMovieBone {
  return { bone: name, parent, axes,
    rest: { translation: { x, y: 0, z: 0 }, rotation: Quaternion.identity(), scale: { x: 1, y: 1, z: 1 } },
    constraint: { flexion: { min: 0, max: 90 }, abduction: null, twist: null } };
}

/** Compare displayed capsule geometry with the independently solved first sphere contacts. */
function verify(skeleton: IAutoMovieSkeleton, result: IAutoMovieCurlChainUntilContact.IResult,
  names: readonly AutoMovieHumanoidBone[], angles: readonly number[], colliders: readonly IAutoMovieCurlChainUntilContact.ICollider[]): void {
  const frames: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(resolvePose(result.pose, skeleton).map(
    (value: IAutoMovieResolvedBone): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [value.bone, value]));
  names.forEach((name: AutoMovieHumanoidBone, index: number): void => {
    const report: IAutoMovieCurlChainUntilContact.IChainResult = result.chains[index]!;
    const angle: number = report.flexion[0]!;
    const frame: IAutoMovieResolvedBone = frames.get(name)!;
    const direction: IAutoMovieVector3 = Quaternion.rotateVector(frame.worldRotation, { x: 1, y: 0, z: 0 });
    const collider: IAutoMovieCurlChainUntilContact.ICollider = colliders[index]!;
    const relative: IAutoMovieVector3 = Quaternion.rotateVector(collider.frame.rotation, collider.shape.transform.position);
    const x: number = collider.frame.position.x + relative.x - frame.worldPosition.x;
    const y: number = collider.frame.position.y + relative.y - frame.worldPosition.y;
    const z: number = collider.frame.position.z + relative.z - frame.worldPosition.z;
    const projection: number = (x * direction.x + y * direction.y + z * direction.z) /
      (direction.x ** 2 + direction.y ** 2 + direction.z ** 2);
    const gap: number = Math.hypot(x - projection * direction.x, y - projection * direction.y,
      z - projection * direction.z) - 0.15;
    const rounding: number = 128 * Number.EPSILON;
    TestValidator.predicate(`actual first contact index${index} retains its physical angle and positive-side gap`,
      angle >= 0 && angle <= 90 && nclose(angle, angles[index]!, 2 ** -29) && projection > 0 && projection < 1 &&
      gap >= -rounding && gap <= Math.PI / (180 * 2 ** 30) + rounding && nclose(report.gap, gap, 1e-12) &&
      nclose(result.pose.joints.find((value: IAutoMovieJointPose): boolean => value.bone === name)!.flexion!, angle, 0));
  });
}
