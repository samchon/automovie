import {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMeshMorphTarget,
  IAutoMoviePose,
} from "@automovie/interface";

import { evaluateDrivenCurve } from "../resolve/evaluateDrivenCurve";

/**
 * Resolve the weights of a mesh's pose-driven morph targets for one pose.
 *
 * Each driven target reads its driver bone's angle on its driver axis from
 * `pose.joints` in degrees, zero when the bone is unlisted or the axis is
 * null, and the last entry when a bone is listed twice, as `resolvePose`
 * reads joints. The weight is `evaluateDrivenCurve` of that angle: piecewise
 * linear between points, holding the end outputs beyond them, unclamped.
 * Targets without a driver are left out, so their weights stay with
 * expressions.
 *
 * @param targets The mesh's morph targets.
 * @param pose The pose being applied.
 * @returns Weight by target name, for driven targets only.
 *
 * @evidence contracts/common.md#principled-implementation One clinical angle through a driven-key curve, the single-input form of pose-space deformation; the angle is read from the authored pose because a driver names a clinical axis, the same quantity the pose stores, and evaluateDrivenCurve throws on a malformed curve that admission would have refused.
 * @evidence contracts/common.md#clear-and-simple-design The engine owns the arithmetic and the viewer only writes the returned weights, so a measurement and the render resolve correctives identically; curve evaluation is the clip driver's existing owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No bone, axis or name is special-cased, the weight is not clamped to hide an authored overdrive, and an undriven target gets no invented weight.
 * @evidence contracts/common.md#meaningful-documentation States the angle source and unit, the neutral and duplicate readings, the curve evaluation, that weights are unclamped and that undriven targets are omitted.
 * @evidence contracts/performance.md#efficient-algorithms O(J + T P) for J pose joints, T targets and P curve points: one map of the joints, then one lookup and one curve evaluation per driven target.
 * @evidence contracts/performance.md#reuse-equivalent-work The joint map is built once per call and shared by every target; poses change every frame, so nothing is cached across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the joint map is local and the returned map, one entry per driven target, belongs to the caller.
 * @author Samchon
 */
export const resolveMorphTargetWeights: (
  targets: readonly IAutoMovieMeshMorphTarget[],
  pose: IAutoMoviePose,
) => Map<string, number> = (
  targets: readonly IAutoMovieMeshMorphTarget[],
  pose: IAutoMoviePose,
): Map<string, number> => {
  const joints: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> = new Map(
    pose.joints.map(
      (
        joint: IAutoMovieJointPose,
      ): [AutoMovieHumanoidBone, IAutoMovieJointPose] => [joint.bone, joint],
    ),
  );
  const weights: Map<string, number> = new Map<string, number>();
  for (const target of targets) {
    if (target.driver === undefined || target.driver === null) continue;
    const angle: number =
      joints.get(target.driver.bone)?.[target.driver.axis] ?? 0;
    weights.set(target.name, evaluateDrivenCurve(angle, target.driver.curve));
  }
  return weights;
};
