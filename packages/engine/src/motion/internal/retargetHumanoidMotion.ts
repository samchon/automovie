import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieConstraintViolation,
  type IAutoMovieHumanoidRetargetProps,
  type IAutoMovieHumanoidRetargetResult,
  type IAutoMovieHumanoidRigCharacterization,
  IAutoMovieJointAxes,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMovieProfileBinding,
  type IAutoMovieResolvedBone,
  type IAutoMovieRestFrame,
  IAutoMovieSkeleton,
  type IAutoMovieValidation,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { HUMANOID_JOINT_AXES } from "../../kinematics/HUMANOID_JOINT_AXES";
import { resolvePose } from "../../kinematics/internal/resolvePose";
import { skeletonJointAxes } from "../../kinematics/internal/skeletonJointAxes";
import { validateJointAxesBasis } from "../../kinematics/internal/validateJointAxesBasis";
import { HUMANOID_REST_FRAME } from "../../rom/HUMANOID_REST_FRAME";
import { AutoMovieEngineText } from "../../text/AutoMovieEngineText";
import { AutoMovieEngineViolationCollector } from "../../validation/AutoMovieEngineViolationCollector";
import { validateMotion } from "../../validation/internal/validateMotion";
import { validateTransformScalars } from "../../validation/internal/validateTransformScalars";
import { preserveRetargetContacts } from "./preserveRetargetContacts";
import { validateRetargetContacts } from "./validateRetargetContacts";

/*
 * Retarget an admitted clinical clip from one normalized rig to another,
 * scaling root translation by positive explicit scale or target/source rest
 * height and preserving root rotation. Source, rig/mapping and enabled
 * static-contact failures return null motion/characterization with located
 * validation; target-ROM failure also returns null. Dynamic ground callback
 * failures propagate, and contact residual warnings may accompany a successful
 * motion.
 */
