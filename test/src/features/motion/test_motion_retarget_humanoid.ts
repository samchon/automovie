import { HUMANOID_PROFILE } from "@automovie/archetypes";
import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  bindProfileGaits,
  gestureMotion,
  reachPose,
  resolvePose,
  retargetHumanoidMotion,
  sampleMotion,
  travelMotion,
} from "@automovie/engine";
import {
  IAutoMovieBone,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieProfileBinding,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createRetargetHumanoidBinding as bindingFor } from "../internal/createRetargetHumanoidBinding";
import { createRetargetHumanoidSourceSkeleton as sourceSkeleton } from "../internal/createRetargetHumanoidSourceSkeleton";
import { keyframe } from "../internal/fixtures";
import { malformedRetargetTarget as malformedTarget } from "../internal/malformedRetargetTarget";
import { hasViolation, nclose, vclose } from "../internal/predicates";
import { retargetHumanoidWorld as world } from "../internal/retargetHumanoidWorld";
import { retargetRootlessSkeleton as rootless } from "../internal/retargetRootlessSkeleton";
import { scaleRetargetHumanoidSkeleton as scaleSkeleton } from "../internal/scaleRetargetHumanoidSkeleton";
import { withRetargetReachElbowConstraint as withReachElbowConstraint } from "../internal/withRetargetReachElbowConstraint";

/**
 * Observe humanoid retarget characterization, proportional root/hand behavior and field-located refusal on synthetic source/target rigs. The target id says imported-avatar and its binding uses vrm prefixes, but no imported asset, viewer or rendered human is used. Existing fixture operations live in canonical leaves to keep this test below the source-file size limit after explicit typing.
 *
 * Scenarios:
 *
 * 1. A travelled humanoid walk retargets from a stickman to a twice-tall imported
 *    rig, preserving authored facing and scaling root translation by the
 *    target/source rest-height ratio.
 * 2. A clinical wave resolves on the imported rig with the returned
 *    rest-frame/axis tables, so the right hand rises instead of mirroring
 *    down.
 * 3. A reach pose retargets onto the imported rig and the target hand lands at the
 *    scaled source hand position. It carries no elbow abduction for the default
 *    humanoid ROM to reject, because the arm solve keeps the elbow on its own
 *    hinge (#1345); it used to need the target to widen that axis.
 * 4. Missing required bones and invalid explicit root scale return field-located
 *    validation failures instead of throwing.
 *
 * The original explicit-option and combined malformed-input observations remain within these scenarios. Facing is asserted as a policy label; the complete root-rotation population is not compared here.
 *
 * @evidence contracts/testing.md#behavioral-verification Retargets travelled walk, explicit-option wave, sampled wave and reach clips; checks target identities/bindings/policies, root displacement, raised-hand inequality and proportional hand position. It also observes missing bone/zero scale and combined source/target/mapping/rest-frame diagnostics without changing their original paths.
 * @evidence contracts/testing.md#independent-expectations The copied factor-two rest offsets independently require root/hand scaling by two; literal binding ids, policy strings, hand-above-shoulder margin 0.45 and diagnostic paths constrain returned results. ReachPose and FK are shared product producers/consumers rather than independent anatomical or global IK oracles. The default reach observation is deliberately only absence of one elbow-abduction violation, not whole-result admission.
 * @evidence contracts/testing.md#distinguishing-cases Retains implicit/explicit scale and id/bindings/tables, walk/wave/reach, default reach versus the original elbow override, absent required hand, zero scale, rootless/duplicate/missing-parent rigs, blank maps, malformed axes and invalid rest sign/neutral. All existing values, case order and predicate tolerances remain unchanged.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns all product calls and returned failure observations, with seven file-owned fixture operations moved without new cases. Helpers register no extra tests and start no imported-asset loader, viewer, process or native artifact.
 */
