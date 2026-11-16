import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Quaternion,
  Transform,
  jointToQuaternion,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import {
  type IHumanBody,
  createHumanBody,
  poseBones,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";
import { vclose } from "../internal/vclose";

/**
 * Sharing a body's topology preserves its complete per-pose public FK.
 *
 * Scenarios:
 * 1. Average and small canonical polygon Humans resolve null and translated,
 *    rotated roots with mixed clinical coordinates, null axes and sparse joints.
 *    Bone count, parent-first record order and every local/world component
 *    equal the public resolvePose path that receives no topology argument.
 * 2. Finite duplicate joints retain the last value, and a finite undeclared
 *    optional joint does not enter the resolved body. Changing an elbow then
 *    requires a fresh FK result rather than reusing a previous pose's records.
 * 3. Deleting/replacing returned Map entries and poisoning an owned returned
 *    record cannot contaminate the next call for the unchanged body and pose.
 * 4. A copy of the actual canonical skeleton declares different wrist axes.
 *    Public createHumanBody prepares that copy with the same physical profile;
 *    actual declared axes override the host table without changing the source.
 * 5. Earlier nonfinite duplicate records throw before a later valid duplicate,
 *    and two invalid records preserve first-failure order and error class.
 *    Malformed root coordinates retain the original ungated NaN propagation;
 *    this equivalence test introduces no root-admission guarantee.
 *
 * Finite component comparisons use nclose/vclose with epsilon zero. Quaternion
 * unit checks retain the existing qclose rounding bound. The oracle is actual
 * public no-topology FK, not a baked output or a new kinematics implementation.
 * Output equivalence does not prove reduced work or speed; no counter replaces
 * an engine function, and wrong/stale topology is outside this body's contract.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States all five scenarios, actual Human fixtures, coordinate checks, malformed-input semantics and unobserved work-count limits.
 * @evidence contracts/development/testing.md#behavioral-verification Calls poseBones and public no-topology resolvePose, compares all ordered records and checks changed-pose and returned-Map ownership through their actual outputs.
 * @evidence contracts/development/testing.md#independent-expectations The unchanged public FK supplies component-exact expected records, explicit last-only input supplies duplicate semantics, and declared-axis quaternion composition supplies the precedence control. No producer bookkeeping or physical tolerance is substituted.
 * @evidence contracts/development/testing.md#distinguishing-cases Two real statures, null/rigid roots, sparse/mixed/duplicate/stray joints, changed poses, mutable returned data, a separately prepared real rig copy, invalid-record order and ungated malformed-root propagation.
 * @evidence contracts/development/testing.md#execution-ownership One portable CPU entry uses actual canonical bodies and immutable source copies with explicit public calls; it starts no host and patches no global or foreign method. It certifies semantics, not topology-build counts or wall-clock performance.
 */
export function test_human_motion_core_pose_bones_topology(): void {
  const failures: string[] = [];
  const check: (label: string, condition: boolean) => void = (
    label: string,
    condition: boolean,
  ): void => {
    if (!condition) failures.push(label);
  };
  const scenario: (label: string, task: () => void) => void = (
    label: string,
    task: () => void,
  ): void => {
    try {
      task();
    } catch (error) {
      failures.push(`${label}: ${String(error)}`);
    }
  };
  const sameQuaternion: (
    actual: IAutoMovieQuaternion,
    expected: IAutoMovieQuaternion,
  ) => boolean = (
    actual: IAutoMovieQuaternion,
    expected: IAutoMovieQuaternion,
  ): boolean =>
    nclose(actual.x, expected.x, 0) &&
    nclose(actual.y, expected.y, 0) &&
    nclose(actual.z, expected.z, 0) &&
    nclose(actual.w, expected.w, 0);
  const direct: (
    body: IHumanBody,
    pose: IAutoMoviePose,
  ) => IAutoMovieResolvedBone[] = (
    body: IHumanBody,
    pose: IAutoMoviePose,
  ): IAutoMovieResolvedBone[] =>
    resolvePose(pose, body.skeleton, HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME);
  const compare: (
    label: string,
    body: IHumanBody,
    pose: IAutoMoviePose,
  ) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
    label: string,
    body: IHumanBody,
    pose: IAutoMoviePose,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
    const expected: IAutoMovieResolvedBone[] = direct(body, pose);
    const map: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      pose,
    );
    const actual: IAutoMovieResolvedBone[] = [...map.values()];
    const keys: AutoMovieHumanoidBone[] = [...map.keys()];
    check(
      `${label}: complete actual body`,
      expected.length === body.skeleton.bones.length,
    );
    check(`${label}: same bone count`, actual.length === expected.length);
    expected.forEach((wanted: IAutoMovieResolvedBone, index: number): void => {
      const shown: IAutoMovieResolvedBone | undefined = actual[index];
      check(`${label}: ordered bone ${index}`, shown?.bone === wanted.bone);
      check(`${label}: ordered Map key ${index}`, keys[index] === wanted.bone);
      if (shown === undefined) return;
      check(
        `${label}: ${wanted.bone} exact world position`,
        vclose(shown.worldPosition, wanted.worldPosition, 0),
      );
      for (const field of ["localRotation", "worldRotation"] as const) {
        check(
          `${label}: ${wanted.bone} exact ${field}`,
          sameQuaternion(shown[field], wanted[field]),
        );
        check(
          `${label}: ${wanted.bone} finite unit ${field}`,
          qclose(shown[field], shown[field]) &&
            qclose(wanted[field], wanted[field]) &&
            [
              shown[field].x,
              shown[field].y,
              shown[field].z,
              shown[field].w,
            ].every((value: number): boolean => Number.isFinite(value)),
        );
      }
    });
    return map;
  };

  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const mixed: IAutoMovieJointPose[] = [
      { bone: "spine", flexion: 8, abduction: -3, twist: 4 },
      { bone: "chest", flexion: -7, abduction: 0, twist: 0 },
      { bone: "leftUpperArm", flexion: 35, abduction: 12, twist: 15 },
      { bone: "leftLowerArm", flexion: 43, abduction: null, twist: 0 },
      { bone: "leftHand", flexion: 13, abduction: -4, twist: 0 },
      { bone: "rightUpperLeg", flexion: 17, abduction: 9, twist: -6 },
      { bone: "rightLowerLeg", flexion: 28, abduction: null, twist: null },
      { bone: "leftIndexProximal", flexion: 31, abduction: 4, twist: null },
    ];
    const roots: readonly IAutoMoviePose["root"][] = [
      null,
      Transform.of(
        { x: 0.7, y: 0.3, z: -0.4 },
        Quaternion.fromEuler({ order: "YXZ", x: 11, y: 37, z: -9 }),
      ),
    ];
    const sparse: IAutoMoviePose = {
      skeleton: body.skeleton.id,
      root: null,
      joints: [],
    };
    scenario(`${name} sparse rest`, (): void => {
      compare(`${name} sparse rest`, body, sparse);
    });
    for (const [index, root] of roots.entries())
      scenario(`${name} root ${index}`, (): void => {
        compare(`${name} root ${index}`, body, {
          ...sparse,
          root,
          joints: mixed,
        });
      });

    const pose: IAutoMoviePose = { ...sparse, joints: mixed };
    scenario(`${name} duplicate and stray`, (): void => {
      const stray: AutoMovieHumanoidBone | undefined = (
        ["upperChest", "leftEye", "rightEye", "jaw"] as const
      ).find(
        (candidate: AutoMovieHumanoidBone): boolean =>
          !body.skeleton.bones.some(
            (bone: IAutoMovieBone): boolean => bone.bone === candidate,
          ),
      );
      if (stray === undefined)
        throw new Error("Canonical fixture has no absent optional slot");
      const last: IAutoMovieJointPose = {
        bone: "leftLowerArm",
        flexion: 77,
        abduction: null,
        twist: 0,
      };
      const duplicate: IAutoMoviePose = {
        ...pose,
        joints: [
          ...mixed,
          { bone: stray, flexion: 23, abduction: -8, twist: 11 },
          last,
        ],
      };
      const actual: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        compare(`${name} duplicate and stray`, body, duplicate);
      const unique: IAutoMovieResolvedBone[] = direct(body, {
        ...pose,
        joints: [
          ...mixed.filter(
            (joint: IAutoMovieJointPose): boolean => joint.bone !== last.bone,
          ),
          last,
        ],
      });
      check(`${name}: finite stray is absent`, !actual.has(stray));
      check(
        `${name}: last duplicate owns the hand`,
        vclose(
          actual.get("leftHand")!.worldPosition,
          unique.find(
            (bone: IAutoMovieResolvedBone): boolean => bone.bone === "leftHand",
          )!.worldPosition,
          0,
        ),
      );
      const previous: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        compare(`${name} previous pose`, body, pose);
      check(
        `${name}: a changed elbow needs changed FK`,
        !vclose(
          previous.get("leftHand")!.worldPosition,
          actual.get("leftHand")!.worldPosition,
          0,
        ),
      );
    });

    scenario(`${name} returned ownership`, (): void => {
      const owned: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(body, pose);
      const poisoned: IAutoMovieResolvedBone = owned.get("leftHand")!;
      poisoned.worldPosition.x = NaN;
      poisoned.worldRotation.w = NaN;
      owned.delete("hips");
      owned.set("leftHand", owned.get("rightHand")!);
      const fresh: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = compare(
        `${name} fresh after returned mutation`,
        body,
        pose,
      );
      check(
        `${name}: returned Map is independent`,
        fresh !== owned && fresh.has("hips"),
      );
      check(
        `${name}: caller-owned record is not repaired in place`,
        Number.isNaN(poisoned.worldPosition.x) &&
          Number.isNaN(poisoned.worldRotation.w),
      );
    });

    scenario(`${name} authored error order`, (): void => {
      const invalid: readonly IAutoMovieJointPose[] = [
        { bone: "leftLowerArm", flexion: NaN, abduction: 0, twist: 0 },
        { bone: "rightUpperArm", flexion: 0, abduction: Infinity, twist: 0 },
      ];
      for (const [index, records] of [
        invalid,
        [...invalid].reverse(),
      ].entries()) {
        const malformed: IAutoMoviePose = {
          ...pose,
          joints: [...records, ...mixed],
        };
        let expectedError: unknown;
        let actualError: unknown;
        try {
          direct(body, malformed);
        } catch (error) {
          expectedError = error;
        }
        try {
          poseBones(body, malformed);
        } catch (error) {
          actualError = error;
        }
        const axis: string = index === 0 ? "flexion" : "abduction";
        check(
          `${name}: earlier invalid duplicate keeps ${axis} error order`,
          expectedError instanceof Error &&
            actualError instanceof Error &&
            expectedError.constructor === actualError.constructor &&
            expectedError.message === actualError.message &&
            actualError.message.includes(axis),
        );
      }
    });

    scenario(`${name} ungated malformed root`, (): void => {
      const malformed: IAutoMoviePose = {
        ...sparse,
        root: {
          translation: { x: NaN, y: 0, z: 0 },
          rotation: Quaternion.identity(),
          scale: { x: 1, y: 1, z: 1 },
        },
      };
      const expected: IAutoMovieResolvedBone[] = direct(body, malformed);
      const actual: IAutoMovieResolvedBone[] = [
        ...poseBones(body, malformed).values(),
      ];
      check(
        `${name}: malformed root does not change population`,
        actual.length === expected.length,
      );
      expected.forEach(
        (wanted: IAutoMovieResolvedBone, index: number): void => {
          const shown: IAutoMovieResolvedBone | undefined = actual[index];
          check(
            `${name}: existing malformed-root propagation at ${wanted.bone}`,
            shown !== undefined &&
              shown.bone === wanted.bone &&
              Number.isNaN(wanted.worldPosition.x) &&
              Number.isNaN(shown.worldPosition.x) &&
              nclose(shown.worldPosition.y, wanted.worldPosition.y, 0) &&
              nclose(shown.worldPosition.z, wanted.worldPosition.z, 0) &&
              sameQuaternion(shown.localRotation, wanted.localRotation) &&
              sameQuaternion(shown.worldRotation, wanted.worldRotation),
          );
        },
      );
    });
  }

  scenario("actual canonical axes override", (): void => {
    const source: IHumanBody = motionHumanBody("m-average");
    const host: IAutoMovieJointAxes | undefined = HUMANOID_JOINT_AXES.leftHand;
    if (host === undefined) throw new Error("Canonical wrist has no host axes");
    const declared: IAutoMovieJointAxes = {
      flexion: host.abduction,
      abduction: host.twist,
      twist: host.flexion,
      twistPlacement: host.twistPlacement,
    };
    const skeleton: IAutoMovieSkeleton = {
      ...source.skeleton,
      bones: source.skeleton.bones.map(
        (bone: IAutoMovieBone): IAutoMovieBone =>
          bone.bone === "leftHand" ? { ...bone, axes: declared } : bone,
      ),
    };
    const body: IHumanBody = createHumanBody(skeleton, source.profile);
    const joint: IAutoMovieJointPose = {
      bone: "leftHand",
      flexion: 17,
      abduction: 0,
      twist: 0,
    };
    const pose: IAutoMoviePose = {
      skeleton: skeleton.id,
      root: Transform.of(
        { x: -0.3, y: 0.2, z: 0.8 },
        Quaternion.fromEuler({ order: "YXZ", x: -7, y: 31, z: 12 }),
      ),
      joints: [joint],
    };
    const actual: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = compare(
      "declared actual-body axes",
      body,
      pose,
    );
    const wrist: IAutoMovieBone | undefined = skeleton.bones.find(
      (bone: IAutoMovieBone): boolean => bone.bone === joint.bone,
    );
    if (wrist === undefined) throw new Error("Canonical wrist is missing");
    const expected: IAutoMovieQuaternion = Quaternion.multiply(
      wrist.rest.rotation,
      jointToQuaternion(joint, declared, HUMANOID_REST_FRAME.leftHand),
    );
    const ignored: IAutoMovieQuaternion = Quaternion.multiply(
      wrist.rest.rotation,
      jointToQuaternion(joint, host, HUMANOID_REST_FRAME.leftHand),
    );
    check(
      "declared axes control is physically distinct",
      !qclose(expected, ignored),
    );
    check(
      "bone axes override the host in actual FK",
      sameQuaternion(actual.get("leftHand")!.localRotation, expected),
    );
    compare("original body remains its own rig", source, {
      ...pose,
      skeleton: source.skeleton.id,
    });
  });
  TestValidator.predicate(
    `poseBones topology: ${failures.join("\n")}`,
    (): boolean => failures.length === 0,
  );
}