export function retargetHumanoidMotion(
  props: IAutoMovieHumanoidRetargetProps,
): IAutoMovieHumanoidRetargetResult {
  const collector: IAutoMovieViolationCollector =
    new AutoMovieEngineViolationCollector();
  const requiredBones: AutoMovieHumanoidBone[] = collectRequiredBones(props);

  const sourceValidation: IAutoMovieValidation = validateMotion({
    motion: props.motion,
    skeleton: props.source,
  });
  const sourceFindings: IAutoMovieConstraintViolation[] =
    sourceValidation.success
      ? (sourceValidation.warnings ?? [])
      : sourceValidation.violations;
  collector.items.push(
    ...sourceFindings.map(
      (
        violation: IAutoMovieConstraintViolation,
      ): IAutoMovieConstraintViolation => ({
        ...violation,
        path: violation.path.replace("$input", "$input.motion"),
      }),
    ),
  );

  const sourceAdmitted: boolean = validateSkeleton(
    "source",
    props.source,
    requiredBones,
    collector,
  );
  const targetAdmitted: boolean = validateSkeleton(
    "target",
    props.target,
    requiredBones,
    collector,
  );
  validateBinding(
    "sourceBinding",
    props.sourceBinding,
    requiredBones,
    collector,
  );
  validateBinding(
    "targetBinding",
    props.targetBinding,
    requiredBones,
    collector,
  );
  // Resolved once: the characterization, the contact pass's source FK, and the
  // contact pass's target FK must all read the clip through the same tables,
  // with each rig's declared bone axes over the host table.
  const sourceJointAxes: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>
  > = skeletonJointAxes(
    props.source,
    props.sourceJointAxes ?? HUMANOID_JOINT_AXES,
  );
  const targetJointAxes: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>
  > = skeletonJointAxes(
    props.target,
    props.targetJointAxes ?? HUMANOID_JOINT_AXES,
  );
  validateAxes(
    "sourceJointAxes",
    props.sourceJointAxes ?? HUMANOID_JOINT_AXES,
    collector,
  );
  validateAxes(
    "targetJointAxes",
    props.targetJointAxes ?? HUMANOID_JOINT_AXES,
    collector,
  );
  validateRestFrames(
    "sourceRestFrames",
    props.sourceRestFrames ?? HUMANOID_REST_FRAME,
    collector,
  );
  validateRestFrames(
    "targetRestFrames",
    props.targetRestFrames ?? HUMANOID_REST_FRAME,
    collector,
  );
  validateRetargetContacts(props.contacts, props.motion.duration, collector);

  const sourceSpan: { floor: number; height: number } | null = sourceAdmitted
    ? restVerticalSpan(props.source)
    : null;
  const targetSpan: { floor: number; height: number } | null = targetAdmitted
    ? restVerticalSpan(props.target)
    : null;
  const sourceHeight: number = sourceSpan?.height ?? Number.NaN;
  const targetHeight: number = targetSpan?.height ?? Number.NaN;
  if (!(sourceHeight > EPSILON))
    collector.push(
      "range",
      "$input.source.scale",
      "source skeleton rest height must be finite and > 0 to derive root scale",
      sourceHeight,
    );
  if (!(targetHeight > EPSILON))
    collector.push(
      "range",
      "$input.target.scale",
      "target skeleton rest height must be finite and > 0 to derive root scale",
      targetHeight,
    );

  const rootScale: number =
    props.rootScale ??
    (sourceHeight > EPSILON ? targetHeight / sourceHeight : 0);
  if (!(rootScale > 0))
    collector.push(
      "range",
      "$input.rootScale",
      "rootScale must be a finite number > 0",
      props.rootScale ?? rootScale,
    );

  if (collector.items.length > 0)
    return {
      validation: collector.toValidation(),
      motion: null,
      characterization: null,
    };

  const sourceRestFrames: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
  > = props.sourceRestFrames ?? HUMANOID_REST_FRAME;
  const targetRestFrames: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
  > = props.targetRestFrames ?? HUMANOID_REST_FRAME;

  const source: IAutoMovieHumanoidRigCharacterization = characterizeRig({
    skeleton: props.source,
    binding: props.sourceBinding,
    height: sourceHeight,
    jointAxes: sourceJointAxes,
    restFrames: sourceRestFrames,
  });
  const target: IAutoMovieHumanoidRigCharacterization = characterizeRig({
    skeleton: props.target,
    binding: props.targetBinding,
    height: targetHeight,
    jointAxes: targetJointAxes,
    restFrames: targetRestFrames,
  });
  const scaled: IAutoMovieMotion = retargetMotion(
    props.motion,
    props.target.id,
    rootScale,
    props.id,
  );

  const contactsEnabled: boolean = props.contacts?.enabled ?? true;
  const motion: IAutoMovieMotion = contactsEnabled
    ? preserveRetargetContacts({
        source: props.source,
        target: props.target,
        sourceMotion: props.motion,
        retargeted: scaled,
        rootScale,
        sourceFloor: sourceSpan!.floor,
        sourceJointAxes,
        sourceRestFrames,
        targetJointAxes,
        targetRestFrames,
        contacts: props.contacts,
        collector,
      })
    : scaled;

  const targetValidation: IAutoMovieValidation = validateMotion({
    motion,
    skeleton: props.target,
  });
  if (!targetValidation.success) {
    collector.items.push(...targetValidation.violations);
    return {
      validation: collector.toValidation(),
      motion: null,
      characterization: null,
    };
  }

  return {
    validation: collector.toValidation(),
    motion,
    characterization: {
      source,
      target,
      rootScale,
      facing: "preserve-authored",
      romPolicy: "target-override-then-default-humanoid",
      contactPolicy: contactsEnabled
        ? "pin-source-contacts"
        : "carry-joint-angles",
      requiredBones,
    },
  };
}

const EPSILON: number = 1e-6;

const collectRequiredBones: (
  props: IAutoMovieHumanoidRetargetProps,
) => AutoMovieHumanoidBone[] = (
  props: IAutoMovieHumanoidRetargetProps,
): AutoMovieHumanoidBone[] => {
  const bones: Set<AutoMovieHumanoidBone> = new Set(["hips"]);
  for (const kf of props.motion.keyframes)
    for (const joint of kf.pose.joints) bones.add(joint.bone);
  for (const bone of props.requiredBones ?? []) bones.add(bone);
  return [...bones].sort(AutoMovieEngineText.compareCodeUnits);
};