export function test_motion_retarget_humanoid(): void {
  const source: IAutoMovieSkeleton = sourceSkeleton();
  const target: IAutoMovieSkeleton = scaleSkeleton(
    source,
    "imported-avatar",
    2,
  );
  const targetBinding: IAutoMovieProfileBinding = bindingFor(target, "vrm");

  // 1. walk/travel root motion scales, facing is preserved by policy.
  const walk: IAutoMovieMotion = bindProfileGaits(
    HUMANOID_PROFILE,
    source.id,
    4,
  ).walk!;
  const travelled: IAutoMovieMotion = travelMotion("walk-forward", walk, 1, {
    x: 0,
    y: 0,
    z: 1,
  });
  const walkResult: ReturnType<typeof retargetHumanoidMotion> =
    retargetHumanoidMotion({
      motion: travelled,
      source,
      target,
      targetBinding,
    });
  TestValidator.equals("walk retarget succeeds", walkResult.validation, {
    success: true,
  });
  if (walkResult.motion === null || walkResult.characterization === null)
    throw new Error("walk retarget unexpectedly failed");

  TestValidator.equals(
    "clip targets imported skeleton",
    walkResult.motion.skeleton,
    target.id,
  );
  TestValidator.equals(
    "keyframe poses target imported skeleton",
    walkResult.motion.keyframes.every(
      (kf: IAutoMovieKeyframe): boolean => kf.pose.skeleton === target.id,
    ),
    true,
  );
  TestValidator.predicate(
    "root translation scales by target/source height",
    nclose(
      walkResult.motion.keyframes.at(-1)!.pose.root!.translation.z,
      travelled.keyframes.at(-1)!.pose.root!.translation.z * 2,
    ),
  );
  TestValidator.equals(
    "target binding is carried in the characterization",
    walkResult.characterization.target.boneMap.rightUpperArm,
    "vrm:rightUpperArm",
  );
  TestValidator.equals(
    "facing policy preserves authored root rotations",
    walkResult.characterization.facing,
    "preserve-authored",
  );
  TestValidator.equals(
    "ROM policy is target override then default humanoid",
    walkResult.characterization.romPolicy,
    "target-override-then-default-humanoid",
  );

  const namedWave: ReturnType<typeof retargetHumanoidMotion> =
    retargetHumanoidMotion({
      motion: gestureMotion("named-wave", source.id, "wave", 1)!,
      source,
      target,
      sourceBinding: bindingFor(source, "src"),
      sourceJointAxes: HUMANOID_JOINT_AXES,
      targetJointAxes: HUMANOID_JOINT_AXES,
      sourceRestFrames: HUMANOID_REST_FRAME,
      targetRestFrames: HUMANOID_REST_FRAME,
      rootScale: 2,
      id: "imported-wave",
    });
  TestValidator.equals(
    "explicit retarget options succeed",
    namedWave.validation,
    {
      success: true,
    },
  );
  if (namedWave.motion === null || namedWave.characterization === null)
    throw new Error("named wave retarget unexpectedly failed");
  TestValidator.equals(
    "explicit id is used",
    namedWave.motion.id,
    "imported-wave",
  );
  TestValidator.equals(
    "source binding is carried in the characterization",
    namedWave.characterization.source.boneMap.rightUpperArm,
    "src:rightUpperArm",
  );

  // 2. wave: clinical right-arm abduction rises on the imported rig.
  const wave: IAutoMovieMotion = gestureMotion("wave", source.id, "wave", 1)!;
  const waveResult: ReturnType<typeof retargetHumanoidMotion> =
    retargetHumanoidMotion({
      motion: wave,
      source,
      target,
      requiredBones: ["rightHand"],
    });
  TestValidator.equals("wave retarget succeeds", waveResult.validation, {
    success: true,
  });
  if (waveResult.motion === null || waveResult.characterization === null)
    throw new Error("wave retarget unexpectedly failed");

  const wavePose: IAutoMoviePose = sampleMotion(waveResult.motion, 0.4).pose;
  const raised: ReturnType<typeof resolvePose> = resolvePose(
    wavePose,
    target,
    waveResult.characterization.target.jointAxes,
    waveResult.characterization.target.restFrames,
  );
  const shoulderY: number = raised.find(
    (b: ReturnType<typeof resolvePose>[number]): boolean =>
      b.bone === "rightUpperArm",
  )!.worldPosition.y;
  const handY: number = raised.find(
    (b: ReturnType<typeof resolvePose>[number]): boolean =>
      b.bone === "rightHand",
  )!.worldPosition.y;
  TestValidator.predicate(
    "clinical wave raises the imported right hand",
    handY > shoulderY + 0.45,
  );

  // 3. reach: a proportional imported rig lands at the scaled source hand point.
  const reach: IAutoMoviePose | null = reachPose(
    source,
    "right",
    { x: -0.5, y: 1.28, z: 0.25 },
    HUMANOID_REST_FRAME,
  );
  if (reach === null) throw new Error("expected source reach pose");
  const reachMotion: IAutoMovieMotion = {
    id: "reach",
    skeleton: source.id,
    duration: 1,
    loop: false,
    keyframes: [
      keyframe(0, { skeleton: source.id, root: null, joints: [] }),
      keyframe(1, reach),
    ],
  };
  const reachDefault: ReturnType<typeof retargetHumanoidMotion> =
    retargetHumanoidMotion({
      motion: reachMotion,
      source,
      target,
      requiredBones: ["rightHand"],
    });
  // Since #1345 the source reach no longer swings the elbow off its hinge, so
  // the pose that retargets carries NO elbow abduction to reject. The contact
  // pass cannot reintroduce it either: it pins humanoid legs by default and no
  // hand contact was declared, so the arm chain is carried through the
  // characterization rather than re-solved.
  //
  // Scoped deliberately to that one axis. This scenario's oracle is the
  // proportional landing below, and asserting the whole retarget clean here
  // would pin far more than the elbow fact this line exists to state.
  TestValidator.predicate(
    "the retargeted reach carries no elbow abduction to reject",
    !hasViolation(
      reachDefault.validation,
      "rom",
      "$input.keyframes[1].pose.joints[1].abduction",
    ),
  );

  const reachTarget: IAutoMovieSkeleton = withReachElbowConstraint(target);
  const reachResult: ReturnType<typeof retargetHumanoidMotion> =
    retargetHumanoidMotion({
      motion: reachMotion,
      source,
      target: reachTarget,
      requiredBones: ["rightHand"],
    });
  TestValidator.equals("reach retarget succeeds", reachResult.validation, {
    success: true,
  });
  if (reachResult.motion === null || reachResult.characterization === null)
    throw new Error("reach retarget unexpectedly failed");

  const sourceHand: IAutoMovieVector3 = world(
    source,
    reachMotion,
    1,
    "rightHand",
  );
  const targetHand: IAutoMovieVector3 = resolvePose(
    sampleMotion(reachResult.motion, 1).pose,
    reachTarget,
    reachResult.characterization.target.jointAxes,
    reachResult.characterization.target.restFrames,
  ).find(
    (b: ReturnType<typeof resolvePose>[number]): boolean =>
      b.bone === "rightHand",
  )!.worldPosition;
  TestValidator.predicate(
    "reach lands proportionally on the imported rig",
    vclose(targetHand, {
      x: sourceHand.x * 2,
      y: sourceHand.y * 2,
      z: sourceHand.z * 2,
    }),
  );

  // 4. validation failures stay field-located.
  const noHand: IAutoMovieSkeleton = {
    ...target,
    id: "missing-hand",
    bones: target.bones.filter(
      (b: IAutoMovieBone): boolean => b.bone !== "rightHand",
    ),
  };
  const missing: ReturnType<typeof retargetHumanoidMotion> =
    retargetHumanoidMotion({
      motion: wave,
      source,
      target: noHand,
      requiredBones: ["rightHand"],
    });
  TestValidator.predicate(
    "missing required bone reports the target field",
    hasViolation(
      missing.validation,
      "type",
      '$input.target.bones["rightHand"]',
    ),
  );

  const invalidScale: ReturnType<typeof retargetHumanoidMotion> =
    retargetHumanoidMotion({
      motion: wave,
      source,
      target,
      rootScale: 0,
    });
  TestValidator.predicate(
    "invalid explicit root scale reports rootScale",
    hasViolation(invalidScale.validation, "range", "$input.rootScale"),
  );

  const srcBinding: IAutoMovieProfileBinding = bindingFor(source, "src");
  const tgtBinding: IAutoMovieProfileBinding = bindingFor(target, "bad");
  const malformed: ReturnType<typeof retargetHumanoidMotion> =
    retargetHumanoidMotion({
      motion: { ...wave, skeleton: "wrong-source" },
      source: rootless(source),
      target: malformedTarget(target),
      sourceBinding: {
        ...srcBinding,
        boneMap: { ...srcBinding.boneMap, hips: "" },
      },
      targetBinding: {
        ...tgtBinding,
        boneMap: { ...tgtBinding.boneMap, rightHand: "" },
      },
      sourceJointAxes: {
        rightUpperArm: {
          flexion: { x: Number.NaN, y: 0, z: 0 },
          abduction: { x: 0, y: 0, z: 1 },
          twist: { x: 1, y: 0, z: 0 },
        },
      },
      targetJointAxes: {
        leftUpperArm: {
          flexion: { x: 0, y: 1, z: 0 },
          abduction: { x: 0, y: 1, z: 1 },
          twist: { x: 1, y: 0, z: 0 },
        },
        rightUpperArm: {
          flexion: { x: 0, y: 1, z: 0 },
          abduction: { x: 0, y: 0, z: Infinity },
          twist: { x: 1, y: 0, z: 0 },
        },
      },
      sourceRestFrames: {
        rightUpperArm: { abduction: { sign: 0, neutral: 90 } },
      } as unknown as NonNullable<
        Parameters<typeof retargetHumanoidMotion>[0]["sourceRestFrames"]
      >,
      targetRestFrames: {
        rightUpperArm: { abduction: { sign: -1, neutral: Number.NaN } },
      },
      requiredBones: ["rightHand"],
    });
  TestValidator.predicate(
    "malformed retarget reports the source skeleton id field",
    hasViolation(malformed.validation, "type", "$input.motion.skeleton"),
  );
  TestValidator.predicate(
    "rootless source reports automatic scale failure",
    hasViolation(malformed.validation, "range", "$input.source.scale"),
  );
  TestValidator.predicate(
    "rootless target reports automatic scale failure",
    hasViolation(malformed.validation, "range", "$input.target.scale"),
  );
  TestValidator.predicate(
    "source binding reports blank bone map entry",
    hasViolation(
      malformed.validation,
      "type",
      "$input.sourceBinding.boneMap.hips",
    ),
  );
  TestValidator.predicate(
    "target binding reports blank bone map entry",
    hasViolation(
      malformed.validation,
      "type",
      "$input.targetBinding.boneMap.rightHand",
    ),
  );
  TestValidator.predicate(
    "source axes report non-finite component",
    hasViolation(
      malformed.validation,
      "range",
      "$input.sourceJointAxes.rightUpperArm.flexion.x",
    ),
  );
  TestValidator.predicate(
    "target axes report non-finite component",
    hasViolation(
      malformed.validation,
      "range",
      "$input.targetJointAxes.rightUpperArm.abduction.z",
    ),
  );
  TestValidator.predicate(
    "target axes report non-orthogonal basis",
    hasViolation(
      malformed.validation,
      "range",
      "$input.targetJointAxes.leftUpperArm.abduction",
    ),
  );
  TestValidator.predicate(
    "source rest frame reports bad sign",
    hasViolation(
      malformed.validation,
      "type",
      "$input.sourceRestFrames.rightUpperArm.abduction.sign",
    ),
  );
  TestValidator.predicate(
    "target rest frame reports bad neutral",
    hasViolation(
      malformed.validation,
      "range",
      "$input.targetRestFrames.rightUpperArm.abduction.neutral",
    ),
  );
}
