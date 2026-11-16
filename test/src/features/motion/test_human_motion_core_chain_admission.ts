import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  type IFitChainToTargetProps,
  Quaternion,
  fitHingedRotationError,
  fitSeededChainToTarget,
  jointToQuaternion,
  orientChainEffector,
  prepareChainPlant,
  splitDistalTwist,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  type IHumanBody,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A prepared chain preserves authored FK admission before last-record-wins
 * lookup, even when a degenerate target skips the ordinary inverse solve.
 *
 * Scenarios:
 * 1. On a canonical polygon Human, an earlier NaN upper-arm record or
 *    infinite lower-arm record followed by a valid duplicate is refused.
 * 2. Two invalid authored coordinates are refused in their input order by
 *    prepared fit, standalone orientation and distal twist splitting.
 * 3. An owned reader supplies actual public FK. Repeated reachable fits
 *    share that authored read once, while an unrotated degenerate fit never
 *    asks for it. No counter replaces an engine method or global.
 * 4. The candidate's reported rotation residual agrees with the actual
 *    oriented Human hand's full FK, including a later duplicate hand record.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States invalid-record order, the last-record lookup distinction and owned-reader scope.
 * @evidence contracts/development/testing.md#behavioral-verification Passes malformed authored records through the public prepared/orientation/split APIs and observes the named failed coordinate, then counts a supplied reader that really resolves the canonical body.
 * @evidence contracts/development/testing.md#independent-expectations NaN/Infinity are invalid clinical angles irrespective of a later duplicate; the first authored invalid record owns the failure. The supplied reader's count is an observed callback effect and its returned map is actual poseBones FK.
 * @evidence contracts/development/testing.md#distinguishing-cases Upper/lower invalid duplicates, reversed invalid-record order, degenerate/ordinary targets, standalone consumers and one prepared reader's repeated queries.
 * @evidence contracts/development/testing.md#execution-ownership Uses one existing polygon Human, immutable source pose copies and owned callbacks in memory; no foreign methods, globals or runtime are replaced.
 */
