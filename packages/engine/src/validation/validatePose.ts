import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  type IAutoMovieValidatePose,
  type IAutoMovieViolationCollector,
  type IAutoMovieViolationAppendRotationSink,
} from "@automovie/interface";

import { getConstraint } from "../rom/internal/getConstraint";
import { validateJointRom } from "../rom/internal/validateJointRom";
import { AutoMovieEngineViolationCollector } from "./AutoMovieEngineViolationCollector";
import { validateTransformScalars } from "./internal/validateTransformScalars";

/**
 * Admit skeleton identity, optional root transform, duplicate/undeclared joint
 * bones and effective rig/default ROM.
 */
export function validatePose<Sink extends IAutoMovieViolationAppendRotationSink>(
  props: IAutoMovieValidatePose.IInjectedProps<Sink>,
): Sink;
export function validatePose(
  props: IAutoMovieValidatePose.IProps,
): IAutoMovieViolationCollector;
export function validatePose(
  props: IAutoMovieValidatePose.IInjectedProps<IAutoMovieViolationAppendRotationSink> | IAutoMovieValidatePose.IProps,
): IAutoMovieViolationAppendRotationSink {
  const path: string = props.path ?? "$input";
  const collector: IAutoMovieViolationAppendRotationSink =
    props.collector ?? new AutoMovieEngineViolationCollector();
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
}