const validateSkeleton: (
  label: string,
  skeleton: IAutoMovieSkeleton,
  requiredBones: readonly AutoMovieHumanoidBone[],
  collector: IAutoMovieViolationCollector,
) => boolean = (
  label: string,
  skeleton: IAutoMovieSkeleton,
  requiredBones: readonly AutoMovieHumanoidBone[],
  collector: IAutoMovieViolationCollector,
): boolean => {
  const previousFindings: number = collector.items.length;
  const path: string = `$input.${label}`;
  const byBone: Map<AutoMovieHumanoidBone, number> = new Map();

  skeleton.bones.forEach((bone: IAutoMovieBone, i: number): void => {
    const bonePath: string = `${path}.bones[${i}]`;
    if (byBone.has(bone.bone))
      collector.push(
        "type",
        `${bonePath}.bone`,
        `bone "${bone.bone}" appears more than once in the ${label} skeleton`,
        bone.bone,
      );
    byBone.set(bone.bone, i);
    if (bone.axes !== undefined)
      for (const issue of validateJointAxesBasis(bone.axes, `${bonePath}.axes`))
        collector.push("range", issue.path, issue.expected, issue.value);
    validateTransformScalars({
      transform: bone.rest,
      path: `${bonePath}.rest`,
      label: `${label} bone rest transform`,
      collector,
    });
  });

  for (const bone of skeleton.bones)
    if (bone.parent !== null && !byBone.has(bone.parent))
      collector.push(
        "type",
        `${path}.bones[${byBone.get(bone.bone)!}].parent`,
        `parent bone "${bone.parent}" must be present in the ${label} skeleton`,
        bone.parent,
      );

  for (const bone of requiredBones)
    if (!byBone.has(bone))
      collector.push(
        "type",
        `${path}.bones["${bone}"]`,
        `required bone "${bone}" is missing from the ${label} skeleton`,
        bone,
      );
  return collector.items.length === previousFindings;
};

const validateBinding: (
  label: "sourceBinding" | "targetBinding",
  binding: IAutoMovieProfileBinding | undefined,
  requiredBones: readonly AutoMovieHumanoidBone[],
  collector: IAutoMovieViolationCollector,
) => void = (
  label: "sourceBinding" | "targetBinding",
  binding: IAutoMovieProfileBinding | undefined,
  requiredBones: readonly AutoMovieHumanoidBone[],
  collector: IAutoMovieViolationCollector,
): void => {
  if (binding === undefined) return;
  for (const bone of requiredBones) {
    const mapped: string | undefined = binding.boneMap[bone];
    if (mapped === undefined)
      collector.push(
        "type",
        `$input.${label}.boneMap.${bone}`,
        `binding must map required humanoid bone "${bone}" to a concrete node id`,
        mapped,
      );
  }
};

const validateAxes: (
  label: "sourceJointAxes" | "targetJointAxes",
  axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  collector: IAutoMovieViolationCollector,
) => void = (
  label: "sourceJointAxes" | "targetJointAxes",
  axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  collector: IAutoMovieViolationCollector,
): void => {
  for (const [bone, table] of Object.entries(axes) as [
    AutoMovieHumanoidBone,
    IAutoMovieJointAxes,
  ][])
    for (const issue of validateJointAxesBasis(
      table,
      `$input.${label}.${bone}`,
    ))
      collector.push("range", issue.path, issue.expected, issue.value);
};

