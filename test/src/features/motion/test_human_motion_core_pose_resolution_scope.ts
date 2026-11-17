import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  type IAutoMovieRestFrame,
  Quaternion,
  Transform,
  indexSkeletonTopology,
  preparePoseResolution,
  prepareSkeletonPoseResolution,
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
  IAutoMovieTransform,
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
 * An operation-owned FK reader observes current values and owns no public pose.
 *
 * A real canonical Human's skeleton/profile are copied before editing. Bone
 * names and parents stay fixed, so its topology remains the same rooted tree.
 * Custom frames are copied; poseBones retains the canonical frame contract.
 *
 * Scenarios:
 * 1. One reader follows A-to-B-to-A edits of joint, root, ancestor, rest,
 *    axes and clinical frames. Prepared resolvePose and poseBones match
 *    ordered no-topology, unprepared FK on their respective actual frames.
 *    A body's rig is a value read when the body is made
 *    (`IHumanBody.poseResolution`): an edit of the skeleton's own records, a
 *    rest transform or declared axes, is read by `poseBones` through a body
 *    made from the edited skeleton, to the same exact cold FK, and the body
 *    made before the edit keeps the frames of the rig it was made with.
 * 2. A warmed axes record rejects a newly zero axis. Earlier invalid duplicate
 *    joints and an invalid frame fail like cold FK and permit later recovery.
 * 3. Missing articulations use identity, and finite stray joints stay absent
 *    from the output while still receiving ordinary authored-record admission.
 * 4. Mutating a returned record, quaternion, position or Map cannot poison later
 *    reads, including a different real body followed by the original body.
 * 5. A separate rigid-motion oracle uses yaw90: (x, y, z) becomes (z, y, -x),
 *    with the corresponding translation, independently of FK composition.
 *
 * Cold comparisons use exact finite components and the existing unit-quaternion
 * bound. The independent rigid relation uses existing vclose rounding bounds.
 * Cold and prepared FK share quaternion/composition owners, so equality alone
 * does not prove their general mathematics or a work-count/speed improvement.
 * Rest edits exercise only FK dependencies, not body-measure recalibration;
 * altered parent/name topology and reuse beyond this operation are not tested.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents real copied fixtures, scalar dependency edits, unchanged topology, canonical/custom frame distinction, admission/recovery, output ownership and the limits of cold equivalence and performance claims.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public preparePoseResolution, optional sixth resolvePose argument and optional third poseBones argument, compares all ordered output records, then observes actual mutation, error recovery and ownership through later public calls.
 * @evidence contracts/development/testing.md#independent-expectations Unprepared no-topology FK supplies exact current-value records for equivalence without prepared metadata. An independent Cartesian quarter-turn plus translation checks physical root behavior; invalid ordered records must match cold error class/message. No prepared-reader bookkeeping or stored output snapshots supply the expectation.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts changed and restored values on the same records, valid-to-zero axes and recovery, earlier invalid duplicates, missing identities, finite stray admission, custom/canonical frames, poisoned public nested records/Map and another canonical stature before returning to the original rig.
 * @evidence contracts/development/testing.md#execution-ownership The portable synchronous test_human_motion_core_pose_resolution_scope entry owns every case and its collected failures, uses real canonical bodies without altering shared fixtures, starts no host and replaces no foreign method or global.
 */
