import {
  DEFAULT_JOINT_AXES,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  type IAutoMovieSeededChainFit,
  type IAutoMovieSkeletonTopology,
  type IFitChainToTargetProps,
  Quaternion,
  ROM_TOLERANCE,
  Vector3,
  fitSeededChainToTarget,
  indexSkeletonTopology,
  prepareSkeletonPoseResolution,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { motionFitArms } from "../internal/motionFitArms";
import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";
import { throwsError } from "../internal/throwsError";
import { vclose } from "../internal/vclose";

/**
 * Several ordinary fits of one prepared chain preserve the one-shot
 * fit's branch, clinical pose, reported strain and callback evaluations,
 * while the prepared rotation reader agrees with full skeleton FK.
 * Explicit curve continuation separately retains full source admission and
 * physical endpoint/rotation behavior; it does not promise the cold score's
 * same global winner.
 *
 * Scenarios:
 * 1. Cold, explicit reference, near-seeded and caller-strain modes fit two
 *    neighbouring reachable targets in A/B/A order. Actual FK pins the hand
 *    within 1 mm and retains the fixture's 0.3 m and 0.25 m bones and unrelated
 *    authored joint; fresh one-shot fits agree within numerical roundoff.
 * 2. A far target ends on the analytically known straight-arm shell; a
 *    degenerate target and a missing chain retain the source pose and no seed.
 * 3. A rotated root and rest, a fixed intermediate joint, a bone-declared
 *    axis override, a nonzero clinical neutral, duplicate hand records and
 *    absent hand articulation retain the full FK rotation. This is an FK
 *    equivalence check, not a reach claim for a noncanonical limb rig.
 * 4. Explicit continuation admits every original source joint with no rig,
 *    a genuine fixed rig and an owned structural copy. Raw/foreign readers
 *    still run the supplied actual full-FK callback. A non-chain NaN joint
 *    cannot hide behind a reachable near candidate or empty native FK demand.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists four scenarios, physical dimensions, solver modes, actual original-source admission and the artificial descendant-chain case's limitation.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises ordinary prepared/one-shot fits, actual resolved FK and an owned obstruction callback; stale target reuse, changed ordinary branch/value, skipped callback work or incorrect chain rotation fail. Explicit continuation additionally verifies source admission and actual endpoint/rotation through raw, native and structural rig inputs without asserting cold global-score equivalence.
 * @evidence contracts/development/testing.md#independent-expectations The physical targets, 1 mm contact bound, fixed 0.3/0.25 m segment lengths and straight-arm shell are independent geometric expectations. Full resolvePose is the oracle for chain-frame reuse; one-shot equivalence is a metamorphic purity check and is not an independent oracle of the solver's global optimality. Numerical equality uses 1e-9 metres/degrees and 1e-12 quaternion-dot rounding bounds without relaxing physical contact.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers cold/reference/near/strain, repeated target order, descendant intermediates and mapping precedence, duplicate/absent articulation, unreachable/degenerate geometry, missing bones and unread degenerate references. Explicit continuation contrasts raw, genuine native and structural-copy rig admission with a valid source and an invalid non-chain coordinate; required raw/foreign callback work is observed before any later rotation read. Full Human contact, mirroring, on/clear/rests and composed playback remain in existing integration tests.
 * @evidence contracts/development/testing.md#execution-ownership A portable in-memory engine unit with owned rig data and callback counters, discovered by its exported test function; no process, renderer, viewer or GPU is started.
 */
export function test_motion_fit_chain_workspace(): void {
  const failures: string[] = [];

  /** Collect every violated invariant before reporting this round's result. */
  const check: (label: string, valid: boolean) => void = (
    label: string,
    valid: boolean,
  ): void => {
    if (!valid) failures.push(label);
  };
  const skeleton: IAutoMovieSkeleton = motionFitArms.arms();
  const topology: IAutoMovieSkeletonTopology = indexSkeletonTopology(skeleton);
  const unrelated: IAutoMovieJointPose = {
    bone: "rightUpperArm",
    flexion: 11,
    abduction: 90,
    twist: 0,
  };
  const pose: IAutoMoviePose = {
    skeleton: skeleton.id,
    root: null,
    joints: [unrelated],
  };
  const first: IAutoMovieVector3 = { x: 0.18, y: 1.2, z: 0.45 };
  const second: IAutoMovieVector3 = { x: 0.181, y: 1.2005, z: 0.449 };
  const base: Omit<IFitChainToTargetProps, "target"> = {
    skeleton,
    topology,
    pose,
    chain: {
      upper: "leftUpperArm",
      lower: "leftLowerArm",
      effector: "leftHand",
    },
    bend: { x: 0.35, y: 1.25, z: 0.1 },
    jointAxes: HUMANOID_JOINT_AXES,
    restFrames: HUMANOID_REST_FRAME,
    effectorRotation: motionFitArms.hand(
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 1, z: 0 },
    ),
  };
  const anchor: IAutoMovieSeededChainFit = fitSeededChainToTarget({
    ...base,
    target: first,
  });
  const modes: {
    name: string;
    source: Omit<IFitChainToTargetProps, "target">;
  }[] = [
    { name: "cold", source: base },
    {
      name: "reference",
      source: { ...base, referencePose: anchor.pose, referenceWeight: 0.7 },
    },
    {
      name: "strain",
      source: {
        ...base,
        strain: (
          upper: IAutoMovieQuaternion,
          lower: IAutoMovieQuaternion,
          world: IAutoMovieQuaternion,
        ): number => upper.x * upper.x + lower.y * lower.y + world.z * world.z,
      },
    },
  ];
  check(
    "reachable hinged anchor supplies a continuation seed",
    anchor.seed !== null,
  );
  if (anchor.seed !== null)
    modes.push({
      name: "near",
      source: { ...base, near: { ...anchor.seed, tolerance: ROM_TOLERANCE } },
    });
  if (anchor.seed !== null) {
    const fixed: prepareSkeletonPoseResolution.IRig = prepareSkeletonPoseResolution(
      skeleton, HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME,
    );
    const rigs: readonly (prepareSkeletonPoseResolution.IRig | undefined)[] = [undefined, fixed, { ...fixed }];
    for (const [index, rig] of rigs.entries()) {
      let authoredReads: number = 0;
      const workspace: fitSeededChainToTarget.IWorkspace = fitSeededChainToTarget.prepare(base,
        (): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
          authoredReads++;
          return motionFitArms.fk(skeleton, pose);
        }, undefined, rig,
      );
      const fitted: IAutoMovieSeededChainFit = workspace.continued(first,
        { ...anchor.seed, tolerance: ROM_TOLERANCE },
      );
      const admissionReads: number = authoredReads;
      const end: IAutoMovieResolvedBone = motionFitArms.fk(skeleton, fitted.pose).get("leftHand")!;
      check(`continued source mode${index}: actual endpoint and full-FK rotation`,
        Vector3.length(Vector3.subtract(end.worldPosition, first)) <= 0.001 &&
        qclose(workspace.rotation(fitted.pose), end.worldRotation, 1e-12),
      );
      check(`continued source mode${index}: raw/foreign authored callback cannot be bypassed`,
        rig === fixed || admissionReads > 0,
      );
      const invalid: IAutoMoviePose = { ...pose, joints: [{ ...unrelated, flexion: NaN }] };
      check(`continued source mode${index}: invalid non-chain source cannot be skipped`,
        throwsError((): IAutoMovieSeededChainFit => fitSeededChainToTarget.prepare(
          { ...base, pose: invalid }, (): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
            motionFitArms.fk(skeleton, invalid), undefined, rig,
        ).continued(first, { ...anchor.seed!, tolerance: ROM_TOLERANCE }), "finite"),
      );
    }
  }

  // Callback evaluations are effects even when their scores are identical.
  // Sharing invariant rig data must not memoize a target's candidate work.
  for (const mode of modes) {
    let sharedCalls: number = 0;
    let freshCalls: number = 0;
    const shared: fitSeededChainToTarget.IWorkspace =
      fitSeededChainToTarget.prepare({
        ...mode.source,
        obstruction: (): number => {
          sharedCalls++;
          return 0;
        },
      });
    for (const target of [first, second, first]) {
      sharedCalls = 0;
      freshCalls = 0;
      const fitted: IAutoMovieSeededChainFit = shared.fit(target);
      const fresh: IAutoMovieSeededChainFit = fitSeededChainToTarget({
        ...mode.source,
        target,
        obstruction: (): number => {
          freshCalls++;
          return 0;
        },
      });
      check(
        `${mode.name}: each target evaluates its candidate callbacks`,
        sharedCalls > 0 && sharedCalls === freshCalls,
      );
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        motionFitArms.fk(skeleton, fitted.pose);
      const upper: IAutoMovieResolvedBone = bones.get("leftUpperArm")!;
      const lower: IAutoMovieResolvedBone = bones.get("leftLowerArm")!;
      const end: IAutoMovieResolvedBone = bones.get("leftHand")!;
      check(
        `${mode.name}: actual FK pins the hand`,
        Vector3.length(Vector3.subtract(end.worldPosition, target)) <= 0.001,
      );
      check(
        `${mode.name}: upper length`,
        nclose(
          Vector3.length(
            Vector3.subtract(lower.worldPosition, upper.worldPosition),
          ),
          0.3,
          1e-9,
        ),
      );
      check(
        `${mode.name}: lower length`,
        nclose(
          Vector3.length(
            Vector3.subtract(end.worldPosition, lower.worldPosition),
          ),
          0.25,
          1e-9,
        ),
      );
      check(
        `${mode.name}: unrelated authored record and root survive`,
        fitted.pose.joints.includes(unrelated) &&
          fitted.pose.root === pose.root,
      );
      check(
        `${mode.name}: joint population agrees`,
        fitted.pose.joints.length === fresh.pose.joints.length,
      );
      for (let index: number = 0; index < fitted.pose.joints.length; index++) {
        const actual: IAutoMovieJointPose = fitted.pose.joints[index]!;
        const expected: IAutoMovieJointPose | undefined =
          fresh.pose.joints[index];
        check(
          `${mode.name}: joint order ${index}`,
          expected !== undefined && actual.bone === expected.bone,
        );
        if (expected === undefined) continue;
        for (const axis of ["flexion", "abduction", "twist"] as const)
          check(
            `${mode.name}: ${actual.bone} ${axis}`,
            actual[axis] === null || expected[axis] === null
              ? actual[axis] === expected[axis]
              : nclose(actual[axis], expected[axis], 1e-9),
          );
      }
      check(
        `${mode.name}: seed presence agrees`,
        (fitted.seed === null) === (fresh.seed === null),
      );
      if (fitted.seed !== null && fresh.seed !== null) {
        check(
          `${mode.name}: branch agrees`,
          fitted.seed.branch === fresh.seed.branch,
        );
        check(
          `${mode.name}: swivel agrees`,
          nclose(fitted.seed.swivel, fresh.seed.swivel, 1e-9),
        );
      }
      check(
        `${mode.name}: value presence agrees`,
        (fitted.value === undefined) === (fresh.value === undefined),
      );
      if (fitted.value !== undefined && fresh.value !== undefined)
        for (const key of ["overshoot", "error", "strain"] as const)
          check(
            `${mode.name}: reported ${key} agrees`,
            nclose(fitted.value[key], fresh.value[key], 1e-9),
          );
      const callsBeforeReading: number = sharedCalls;
      check(
        `${mode.name}: prepared rotation equals full FK`,
        qclose(shared.rotation(fitted.pose), end.worldRotation, 1e-12),
      );
      check(
        `${mode.name}: rotation read does not solve again`,
        sharedCalls === callsBeforeReading,
      );
    }
  }
  check(
    "input articulation is not mutated",
    nclose(unrelated.flexion!, 11, 1e-9),
  );

  // The 0.55 m straight arm is the nearest shell point to a collinear target.
  const far: IAutoMovieSeededChainFit = fitSeededChainToTarget
    .prepare(base)
    .fit({ x: 2, y: 1.5, z: 0 });
  check(
    "unreachable target keeps the actual reachable shell",
    vclose(
      motionFitArms.fk(skeleton, far.pose).get("leftHand")!.worldPosition,
      { x: 0.73, y: 1.5, z: 0 },
      0.001,
    ),
  );
  const degenerate: fitSeededChainToTarget.IWorkspace =
    fitSeededChainToTarget.prepare({
      skeleton,
      topology,
      pose,
      chain: base.chain,
      jointAxes: HUMANOID_JOINT_AXES,
      restFrames: HUMANOID_REST_FRAME,
      referencePose: {
        ...pose,
        joints: [
          { bone: "leftUpperArm", flexion: NaN, abduction: null, twist: null },
        ],
      },
    });
  const unmoved: IAutoMovieSeededChainFit = degenerate.fit(
    motionFitArms.fk(skeleton, pose).get("leftUpperArm")!.worldPosition,
  );
  check(
    "degenerate target leaves reference unread and retains source identity",
    unmoved.pose === pose && unmoved.seed === null,
  );
  const absent: IAutoMovieSeededChainFit = fitSeededChainToTarget
    .prepare({
      skeleton,
      topology,
      pose,
      chain: {
        upper: "leftUpperLeg",
        lower: "leftLowerLeg",
        effector: "leftFoot",
      },
    })
    .fit(first);
  check(
    "missing chain retains source identity",
    absent.pose === pose && absent.seed === null,
  );

  // A fixed descendant transform must participate in the actual displayed
  // rotation, even when it is not the effector's direct rest transform.
  const intermediate: IAutoMovieBone = {
    bone: "leftIndexProximal",
    parent: "leftLowerArm",
    rest: {
      translation: { x: 0, y: 0, z: 0 },
      rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 23),
      scale: { x: 1, y: 1, z: 1 },
    },
    constraint: null,
  };
  const descendant: IAutoMovieSkeleton = {
    id: "descendant-arm",
    bones: [
      ...skeleton.bones.map(
        (bone: IAutoMovieBone): IAutoMovieBone =>
          bone.bone === "leftHand"
            ? {
                ...bone,
                parent: intermediate.bone,
                axes: DEFAULT_JOINT_AXES,
                rest: {
                  ...bone.rest,
                  rotation: Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 17),
                },
              }
            : bone,
      ),
      intermediate,
    ],
  };
  for (const held of [true, false]) {
    const authored: IAutoMoviePose = {
      skeleton: descendant.id,
      root: {
        translation: { x: 0.3, y: 0.2, z: -0.1 },
        rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 31),
        scale: { x: 1, y: 1, z: 1 },
      },
      joints: [
        { bone: "leftUpperArm", flexion: 32, abduction: 67, twist: -13 },
        { bone: "leftLowerArm", flexion: 48, abduction: null, twist: 22 },
        { bone: intermediate.bone, flexion: 12, abduction: null, twist: null },
        ...(held
          ? [
              { bone: "leftHand" as const, flexion: 5, abduction: 0, twist: 0 },
              {
                bone: "leftHand" as const,
                flexion: -11,
                abduction: 7,
                twist: 3,
              },
            ]
          : []),
      ],
    };
    const source: Omit<IFitChainToTargetProps, "target"> = {
      skeleton: descendant,
      topology: indexSkeletonTopology(descendant),
      pose: authored,
      chain: base.chain,
      jointAxes: HUMANOID_JOINT_AXES,
      restFrames: {
        ...HUMANOID_REST_FRAME,
        leftHand: {
          flexion: { sign: -1, neutral: 9 },
          abduction: { sign: 1, neutral: -4 },
          twist: { sign: -1, neutral: 2 },
        },
      },
    };
    const resolved: IAutoMovieResolvedBone[] = resolvePose(
      authored,
      descendant,
      source.jointAxes,
      source.restFrames,
      source.topology,
    );
    const target: IAutoMovieVector3 = resolved.find(
      (bone: IAutoMovieResolvedBone): boolean => bone.bone === "leftHand",
    )!.worldPosition;
    const workspace: fitSeededChainToTarget.IWorkspace =
      fitSeededChainToTarget.prepare(source);
    const fitted: IAutoMovieSeededChainFit = workspace.fit(target);
    const actual: IAutoMovieResolvedBone = resolvePose(
      fitted.pose,
      descendant,
      source.jointAxes,
      source.restFrames,
      source.topology,
    ).find(
      (bone: IAutoMovieResolvedBone): boolean => bone.bone === "leftHand",
    )!;
    check(
      `descendant ${held ? "last authored" : "absent"} end: actual rotation`,
      qclose(workspace.rotation(fitted.pose), actual.worldRotation, 1e-12),
    );
    check(
      "descendant fit retains the same root",
      fitted.pose.root === authored.root,
    );
    check(
      "descendant fit retains the fixed intermediate joint",
      fitted.pose.joints.includes(authored.joints[2]!),
    );
  }
  TestValidator.predicate(
    failures.join("\n"),
    (): boolean => failures.length === 0,
  );
}
