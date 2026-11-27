import {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  type IAutoMoviePoseLayer,
  IAutoMovieTransform,
} from "@automovie/interface";

const AXES: readonly ["flexion", "abduction", "twist"] = [
  "flexion",
  "abduction",
  "twist",
] as const;

interface IAxisAccumulator {
  /** Summed weight of the layers that set each axis (non-null). */
  weight: [number, number, number];
  /** Summed weight×value of those layers. */
  weighted: [number, number, number];
}

/**
 * Blend a nonempty list of admitted same-skeleton clinical poses by positive
 * finite weights per non-null axis. Bone order follows first appearance; root
 * is the last owning layer's value, else the last non-null root. The result
 * does not clamp ROM.
 */
export function blendPoses(layers: IAutoMoviePoseLayer[]): IAutoMoviePose {
  if (layers.length === 0) throw new Error("blend poses must not be empty");

  const acc: Map<AutoMovieHumanoidBone, IAxisAccumulator> = new Map<
    AutoMovieHumanoidBone,
    IAxisAccumulator
  >();
  const order: AutoMovieHumanoidBone[] = [];
  for (const layer of layers)
    for (const joint of layer.pose.joints) {
      let entry: IAxisAccumulator | undefined = acc.get(joint.bone);
      if (entry === undefined) {
        entry = { weight: [0, 0, 0], weighted: [0, 0, 0] };
        acc.set(joint.bone, entry);
        order.push(joint.bone);
      }
      AXES.forEach(
        (axis: "flexion" | "abduction" | "twist", i: number): void => {
          const value: number | null = joint[axis];
          if (value !== null) {
            entry!.weight[i] += layer.weight;
            entry!.weighted[i] += layer.weight * value;
          }
        },
      );
    }

  const joints: IAutoMovieJointPose[] = order.map(
    (
      bone: AutoMovieHumanoidBone,
    ): {
      bone: AutoMovieHumanoidBone;
      flexion: number | null;
      abduction: number | null;
      twist: number | null;
    } => {
      const entry: IAxisAccumulator = acc.get(bone)!;
      const axisValue: (i: number) => number | null = (
        i: number,
      ): number | null =>
        entry.weight[i] > 0 ? entry.weighted[i] / entry.weight[i] : null;
      return {
        bone,
        flexion: axisValue(0),
        abduction: axisValue(1),
        twist: axisValue(2),
      };
    },
  );

  let root: IAutoMovieTransform | null = layers[0]!.pose.root;
  const owning: IAutoMoviePoseLayer[] = layers.filter(
    (layer: IAutoMoviePoseLayer): boolean => layer.ownsRoot === true,
  );
  if (owning.length > 0) root = owning[owning.length - 1]!.pose.root;
  else
    for (const layer of layers)
      if (layer.pose.root !== null) root = layer.pose.root;

  return { skeleton: layers[0]!.pose.skeleton, root, joints };
}
