import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { getConstraint } from "../rom/getConstraint";
import { validateJointRom } from "../rom/validateJointRom";
import { ViolationCollector } from "./ViolationCollector";
import { validateTransformScalars } from "./validateTransformScalars";

/**
 * Admit skeleton identity, optional root transform, duplicate/undeclared joint bones and effective rig/default ROM.
 *
 * @evidence contracts/common.md#principled-implementation Admit skeleton identity, optional root transform, duplicate/undeclared joint bones and effective rig/default ROM.
 * @evidence contracts/common.md#clear-and-simple-design One by-bone map shares membership lookup; getConstraint/validateJointRom own angular policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null joint angles mean rest and absent effective constraints skip ROM; typed record/list shape is a premise.
 * @evidence contracts/common.md#meaningful-documentation Optional path/collector composition, reported faults and non-clamping behavior are stated.
 * @evidence contracts/performance.md#efficient-algorithms B rig bones and J joints require expected O(B+J) indexing/checks plus fixed axis work.
 * @evidence contracts/performance.md#reuse-equivalent-work The by-bone map is request-local and default constraint/ROM owners are shared.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns diagnostics; temporary map/set storage releases without an FK pose or host resource.
 */
export const validatePose: (props: {
  pose: IAutoMoviePose;
  skeleton: IAutoMovieSkeleton;
  path?: string;
  collector?: ViolationCollector;
}) => ViolationCollector = (props: {
  /** Borrowed pose; null joint angles mean rest and invalid angles are reported without clamping. */
  pose: IAutoMoviePose;

  /** Current rig for bone identity and per-bone/default degree constraints. */
  skeleton: IAutoMovieSkeleton;

  /** Base diagnostic address, defaulting to $input. */
  path?: string;

  /** Optional caller-owned sink; omitted, a fresh collector is returned. */
  collector?: ViolationCollector;
}): ViolationCollector => {
  const path: string = props.path ?? "$input";
  const collector: ViolationCollector =
    props.collector ?? new ViolationCollector();
  const byBone: Map<AutoMovieHumanoidBone, IAutoMovieBone> = new Map(
    props.skeleton.bones.map(
      (b: IAutoMovieBone): [AutoMovieHumanoidBone, IAutoMovieBone] => [
        b.bone,
        b,
      ],
    ),
  );
  const seen: Set<string> = new Set<string>();

  if (props.pose.skeleton !== props.skeleton.id)
    collector.push(
      "type",
      `${path}.skeleton`,
      `pose skeleton "${props.pose.skeleton}" does not match target skeleton "${props.skeleton.id}"`,
      props.pose.skeleton,
    );
  if (props.pose.root !== null)
    validateTransformScalars({
      transform: props.pose.root,
      path: `${path}.root`,
      label: "root transform",
      collector,
    });

  props.pose.joints.forEach((joint: IAutoMovieJointPose, i: number): void => {
    const jointPath: string = `${path}.joints[${i}]`;
    const bone: IAutoMovieBone | undefined = byBone.get(joint.bone);
    if (bone === undefined) {
      collector.push(
        "type",
        `${jointPath}.bone`,
        `bone "${joint.bone}" is not present in the target skeleton`,
        joint.bone,
      );
      return;
    }
    if (seen.has(joint.bone))
      collector.push(
        "type",
        `${jointPath}.bone`,
        `bone "${joint.bone}" is articulated more than once in this pose`,
        joint.bone,
      );
    seen.add(joint.bone);

    const constraint: IAutoMovieJointConstraint | null = getConstraint(
      joint.bone,
      bone.constraint,
    );
    if (constraint !== null)
      validateJointRom({ joint, constraint, path: jointPath, collector });
  });

  return collector;
};
