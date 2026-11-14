import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  fitChainToTarget,
  resolvePose,
  swingTwist,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A hand turned a little from where it is turns the forearm a little: the
 * limb fit moves to the forearm only the twist the wrist cannot take beyond
 * the current pose (#3521), and reaches a rotation the two can make together
 * exactly.
 *
 * On the average man and the small woman, the right arm is fitted to a point
 * ahead of and below its shoulder, the hand at its fitted rotation. Each
 * request then turns that hand rotation by 12 degrees, either way, about the
 * forearm's own axis, about the two directions across it, and about a
 * diagonal of the three.
 *
 * Scenarios:
 * 1. About the forearm's axis, the forearm's twist changes by the request's
 *    own twist about that axis, within 1e-3 degree (the clamp to the
 *    forearm's range reads its angles back through the rig's frame).
 * 2. Every request moves the forearm's twist by no more than the request's
 *    whole angle (within 1e-3 degree, as scenario 1), so a small turn never
 *    sends the forearm across its range
 *    (#3521 measured a 14 degree request taking it from -29 to its +90 end).
 * 3. Every request inside the wrist's and the forearm's ranges is shown
 *    within 1e-3 degree of the asked hand rotation.
 *
 * A turn across the forearm still moves it a little, the twist the wrist's
 * flexion-then-deviation convention leaves when it swings about a tilted
 * axis; scenario 2 bounds that by the request's angle rather than by its twist.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public limb fit on real bodies and reads the fitted joints and the displayed hand by forward kinematics; a whole-twist split, a forearm flipped across its range or a hand left off a reachable rotation fails.
 * @evidence contracts/development/testing.md#independent-expectations The request's own twist is read by the engine's swing-twist decomposition about the forearm's world axis; a rotation of an angle changes no twist by more than that angle; reach is the geodesic angle.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, four axes, both signs: a pure twist, two swings and a mixed turn.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and fits in memory, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the setup, the 3 scenarios, what each pins and why a swing still moves the forearm.
 */
export function test_motion_split_distal_twist(): void {
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body = motionHumanBody(name);
    const chain = {
      upper: "rightUpperArm",
      lower: "rightLowerArm",
      effector: "rightHand",
    } as const;
    const world = (
      pose: IAutoMoviePose,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      new Map(
        resolvePose(
          pose,
          body.skeleton,
          HUMANOID_JOINT_AXES,
          HUMANOID_REST_FRAME,
        ).map((r: IAutoMovieResolvedBone) => [r.bone, r]),
      );
    const rest: IAutoMoviePose = {
      skeleton: body.skeleton.id,
      root: null,
      joints: [],
    };
    const target: IAutoMovieVector3 = Vector3.add(
      world(rest).get("rightUpperArm")!.worldPosition,
      { x: -0.1, y: -0.15, z: 0.35 },
    );
    const fit = (
      pose: IAutoMoviePose,
      rotation?: IAutoMovieQuaternion,
    ): IAutoMoviePose =>
      fitChainToTarget({
        skeleton: body.skeleton,
        pose,
        chain,
        target,
        ...(rotation === undefined ? {} : { effectorRotation: rotation }),
        topology: body.topology,
        jointAxes: HUMANOID_JOINT_AXES,
        restFrames: HUMANOID_REST_FRAME,
      });
    const twistOf = (pose: IAutoMoviePose): number =>
      pose.joints.find(
        (j: IAutoMovieJointPose): boolean => j.bone === chain.lower,
      )?.twist ?? 0;
    const before: IAutoMoviePose = fit({
      ...rest,
      joints: [{ bone: "rightHand", flexion: -20, abduction: -10, twist: 0 }],
    });
    const at: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      world(before);
    const hand: IAutoMovieQuaternion = at.get(chain.effector)!.worldRotation;
    const axis: IAutoMovieVector3 = Vector3.normalize(
      Quaternion.rotateVector(
        at.get(chain.lower)!.worldRotation,
        HUMANOID_JOINT_AXES.rightLowerArm!.twist,
      ),
    );
    const across: IAutoMovieVector3 = Vector3.normalize(
      Vector3.cross(axis, { x: 0, y: 1, z: 0 }),
    );
    const up: IAutoMovieVector3 = Vector3.cross(across, axis);
    const axes: readonly (readonly [string, IAutoMovieVector3])[] = [
      ["along", axis],
      ["across", across],
      ["up", up],
      [
        "diagonal",
        Vector3.normalize(Vector3.add(Vector3.add(axis, across), up)),
      ],
    ];
    for (const [label, about] of axes)
      for (const degrees of [-12, 12]) {
        const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
          about,
          degrees,
        );
        const asked: IAutoMovieQuaternion = Quaternion.normalize(
          Quaternion.multiply(turn, hand),
        );
        const after: IAutoMoviePose = fit(before, asked);
        const moved: number = Math.abs(twistOf(after) - twistOf(before));
        const own: number =
          (2 *
            Math.acos(Math.min(1, Math.abs(swingTwist(turn, axis).twist.w))) *
            180) /
          Math.PI;
        const missed: number =
          (Quaternion.angle(
            Quaternion.normalize(
              world(after).get(chain.effector)!.worldRotation,
            ),
            asked,
          ) *
            180) /
          Math.PI;
        const cell: string = `${name} ${label} ${degrees}`;
        if (label === "along" && Math.abs(moved - own) > 1e-3)
          complaints.push(
            `${cell}: the forearm's twist moved ${moved.toFixed(6)} degrees for a request whose own twist is ${own.toFixed(6)}`,
          );
        if (moved > Math.abs(degrees) + 1e-3)
          complaints.push(
            `${cell}: the forearm's twist moved ${moved.toFixed(3)} degrees for a ${Math.abs(degrees)} degree request`,
          );
        if (missed > 1e-3)
          complaints.push(
            `${cell}: the hand is shown ${missed.toFixed(4)} degrees off a rotation the forearm and the wrist reach together`,
          );
      }
  }
  TestValidator.equals(
    "a small turn of the hand moves only the forearm's residual twist",
    complaints,
    [],
  );
}
