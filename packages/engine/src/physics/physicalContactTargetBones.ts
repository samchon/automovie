import type {
  IAutoMoviePhysicalContactBinding,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalPointBound,
  IAutoMoviePlanPhysicalContactTargets,
} from "@automovie/interface";

/**
 * Select the original actuator chains, expanding to every joint for self avoidance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies which local bones can supply coordinates in a fit.
 * @evidence contracts/development/implementation.md#principled-implementation Unions active collider chains and point-bound chains or takes all joints for the declared self-avoidance behavior.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One selection serves both the optimizer and mutual dependency admission.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Weight-zero bindings contribute no movable chain; all admitted point bounds contribute their chains.
 * @evidence contracts/development/implementation.md#efficient-algorithms Reads each active chain once; the set collapses overlapping chains before probes.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The legacy fit and the coupled fit use the same coordinate selection.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a local ordered collection and holds no data after the call.
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