const validateRestFrames: (
  label: "sourceRestFrames" | "targetRestFrames",
  frames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
  collector: IAutoMovieViolationCollector,
) => void = (
  label: "sourceRestFrames" | "targetRestFrames",
  frames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
  collector: IAutoMovieViolationCollector,
): void => {
  for (const [bone, frame] of Object.entries(frames) as [
    AutoMovieHumanoidBone,
    IAutoMovieRestFrame,
  ][])
    for (const axis of ["flexion", "abduction", "twist"] as const) {
      const axisFrame: IAutoMovieRestFrame[typeof axis] = frame[axis];
      if (axisFrame === undefined) continue;
      if (axisFrame.sign !== 1 && axisFrame.sign !== -1)
        collector.push(
          "type",
          `$input.${label}.${bone}.${axis}.sign`,
          "rest-frame sign must be 1 or -1",
          axisFrame.sign,
        );
    }
};

/*
 * The rig's rest-pose vertical extent: `height` drives the root-motion scale,
 * `floor` is the world Y its lowest bone sits at, the ground plane the contact
 * pass judges stance against, so a rig authored with its feet above the origin
 * is still detected as standing on something.
 */
const restVerticalSpan: (skeleton: IAutoMovieSkeleton) => {
  floor: number;
  height: number;
} = (skeleton: IAutoMovieSkeleton): { floor: number; height: number } => {
  const resolved: IAutoMovieResolvedBone[] = resolvePose(
    { skeleton: skeleton.id, root: null, joints: [] },
    skeleton,
  );
  if (resolved.length === 0) return { floor: 0, height: 0 };
  let minY: number = Infinity;
  let maxY: number = -Infinity;
  for (const bone of resolved) {
    minY = Math.min(minY, bone.worldPosition.y);
    maxY = Math.max(maxY, bone.worldPosition.y);
  }
  return { floor: minY, height: maxY - minY };
};

const characterizeRig: (props: {
  /*
   * Rig whose unchanged topology and ROM constrain correction.
   */ skeleton: IAutoMovieSkeleton;
  binding: IAutoMovieProfileBinding | undefined;
  height: number;
  jointAxes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;
  restFrames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
}) => IAutoMovieHumanoidRigCharacterization = (props: {
  /*
   * Rig whose unchanged topology and ROM constrain correction.
   */
  skeleton: IAutoMovieSkeleton;
  binding: IAutoMovieProfileBinding | undefined;
  height: number;
  jointAxes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;
  restFrames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
}): IAutoMovieHumanoidRigCharacterization => {
  const slots: Set<AutoMovieHumanoidBone> = new Set(
    props.skeleton.bones.map(
      (bone: IAutoMovieBone): AutoMovieHumanoidBone => bone.bone,
    ),
  );
  const boneMap: Partial<Record<AutoMovieHumanoidBone, string>> = {};
  const jointAxes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> =
    {};
  const restFrames: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
  > = {};

  for (const slot of slots) {
    boneMap[slot] = props.binding?.boneMap[slot] ?? slot;
    if (props.jointAxes[slot] !== undefined)
      jointAxes[slot] = props.jointAxes[slot];
    if (props.restFrames[slot] !== undefined)
      restFrames[slot] = props.restFrames[slot];
  }

  return {
    skeleton: props.skeleton.id,
    boneMap,
    height: props.height,
    jointAxes,
    restFrames,
  };
};

const retargetMotion: (
  motion: IAutoMovieMotion,
  targetSkeleton: string,
  rootScale: number,
  id: string | undefined,
) => IAutoMovieMotion = (
  motion: IAutoMovieMotion,
  targetSkeleton: string,
  rootScale: number,
  id: string | undefined,
): IAutoMovieMotion => ({
  ...motion,
  id: id ?? `${motion.id}:to:${targetSkeleton}`,
  skeleton: targetSkeleton,
  keyframes: motion.keyframes.map(
    (kf: IAutoMovieKeyframe): IAutoMovieKeyframe => ({
      ...kf,
      pose: {
        ...kf.pose,
        skeleton: targetSkeleton,
        root:
          kf.pose.root === null
            ? null
            : {
                ...kf.pose.root,
                translation: {
                  x: kf.pose.root.translation.x * rootScale,
                  y: kf.pose.root.translation.y * rootScale,
                  z: kf.pose.root.translation.z * rootScale,
                },
              },
      },
    }),
  ),
});
