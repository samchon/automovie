import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieSkeleton,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

/**
 * Require one connected root and resolvable acyclic ancestry using declared
 * names, parent edges and traversal.
 */
export const validateSkeletonGraph: (
  skeleton: IAutoMovieSkeleton,
  path: string,
  collector: IAutoMovieViolationCollector,
) => void = (
  skeleton: IAutoMovieSkeleton,
  path: string,
  collector: IAutoMovieViolationCollector,
): void => {
  const names: Set<AutoMovieHumanoidBone> = new Set(
    skeleton.bones.map(
      (bone: IAutoMovieBone): AutoMovieHumanoidBone => bone.bone,
    ),
  );
  const roots: string[] = [];
  skeleton.bones.forEach((bone: IAutoMovieBone, i: number): void => {
    if (bone.parent === null) roots.push(bone.bone);
    else if (!names.has(bone.parent))
      collector.push(
        "type",
        `${path}.bones[${i}].parent`,
        `parent "${bone.parent}" is not a bone of this skeleton`,
        bone.parent,
      );
  });
  if (roots.length !== 1) {
    collector.push(
      "type",
      `${path}.bones`,
      `a skeleton needs exactly one root bone (parent: null), but found ${roots.length}`,
      roots,
    );
    return;
  }

  const children: Map<string, string[]> = new Map<string, string[]>();
  for (const bone of skeleton.bones) {
    if (bone.parent === null) continue;
    const list: string[] = children.get(bone.parent) ?? [];
    list.push(bone.bone);
    children.set(bone.parent, list);
  }
  const reached: Set<string> = new Set<string>();
  const queue: string[] = [roots[0]!];
  while (queue.length > 0) {
    const name: string = queue.pop()!;
    if (reached.has(name)) continue;
    reached.add(name);
    queue.push(...(children.get(name) ?? []));
  }
  skeleton.bones.forEach((bone: IAutoMovieBone, i: number): void => {
    if (!reached.has(bone.bone))
      collector.push(
        "type",
        `${path}.bones[${i}]`,
        `bone "${bone.bone}" is not reachable from the root "${roots[0]}" (a detached cycle cannot be posed)`,
        bone.bone,
      );
  });
};