export function test_human_motion_core_chain_admission(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const posed: IAutoMoviePose = resolveHumanPosture(
    body,
    stand.posture(body, { x: 0, y: 0, z: 0 }, 0),
  );
  const actual: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    posed,
  );
  const shoulder: IAutoMovieVector3 = actual.get("leftUpperArm")!.worldPosition;
  const hand: IAutoMovieVector3 = actual.get("leftHand")!.worldPosition;
  const base: Omit<IFitChainToTargetProps, "target"> = {
    skeleton: body.skeleton,
    topology: body.topology,
    pose: posed,
    chain: {
      upper: "leftUpperArm",
      lower: "leftLowerArm",
      effector: "leftHand",
    },
    jointAxes: HUMANOID_JOINT_AXES,
    restFrames: HUMANOID_REST_FRAME,
    effectorRotation: actual.get("leftHand")!.worldRotation,
  };
  const invalid: readonly (readonly [string, IAutoMovieJointPose])[] = [
    [
      "abduction",
      { bone: "leftUpperArm", flexion: 0, abduction: NaN, twist: 0 },
    ],
    [
      "flexion",
      { bone: "leftLowerArm", flexion: Infinity, abduction: 0, twist: 0 },
    ],
  ];
  const complaints: string[] = [];
  for (const turn of [0.01, 17, 73, 141]) {
    const wanted: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.fromAxisAngle({ x: 1, y: 2, z: 3 }, turn),
      actual.get("leftHand")!.worldRotation,
    );
    const held: IAutoMovieJointPose = posed.joints.find(
      (joint: IAutoMovieJointPose): boolean => joint.bone === "leftHand",
    ) ?? { bone: "leftHand", flexion: 0, abduction: 0, twist: 0 };
    const source: IFitChainToTargetProps = {
      ...base,
      target: hand,
      effectorRotation: wanted,
      pose: {
        ...posed,
        joints: [...posed.joints, { ...held, flexion: 5 }, held],
      },
    };
    const plant: ReturnType<typeof prepareChainPlant> =
      prepareChainPlant(source);
    if (plant === null) {
      complaints.push("the actual Human arm could not be prepared");
      continue;
    }
    const local: (bone: AutoMovieHumanoidBone) => IAutoMovieQuaternion = (
      bone: AutoMovieHumanoidBone,
    ): IAutoMovieQuaternion => {
      const joint: IAutoMovieJointPose = source.pose.joints.find(
        (entry: IAutoMovieJointPose): boolean => entry.bone === bone,
      ) ?? { bone, flexion: null, abduction: null, twist: null };
      const basis: IAutoMovieJointAxes | undefined =
        body.skeleton.bones.find(
          (entry: IAutoMovieBone): boolean => entry.bone === bone,
        )?.axes ?? HUMANOID_JOINT_AXES[bone];
      return jointToQuaternion(joint, basis, HUMANOID_REST_FRAME[bone]);
    };
    const reported: number = fitHingedRotationError(
      source,
      plant,
      HUMANOID_JOINT_AXES.leftLowerArm!,
      wanted,
    )(local("leftUpperArm"), local("leftLowerArm"));
    const displayed: IAutoMoviePose = orientChainEffector(
      source,
      source.pose,
      plant,
    );
    const shown: IAutoMovieQuaternion = poseBones(body, displayed).get(
      "leftHand",
    )!.worldRotation;
    const residual: number = Quaternion.angle(shown, wanted);
    if (
      !Number.isFinite(reported) ||
      reported < 0 ||
      !(
        Math.abs(
          Math.cos((reported * Math.PI) / 360) - Math.cos(residual / 2),
        ) <= 1e-12
      )
    )
      complaints.push(
        `candidate/display residual at ${turn} deg: score ${reported} deg, actual ${(residual * 180) / Math.PI} deg`,
      );
  }
  const refuses: (label: string, axis: string, task: () => unknown) => void = (
    label: string,
    axis: string,
    task: () => unknown,
  ): void => {
    let caught: unknown;
    try {
      task();
    } catch (error) {
      caught = error;
    }
    if (!(caught instanceof Error && caught.message.includes(axis)))
      complaints.push(
        `${label}: expected first invalid ${axis}, got ${String(caught)}`,
      );
  };
  for (const [axis, bad] of invalid) {
    const duplicate: IAutoMovieJointPose = posed.joints.find(
      (joint: IAutoMovieJointPose): boolean => joint.bone === bad.bone,
    ) ?? { bone: bad.bone, flexion: 0, abduction: 0, twist: 0 };
    const source: Omit<IFitChainToTargetProps, "target"> = {
      ...base,
      pose: { ...posed, joints: [bad, ...posed.joints, duplicate] },
    };
    refuses(`degenerate ${bad.bone} duplicate`, axis, (): unknown =>
      fitSeededChainToTarget.prepare(source).fit(shoulder),
    );
  }
  for (const order of [invalid, [...invalid].reverse()]) {
    const source: Omit<IFitChainToTargetProps, "target"> = {
      ...base,
      pose: {
        ...posed,
        joints: [
          ...order.map(
            (
              row: readonly [string, IAutoMovieJointPose],
            ): IAutoMovieJointPose => row[1],
          ),
          ...posed.joints,
        ],
      },
    };
    const axis: string = order[0]![0];
    refuses(`prepared order ${axis}`, axis, (): unknown =>
      fitSeededChainToTarget.prepare(source).fit(hand),
    );
    refuses(`orient order ${axis}`, axis, (): unknown =>
      orientChainEffector({ ...source, target: hand }, source.pose),
    );
    refuses(`split order ${axis}`, axis, (): unknown =>
      splitDistalTwist(
        { ...source, target: hand },
        HUMANOID_JOINT_AXES,
        source.pose,
        actual.get("leftHand")!.worldRotation,
      ),
    );
  }
  let reads: number = 0;
  const read: () => ReadonlyMap<
    AutoMovieHumanoidBone,
    IAutoMovieResolvedBone
  > = (): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
    reads++;
    return poseBones(body, posed);
  };
  const prepared: fitSeededChainToTarget.IWorkspace =
    fitSeededChainToTarget.prepare(base, read);
  prepared.fit(hand);
  prepared.fit(hand);
  if (reads !== 1)
    complaints.push(`repeated real authored FK: ${reads}, expected one`);
  reads = 0;
  const degenerate: fitSeededChainToTarget.IWorkspace =
    fitSeededChainToTarget.prepare(
      { ...base, effectorRotation: undefined },
      read,
    );
  degenerate.fit(shoulder);
  if (reads !== 0)
    complaints.push(`unrotated degenerate fit read authored FK ${reads} times`);
  TestValidator.equals(
    "chain reuse preserves authored admission",
    complaints,
    [],
  );
}