export function test_human_motion_core_pose_resolution_scope(): void {
  const failures: string[] = [];
  function check(label: string, condition: boolean): void {
    if (!condition) failures.push(label);
  }
  function scenario(label: string, task: () => void): void {
    try {
      task();
    } catch (error) {
      failures.push(`${label}: ${String(error)}`);
    }
  }
  function sameQuaternion(
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
  ): boolean {
    return (
      nclose(a.x, b.x, 0) &&
      nclose(a.y, b.y, 0) &&
      nclose(a.z, b.z, 0) &&
      nclose(a.w, b.w, 0)
    );
  }
  function compare(
    label: string,
    actual: readonly IAutoMovieResolvedBone[],
    expected: readonly IAutoMovieResolvedBone[],
  ): void {
    check(`${label} count`, actual.length === expected.length);
    expected.forEach((wanted: IAutoMovieResolvedBone, index: number): void => {
      const shown: IAutoMovieResolvedBone | undefined = actual[index];
      check(`${label} bone ${index}`, shown?.bone === wanted.bone);
      if (shown === undefined) return;
      check(
        `${label} ${wanted.bone} position`,
        vclose(shown.worldPosition, wanted.worldPosition, 0),
      );
      for (const field of ["localRotation", "worldRotation"] as const) {
        check(
          `${label} ${wanted.bone} ${field}`,
          sameQuaternion(shown[field], wanted[field]),
        );
        check(
          `${label} ${wanted.bone} unit ${field}`,
          qclose(shown[field], shown[field]) &&
            qclose(wanted[field], wanted[field]),
        );
      }
    });
  }

  const source: IHumanBody = motionHumanBody("m-average");
  const skeleton: IAutoMovieSkeleton = structuredClone(source.skeleton);
  const body: IHumanBody = createHumanBody(
    skeleton,
    structuredClone(source.profile),
  );
  const wrist: IAutoMovieBone = skeleton.bones.find(
    (bone: IAutoMovieBone): boolean => bone.bone === "leftHand",
  )!;
  const declared: IAutoMovieJointAxes | undefined =
    wrist.axes ?? HUMANOID_JOINT_AXES.leftHand;
  if (declared === undefined) throw new Error("Canonical wrist has no axes");
  const axes: IAutoMovieJointAxes = structuredClone(declared);
  wrist.axes = axes;
  const frames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>> =
    structuredClone(HUMANOID_REST_FRAME);
  const frame: IAutoMovieRestFrame = frames.leftHand!;
  const prepared: ReturnType<typeof preparePoseResolution> =
    preparePoseResolution();
  const joint: IAutoMovieJointPose = {
    bone: "leftHand",
    flexion: 13,
    abduction: -4,
    twist: 9,
  };
  const ancestor: IAutoMovieJointPose = {
    bone: "spine",
    flexion: 8,
    abduction: -3,
    twist: 4,
  };
  const root: IAutoMovieTransform = Transform.of(
    { x: 0.2, y: 0.3, z: -0.4 },
    Quaternion.identity(),
  );
  const pose: IAutoMoviePose = {
    skeleton: skeleton.id,
    root,
    joints: [ancestor, joint],
  };
  function cold(
    target: IHumanBody,
    input: IAutoMoviePose,
    canonical: boolean = false,
  ): IAutoMovieResolvedBone[] {
    return resolvePose(
      input,
      target.skeleton,
      HUMANOID_JOINT_AXES,
      canonical ? HUMANOID_REST_FRAME : frames,
    );
  }
  function read(
    label: string,
    input: IAutoMoviePose = pose,
    target: IHumanBody = body,
  ): IAutoMovieResolvedBone[] {
    const expected: IAutoMovieResolvedBone[] = cold(target, input);
    const actual: IAutoMovieResolvedBone[] = resolvePose(
      input,
      target.skeleton,
      HUMANOID_JOINT_AXES,
      frames,
      target.topology,
      prepared,
    );
    compare(`${label} prepared`, actual, expected);
    const map: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      target,
      input,
      prepared,
    );
    const canonical: IAutoMovieResolvedBone[] = cold(target, input, true);
    compare(`${label} consumer`, [...map.values()], canonical);
    check(
      `${label} all actual bones`,
      expected.length === target.skeleton.bones.length,
    );
    check(
      `${label} ordered Map keys`,
      [...map.keys()].every(
        (name: AutoMovieHumanoidBone, index: number): boolean =>
          name === canonical[index]?.bone,
      ),
    );
    return actual;
  }
  function hand(
    bones: readonly IAutoMovieResolvedBone[],
  ): IAutoMovieResolvedBone {
    return bones.find(
      (bone: IAutoMovieResolvedBone): boolean => bone.bone === "leftHand",
    )!;
  }

  // The body with its rig read from the skeleton as it stands now, as a
  // body made from that skeleton holds it (`createHumanBody` prepares the
  // rig with these tables). Only forward kinematics is asked of it, so the
  // measures and colliders of the body made before are not read again: an
  // edited rest is not a recalibrated body.
  function rerigged(): IHumanBody {
    const copy: IAutoMovieSkeleton = structuredClone(skeleton);
    const topology: IHumanBody["topology"] = indexSkeletonTopology(copy);
    return {
      ...body,
      skeleton: copy,
      topology,
      poseResolution: prepareSkeletonPoseResolution(
        copy,
        HUMANOID_JOINT_AXES,
        HUMANOID_REST_FRAME,
        topology,
      ),
    };
  }
  function roundtrip(
    label: string,
    change: () => void,
    restore: () => void,
    rig: boolean = false,
  ): void {
    const before: IAutoMovieResolvedBone[] = read(`${label} A`);

    // A body's rig is a value, read once when the body is made: an edit of
    // the skeleton's own records (a rest transform, declared axes) is read
    // by a body made from the edited skeleton, and the body made before
    // keeps the rig it was made with.
    const kept: IAutoMovieResolvedBone[] | undefined = rig
      ? [...poseBones(body, pose, prepared).values()]
      : undefined;
    change();
    try {
      const changed: IAutoMovieResolvedBone[] = read(
        `${label} B`,
        pose,
        rig ? rerigged() : body,
      );
      if (kept !== undefined)
        compare(
          `${label} B earlier body keeps its rig`,
          [...poseBones(body, pose, prepared).values()],
          kept,
        );
      check(
        `${label} physically changes the wrist`,
        !sameQuaternion(
          hand(before).worldRotation,
          hand(changed).worldRotation,
        ) ||
          !vclose(hand(before).worldPosition, hand(changed).worldPosition, 0),
      );
    } finally {
      restore();
    }
    compare(`${label} restored A`, read(`${label} restored`), before);
  }

  scenario("joint and ancestor current values", (): void => {
    roundtrip(
      "joint",
      (): void => {
        joint.flexion = 31;
      },
      (): void => {
        joint.flexion = 13;
      },
    );
    roundtrip(
      "ancestor",
      (): void => {
        ancestor.flexion = 19;
      },
      (): void => {
        ancestor.flexion = 8;
      },
    );
  });
  scenario("root rigid motion", (): void => {
    const before: IAutoMovieResolvedBone[] = read("root A");
    root.translation.x = 0.7;
    root.translation.y = -0.2;
    root.translation.z = 0.6;
    root.rotation.y = Math.SQRT1_2;
    root.rotation.w = Math.SQRT1_2;
    try {
      const changed: IAutoMovieResolvedBone[] = read("root B");
      before.forEach((old: IAutoMovieResolvedBone, index: number): void => {
        // Removing the old translation leaves root-relative coordinates.
        check(
          `yaw90 physical position ${old.bone}`,
          vclose(changed[index]!.worldPosition, {
            x: 0.7 + old.worldPosition.z + 0.4,
            y: -0.2 + old.worldPosition.y - 0.3,
            z: 0.6 - old.worldPosition.x + 0.2,
          }),
        );
      });
    } finally {
      root.translation.x = 0.2;
      root.translation.y = 0.3;
      root.translation.z = -0.4;
      root.rotation.y = 0;
      root.rotation.w = 1;
    }
    compare("root restored A", read("root restored"), before);
  });
  scenario("rest transform current values", (): void => {
    const rest: IAutoMovieTransform = structuredClone(wrist.rest);
    roundtrip(
      "rest",
      (): void => {
        wrist.rest.translation.x += 0.011;
        Object.assign(
          wrist.rest.rotation,
          Quaternion.multiply(
            rest.rotation,
            Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 10),
          ),
        );
      },
      (): void => {
        Object.assign(wrist.rest.translation, rest.translation);
        Object.assign(wrist.rest.rotation, rest.rotation);
      },
      true,
    );
  });
  scenario("axes and frame current values", (): void => {
    const initial: IAutoMovieJointAxes = structuredClone(axes);
    roundtrip(
      "axes",
      (): void => {
        // An exact signed permutation rotates the entire orthonormal basis.
        for (const axis of ["flexion", "abduction", "twist"] as const)
          Object.assign(axes[axis], {
            x: -initial[axis].y,
            y: initial[axis].x,
            z: initial[axis].z,
          });
      },
      (): void => {
        for (const axis of ["flexion", "abduction", "twist"] as const)
          Object.assign(axes[axis], initial[axis]);
      },
      true,
    );
    const sign: 1 | -1 = frame.flexion!.sign;
    const neutral: number = frame.flexion!.neutral;
    roundtrip(
      "frame",
      (): void => {
        frame.flexion!.sign = sign === 1 ? -1 : 1;
        frame.flexion!.neutral = neutral + 9;
      },
      (): void => {
        frame.flexion!.sign = sign;
        frame.flexion!.neutral = neutral;
      },
    );
  });

  function errorOf(task: () => unknown): unknown {
    try {
      task();
    } catch (error) {
      return error;
    }
    return undefined;
  }
  function rejected(
    label: string,
    input: IAutoMoviePose,
    needle: string,
    consumer: boolean = true,
    rig: boolean = false,
  ): void {
    const expected: unknown = errorOf((): IAutoMovieResolvedBone[] =>
      cold(body, input),
    );
    const actual: unknown = errorOf((): IAutoMovieResolvedBone[] =>
      resolvePose(
        input,
        skeleton,
        HUMANOID_JOINT_AXES,
        frames,
        body.topology,
        prepared,
      ),
    );
    const errors: unknown[] = [actual];
    if (consumer)
      errors.push(
        errorOf(
          // An edit of the rig is refused through a body whose rig is read
          // from the edited skeleton; a pose's own fault through the body.
          (): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
            poseBones(rig ? rerigged() : body, input, prepared),
        ),
      );
    for (const error of errors)
      check(
        label,
        expected instanceof Error &&
          error instanceof Error &&
          expected.constructor === error.constructor &&
          expected.message === error.message &&
          error.message.includes(needle),
      );
  }
  scenario("current admission and recovery", (): void => {
    read("warm valid admission");
    const flexion: IAutoMovieJointAxes["flexion"] = { ...axes.flexion };
    Object.assign(axes.flexion, { x: 0, y: 0, z: 0 });
    try {
      rejected("edited axes rejected", pose, "axes.flexion", true, true);
    } finally {
      Object.assign(axes.flexion, flexion);
    }
    read("valid after edited axes failure");
    const neutral: number = frame.flexion!.neutral;
    frame.flexion!.neutral = Number.NaN;
    try {
      rejected("edited frame rejected", pose, "neutral", false);
    } finally {
      frame.flexion!.neutral = neutral;
    }
    read("valid after edited frame failure");
    const earlier: IAutoMovieJointPose = { ...joint, flexion: Number.NaN };
    rejected(
      "earlier invalid duplicate",
      {
        ...pose,
        joints: [earlier, ancestor, joint],
      },
      "flexion",
    );
    earlier.flexion = -7;
    read("valid after earlier duplicate failure", {
      ...pose,
      joints: [earlier, ancestor, joint],
    });
  });
  scenario("missing identity and finite stray", (): void => {
    const absent: AutoMovieHumanoidBone | undefined = (
      ["upperChest", "leftEye", "rightEye", "jaw"] as const
    ).find(
      (name: AutoMovieHumanoidBone): boolean =>
        !skeleton.bones.some(
          (bone: IAutoMovieBone): boolean => bone.bone === name,
        ),
    );
    if (absent === undefined)
      throw new Error("No absent canonical optional bone");
    const empty: IAutoMoviePose = { ...pose, joints: [] };
    const rest: IAutoMovieResolvedBone = hand(read("missing joints", empty));
    check(
      "missing articulation is rest",
      sameQuaternion(rest.localRotation, wrist.rest.rotation),
    );
    const stray: IAutoMovieJointPose = {
      bone: absent,
      flexion: 23,
      abduction: -8,
      twist: 11,
    };
    const finite: IAutoMoviePose = {
      ...pose,
      joints: [ancestor, joint, stray],
    };
    const result: IAutoMovieResolvedBone[] = read("finite stray", finite);
    check(
      "stray remains absent",
      !result.some(
        (bone: IAutoMovieResolvedBone): boolean => bone.bone === absent,
      ),
    );
    stray.flexion = Number.NaN;
    rejected("stray is still admitted", finite, "flexion");
    stray.flexion = 23;
    read("recovered finite stray", finite);
  });
  scenario("public ownership and another actual body", (): void => {
    const owned: IAutoMovieResolvedBone[] = read("owned source");
    const map: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      pose,
      prepared,
    );
    const old: IAutoMovieResolvedBone = hand(owned);
    const mapped: IAutoMovieResolvedBone = map.get("leftHand")!;
    check(
      "separate public records and nested transforms",
      old !== mapped &&
        old.localRotation !== mapped.localRotation &&
        old.worldRotation !== mapped.worldRotation &&
        old.worldPosition !== mapped.worldPosition,
    );
    old.bone = "rightHand";
    old.localRotation.x = Number.NaN;
    old.worldRotation.w = Number.NaN;
    old.worldPosition.z = Number.NaN;
    mapped.localRotation.y = Number.NaN;
    map.delete("hips");
    map.set("leftHand", map.get("rightHand")!);
    read("fresh after output poisoning");
    const fresh: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      pose,
      prepared,
    );
    check("fresh independent Map", fresh !== map && fresh.has("hips"));
    check(
      "old output not repaired",
      old.bone === "rightHand" &&
        Number.isNaN(old.localRotation.x) &&
        Number.isNaN(old.worldPosition.z),
    );
    const other: IHumanBody = motionHumanBody("f-small");
    read("other actual body", { ...pose, skeleton: other.skeleton.id }, other);
    read("original rig after other body");
  });
  TestValidator.predicate(
    `pose resolution scope: ${failures.join("; ")}`,
    failures.length === 0,
  );
}
