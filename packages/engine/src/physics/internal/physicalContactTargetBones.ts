import type {
  IAutoMoviePhysicalContactBinding,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalPointBound,
  IAutoMoviePlanPhysicalContactTargets,
} from "@automovie/interface";

/*
 * Select the original actuator chains, expanding to every joint for self
 * avoidance.
 */
export function physicalContactTargetBones(
  input: Pick<
    IAutoMoviePlanPhysicalContactTargets.IInput,
    "body" | "profiles" | "bindings" | "pointBounds" | "selfAvoidance"
  >,
): string[] {
  return input.selfAvoidance
    ? input.profiles[input.body]!.joints.map(
        (joint: IAutoMoviePhysicalJoint): string => joint.child,
      )
    : [
        ...new Set([
          ...input.bindings.flatMap(
            (binding: IAutoMoviePhysicalContactBinding): string[] =>
              binding.weight > 0 ? binding.chain : [],
          ),
          ...(input.pointBounds ?? []).flatMap(
            (bound: IAutoMoviePhysicalPointBound): string[] => bound.chain,
          ),
        ]),
      ];
}
