import type {
  IAutoMoviePhysicalJoint,
  IAutoMovieRigidTransform,
  IAutoMovieWarmPhysicalSupportTargets,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { physicalJointRelativeRotation } from "./physicalJointRelativeRotation";
import { projectPhysicalJointRotation } from "./projectPhysicalJointRotation";
import { resolvePhysicalSupportRedundancy } from "./resolvePhysicalSupportRedundancy";
import { setPhysicalTargetJointRotation } from "./setPhysicalTargetJointRotation";

/**
 * Carry the previous local support correction through an authored change
 * instead of selecting a fresh straight-chain bend branch, then return its
 * support-task null space to the authored posture so unconstrained swivel or
 * patch yaw cannot accumulate across steps. The original world endpoints, root
 * intent and ROM remain the fitting constraints.
 */
export function warmPhysicalSupportTargets(
  input: IAutoMovieWarmPhysicalSupportTargets.IInput,
): Record<string, IAutoMovieRigidTransform> {
  const targets: Record<string, IAutoMovieRigidTransform> = {
    ...input.targets,
  };
  const owned: Set<string> = new Set();
  for (const segment of input.order) {
    const joint: IAutoMoviePhysicalJoint | undefined = input.joints.get(
      segment.bone,
    );
    if (!joint || !input.selected.has(segment.bone)) continue;
    const relative: IAutoMovieRigidTransform["rotation"] =
      projectPhysicalJointRotation(
        joint,
        Quaternion.multiply(
          Quaternion.multiply(
            physicalJointRelativeRotation(input.targets, joint),
            Quaternion.inverse(
              physicalJointRelativeRotation(input.before, joint),
            ),
          ),
          physicalJointRelativeRotation(input.previous, joint),
        ),
      );
    const descendants: readonly string[] = input.descendants.get(joint.child)!;
    for (const bone of descendants)
      if (!owned.has(bone)) {
        targets[bone] = { ...targets[bone]! };
        owned.add(bone);
      }
    setPhysicalTargetJointRotation(targets, joint, descendants, relative);
  }
  return resolvePhysicalSupportRedundancy({
    order: input.order,
    joints: input.joints,
    descendants: input.descendants,
    selected: input.selected,
    pattern: input.pattern,
    planted: input.planted,
    authored: input.targets,
    tolerance: input.tolerance,
    seed: targets,
  });
}
