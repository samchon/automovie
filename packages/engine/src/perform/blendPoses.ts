import {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieTransform,
} from "@automovie/interface";
import { IAutoMoviePoseLayer } from "./IAutoMoviePoseLayer";



const AXES: readonly ["flexion", "abduction", "twist"] = ["flexion", "abduction", "twist"] as const;


interface IAxisAccumulator {
  /** Summed weight of the layers that set each axis (non-null). */
  weight: [number, number, number];
  /** Summed weight×value of those layers. */
  weighted: [number, number, number];
}

/**
 * Blend a nonempty list of admitted same-skeleton clinical poses by positive finite weights per non-null axis. Bone order follows first appearance; root is the last owning layer's value, else the last non-null root. The result does not clamp ROM.
 *
 * @evidence contracts/common.md#principled-implementation Accumulates weight and weight-times-value for each bone/axis, then divides only axes with positive accumulated weight; unset axes stay null instead of diluting another layer.
 * @evidence contracts/common.md#clear-and-simple-design One bone-keyed accumulator owns weighted means and root authority, separate from timeline sampling and region masks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixture-specific blending or hidden neutral-angle offset exists; callers supply valid finite weights/angles, and binary64 products/sums must remain representable.
 * @evidence contracts/common.md#meaningful-documentation States clinical weighted means, null-axis treatment, input premises, first-bone order, borrowed root and ROM refusal downstream.
 * @evidence contracts/performance.md#efficient-algorithms For J supplied joint entries, B distinct bones and L layers, O(J+B+L) time and O(B) accumulator/output storage; every set axis must contribute once.
 * @evidence contracts/performance.md#reuse-equivalent-work Each bone has one shared accumulator across layers; sampled poses and the selected root are read directly without another FK or motion bake.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Accumulators are invocation-local and the caller owns fresh joint output; the root remains borrowed and no pose cache, task or external resource persists.
 */
export const blendPoses: (layers: IAutoMoviePoseLayer [ ]) => IAutoMoviePose = (layers: IAutoMoviePoseLayer[]): IAutoMoviePose => {
  if (layers.length === 0) throw new Error("blend poses must not be empty");

  const acc: Map<AutoMovieHumanoidBone, IAxisAccumulator> = new Map<AutoMovieHumanoidBone, IAxisAccumulator>();
  const order: AutoMovieHumanoidBone[] = [];
  for (const layer of layers)
    for (const joint of layer.pose.joints) {
      let entry: IAxisAccumulator | undefined = acc.get(joint.bone);
      if (entry === undefined) {
        entry = { weight: [0, 0, 0], weighted: [0, 0, 0] };
        acc.set(joint.bone, entry);
        order.push(joint.bone);
      }
      AXES.forEach((axis: "flexion" | "abduction" | "twist", i: number) : void => {
        const value: number | null = joint[axis];
        if (value !== null) {
          entry!.weight[i] += layer.weight;
          entry!.weighted[i] += layer.weight * value;
        }
      });
    }

  const joints: IAutoMovieJointPose[] = order.map((bone: AutoMovieHumanoidBone) : { bone: AutoMovieHumanoidBone; flexion: number | null; abduction: number | null; twist: number | null; } => {
    const entry: IAxisAccumulator = acc.get(bone)!;
    const axisValue: (i: number) => number | null = (i: number): number | null =>
      entry.weight[i] > 0 ? entry.weighted[i] / entry.weight[i] : null;
    return {
      bone,
      flexion: axisValue(0),
      abduction: axisValue(1),
      twist: axisValue(2),
    };
  });

  let root: IAutoMovieTransform | null = layers[0]!.pose.root;
  const owning: IAutoMoviePoseLayer[] = layers.filter((layer: IAutoMoviePoseLayer) : boolean => layer.ownsRoot === true);
  if (owning.length > 0) root = owning[owning.length - 1]!.pose.root;
  else
    for (const layer of layers)
      if (layer.pose.root !== null) root = layer.pose.root;

  return { skeleton: layers[0]!.pose.skeleton, root, joints };
};
