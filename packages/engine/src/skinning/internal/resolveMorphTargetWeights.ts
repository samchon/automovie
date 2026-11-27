import {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMeshMorphTarget,
  IAutoMoviePose,
} from "@automovie/interface";

import { evaluateDrivenCurve } from "../../resolve/internal/evaluateDrivenCurve";

/*
 * Resolve the weights of a mesh's pose-driven morph targets for one pose.
 *
 * Each driven target reads its driver bone's angle on its driver axis from
 * `pose.joints` in degrees, zero when the bone is unlisted or the axis is null,
 * and the last entry when a bone is listed twice, as `resolvePose` reads
 * joints. The weight is `evaluateDrivenCurve` of that angle: piecewise linear
 * between points, holding the end outputs beyond them, unclamped. Targets
 * without a driver are left out, so their weights stay with expressions.
 * Parameter targets: The mesh's morph targets, or just their names and drivers.
 * Parameter pose: The pose being applied.
 * Returns: Weight by target name, for driven targets only.
 */
export function resolveMorphTargetWeights(
  targets: readonly Pick<IAutoMovieMeshMorphTarget, "name" | "driver">[],
  pose: IAutoMoviePose,
): Map<string, number> {
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
}
