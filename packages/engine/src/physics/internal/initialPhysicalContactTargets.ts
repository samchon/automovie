import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePlanPhysicalContactTargets,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { projectPhysicalTargets } from "../projectPhysicalTargets";
import { rebasePhysicalTargets } from "../rebasePhysicalTargets";

/**
 * Project a body's authored joint limits and place the coherent tree at its
 * actual root.
 */
export function initialPhysicalContactTargets(
  input: IAutoMoviePlanPhysicalContactTargets.IInput,
): Record<string, IAutoMovieRigidTransform> {
  const profile: IAutoMoviePhysicalProfile = input.profiles[input.body]!;
  const root: string = profile.segments.find(
    (segment: IAutoMoviePhysicalSegment): boolean =>
      !profile.joints.some(
        (joint: IAutoMoviePhysicalJoint): boolean =>
          joint.child === segment.bone,
      ),
  )!.bone;
  const coherent: Record<string, IAutoMovieRigidTransform> =
    projectPhysicalTargets(profile, input.targets).targets;
  return rebasePhysicalTargets(
    coherent,
    root,
    input.actual[input.body]![root]!,
  );
}
