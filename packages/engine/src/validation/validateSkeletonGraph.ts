import { ViolationCollector } from "./ViolationCollector";
import { IAutoMovieSkeleton } from "@automovie/interface";

/**
 * Reports unresolved parents, invalid root counts and unreachable skeleton members in original bone order.
 * @evidence requirements/actors/validation.md#actor-input-binding-validation Checks parent resolution, the single root and reachability without normalizing or repairing the skeleton.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure Checks parent resolution, the single root and reachability without normalizing or repairing the skeleton.
 */
export const validateSkeletonGraph = (
  skeleton: IAutoMovieSkeleton,
  path: string,
  collector: ViolationCollector,
): void => {
  const names = new Set(skeleton.bones.map((bone) => bone.bone));
  const roots: string[] = [];
  skeleton.bones.forEach((bone, i) => {
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

  const children = new Map<string, string[]>();
  for (const bone of skeleton.bones) {
    if (bone.parent === null) continue;
    const list = children.get(bone.parent) ?? [];
    list.push(bone.bone);
    children.set(bone.parent, list);
  }
  const reached = new Set<string>();
  const queue = [roots[0]!];
  while (queue.length > 0) {
    const name = queue.pop()!;
    if (reached.has(name)) continue;
    reached.add(name);
    queue.push(...(children.get(name) ?? []));
  }
  skeleton.bones.forEach((bone, i) => {
    if (!reached.has(bone.bone))
      collector.push(
        "type",
        `${path}.bones[${i}]`,
        `bone "${bone.bone}" is not reachable from the root "${roots[0]}" (a detached cycle cannot be posed)`,
        bone.bone,
      );
  });
};

const CONSTRAINT_AXES = ["flexion", "abduction", "twist"] as const;
